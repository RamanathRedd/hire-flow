from datetime import datetime, timezone
from unittest.mock import MagicMock

import pytest
from fastapi import HTTPException

from core.exceptions import (
    ActiveJobExistsError,
    PhoneAlreadyExistsError,
    RecruiterNotExistsError,
    UnauthorizedError,
)
from domains.recruiters import router
from domains.recruiters.schemas import RecruiterUpdate


ADMIN = {"id": 3, "role": "Admin"}
USER = {"id": 7, "role": "User"}


def test_get_recruiters_returns_service_result(monkeypatch):
    recruiters = [MagicMock()]
    monkeypatch.setattr(router.service, "get_recruiters", lambda *args: recruiters)

    assert router.get_recruiters(ADMIN, "Engineering", MagicMock()) == recruiters


def test_get_recruiters_translates_unauthorized(monkeypatch):
    def reject(*args):
        raise UnauthorizedError

    monkeypatch.setattr(router.service, "get_recruiters", reject)

    with pytest.raises(HTTPException) as error:
        router.get_recruiters(USER, None, MagicMock())

    assert error.value.status_code == 401


def test_get_recruiter_details_returns_profile_and_job_stats(monkeypatch):
    created_at = datetime.now(timezone.utc)
    recruiter = MagicMock(
        id=3,
        name="Riley Recruiter",
        email="riley@example.com",
        phone="1234567890",
        department="Engineering",
        created_at=created_at,
    )
    open_job = MagicMock(
        id=1,
        title="Backend Engineer",
        status="Open",
        openings_count=3,
        filled_count=1,
        created_at=created_at,
    )
    closed_job = MagicMock(
        id=2,
        title="Designer",
        status="Closed",
        openings_count=1,
        filled_count=1,
        created_at=created_at,
    )
    db = MagicMock()
    db.scalars.return_value.all.return_value = [open_job, closed_job]
    monkeypatch.setattr(router.service, "get_recruiter_details", lambda *args: recruiter)

    result = router.get_recruiter_details(ADMIN, db)

    assert result["id"] == 3
    assert result["stats"] == {"total_jobs_created": 2, "active_jobs": 1}
    assert [job["status"] for job in result["jobs"]] == ["Open", "Closed"]


def test_get_recruiter_details_returns_404_for_missing_profile(monkeypatch):
    monkeypatch.setattr(router.service, "get_recruiter_details", lambda *args: None)

    with pytest.raises(HTTPException) as error:
        router.get_recruiter_details(ADMIN, MagicMock())

    assert error.value.status_code == 404


def test_get_recruiter_details_translates_unauthorized(monkeypatch):
    def reject(*args):
        raise UnauthorizedError

    monkeypatch.setattr(router.service, "get_recruiter_details", reject)

    with pytest.raises(HTTPException) as error:
        router.get_recruiter_details(USER, MagicMock())

    assert error.value.status_code == 401


def test_update_recruiter_returns_success(monkeypatch):
    update = MagicMock(spec=RecruiterUpdate)
    monkeypatch.setattr(router.service, "update_recruiter", lambda *args: None)

    assert router.update_recruiter(3, update, ADMIN, MagicMock()) == {
        "message": "Recruiter profile updated successfully"
    }


@pytest.mark.parametrize(
    ("exception", "status_code"),
    [(UnauthorizedError, 401), (RecruiterNotExistsError, 404), (PhoneAlreadyExistsError, 400)],
)
def test_update_recruiter_translates_errors(monkeypatch, exception, status_code):
    def reject(*args):
        raise exception

    monkeypatch.setattr(router.service, "update_recruiter", reject)

    with pytest.raises(HTTPException) as error:
        router.update_recruiter(3, RecruiterUpdate(), ADMIN, MagicMock())

    assert error.value.status_code == status_code


def test_delete_recruiter_returns_success(monkeypatch):
    monkeypatch.setattr(router.service, "delete_recruiter", lambda *args: None)

    assert router.delete_recruiter(3, ADMIN, MagicMock()) == {
        "message": "Recruiter Deleted Successfully"
    }


@pytest.mark.parametrize(
    ("exception", "status_code"),
    [
        (UnauthorizedError, 401),
        (ActiveJobExistsError, 400),
        (RecruiterNotExistsError, 404),
    ],
)
def test_delete_recruiter_translates_errors(monkeypatch, exception, status_code):
    def reject(*args):
        raise exception

    monkeypatch.setattr(router.service, "delete_recruiter", reject)

    with pytest.raises(HTTPException) as error:
        router.delete_recruiter(3, ADMIN, MagicMock())

    assert error.value.status_code == status_code
