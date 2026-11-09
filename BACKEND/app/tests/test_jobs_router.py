from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest
from fastapi import HTTPException

from core.exceptions import (
    ActiveApplicationsExistsError,
    JobNotExistsError,
    RecruiterNotExistsError,
    SameStatusError,
    UnauthorizedError,
)
from domains.jobs import router
from domains.jobs.schemas import JobApplicationFilters, JobCreate, JobFilters, JobUpdate


ADMIN = {"id": 3, "role": "Admin"}
USER = {"id": 7, "role": "User"}


def job_data():
    return JobCreate(
        title="Backend Engineer",
        department="Engineering",
        location="Remote",
        job_type="Full-time",
        description="Build backend services",
        requirements="Python and APIs",
        status="Open",
        openings_count=2,
    )


def test_create_job_returns_success(monkeypatch):
    monkeypatch.setattr(router.service, "create_job", lambda *args: None)

    assert router.create_job(job_data(), ADMIN, MagicMock()) == {
        "message": "Job created successfully"
    }


@pytest.mark.parametrize(
    ("exception", "status_code"),
    [(UnauthorizedError, 401), (RecruiterNotExistsError, 404)],
)
def test_create_job_translates_errors(monkeypatch, exception, status_code):
    def reject(*args):
        raise exception

    monkeypatch.setattr(router.service, "create_job", reject)

    with pytest.raises(HTTPException) as error:
        router.create_job(job_data(), ADMIN, MagicMock())

    assert error.value.status_code == status_code


def test_get_jobs_serializes_results(monkeypatch):
    jobs = [MagicMock(), MagicMock()]
    monkeypatch.setattr(router.service, "get_jobs", lambda *args: jobs)
    monkeypatch.setattr(router, "_serialize_job", lambda job: {"id": len(job._mock_children)})

    assert router.get_jobs(ADMIN, JobFilters(), MagicMock()) == [
        {"id": 0},
        {"id": 0},
    ]


def test_get_jobs_translates_unauthorized(monkeypatch):
    def reject(*args):
        raise UnauthorizedError

    monkeypatch.setattr(router.service, "get_jobs", reject)

    with pytest.raises(HTTPException) as error:
        router.get_jobs(USER, JobFilters(), MagicMock())

    assert error.value.status_code == 401


def test_serialize_job_includes_recruiter_and_applicant_count():
    job = SimpleNamespace(
        __table__=SimpleNamespace(
            columns=[SimpleNamespace(name="id"), SimpleNamespace(name="title")]
        ),
        id=9,
        title="Backend Engineer",
        recruiter=SimpleNamespace(name="Riley Recruiter"),
        applications=[MagicMock(), MagicMock()],
    )

    result = router._serialize_job(job)

    assert result == {
        "id": 9,
        "title": "Backend Engineer",
        "recruiter_name": "Riley Recruiter",
        "applicant_count": 2,
    }


def test_serialize_job_handles_missing_recruiter():
    job = SimpleNamespace(
        __table__=SimpleNamespace(columns=[SimpleNamespace(name="id")]),
        id=9,
        recruiter=None,
        applications=[],
    )

    assert router._serialize_job(job) == {
        "id": 9,
        "recruiter_name": None,
        "applicant_count": 0,
    }


def test_get_job_by_id_returns_wrapped_result(monkeypatch):
    job = MagicMock()
    monkeypatch.setattr(router.service, "get_job_by_id", lambda *args: job)

    assert router.get_job_by_id(9, USER, MagicMock()) == {"data": job}


@pytest.mark.parametrize(
    ("exception", "status_code"),
    [(UnauthorizedError, 401), (JobNotExistsError, 404)],
)
def test_get_job_by_id_translates_errors(monkeypatch, exception, status_code):
    def reject(*args):
        raise exception

    monkeypatch.setattr(router.service, "get_job_by_id", reject)

    with pytest.raises(HTTPException) as error:
        router.get_job_by_id(9, USER, MagicMock())

    assert error.value.status_code == status_code


def test_update_job_returns_success(monkeypatch):
    monkeypatch.setattr(router.service, "update_job", lambda *args: None)

    assert router.update_job(9, ADMIN, JobUpdate(description="Updated posting"), MagicMock()) == {
        "message": "Job updated successfully"
    }


@pytest.mark.parametrize(
    ("exception", "status_code"),
    [(UnauthorizedError, 401), (JobNotExistsError, 404)],
)
def test_update_job_translates_errors(monkeypatch, exception, status_code):
    def reject(*args):
        raise exception

    monkeypatch.setattr(router.service, "update_job", reject)

    with pytest.raises(HTTPException) as error:
        router.update_job(9, ADMIN, JobUpdate(), MagicMock())

    assert error.value.status_code == status_code


def test_delete_job_returns_success(monkeypatch):
    monkeypatch.setattr(router.service, "delete_job", lambda *args: None)

    assert router.delete_job(9, ADMIN, MagicMock()) == {
        "message": "Job deleted successfully"
    }


@pytest.mark.parametrize(
    ("exception", "status_code"),
    [
        (UnauthorizedError, 401),
        (JobNotExistsError, 404),
        (ActiveApplicationsExistsError, 400),
    ],
)
def test_delete_job_translates_errors(monkeypatch, exception, status_code):
    def reject(*args):
        raise exception

    monkeypatch.setattr(router.service, "delete_job", reject)

    with pytest.raises(HTTPException) as error:
        router.delete_job(9, ADMIN, MagicMock())

    assert error.value.status_code == status_code


def test_update_job_status_returns_success(monkeypatch):
    monkeypatch.setattr(router.service, "update_job_status", lambda *args: None)

    assert router.update_job_status(9, "Open", ADMIN, MagicMock()) == {
        "message": "Job status updated successfully"
    }


@pytest.mark.parametrize(
    ("exception", "status_code"),
    [(UnauthorizedError, 401), (JobNotExistsError, 404), (SameStatusError, 400)],
)
def test_update_job_status_translates_errors(monkeypatch, exception, status_code):
    def reject(*args):
        raise exception

    monkeypatch.setattr(router.service, "update_job_status", reject)

    with pytest.raises(HTTPException) as error:
        router.update_job_status(9, "Open", ADMIN, MagicMock())

    assert error.value.status_code == status_code


def test_get_job_applications_returns_wrapped_result(monkeypatch):
    result = {"total_applications": 1}
    monkeypatch.setattr(router.service, "get_job_applications", lambda *args: result)

    assert router.get_job_applications(9, ADMIN, MagicMock()) == {"data": result}


@pytest.mark.parametrize(
    ("exception", "status_code"),
    [(UnauthorizedError, 401), (JobNotExistsError, 404)],
)
def test_get_job_applications_translates_errors(monkeypatch, exception, status_code):
    def reject(*args):
        raise exception

    monkeypatch.setattr(router.service, "get_job_applications", reject)

    with pytest.raises(HTTPException) as error:
        router.get_job_applications(9, ADMIN, MagicMock())

    assert error.value.status_code == status_code


def test_get_job_filtered_applications_returns_result(monkeypatch):
    result = {"applications": []}
    monkeypatch.setattr(
        router.service, "get_job_filtered_applications", lambda *args: result
    )

    assert router.get_job_filtered_applications(
        9, ADMIN, JobApplicationFilters(), MagicMock()
    ) == result


@pytest.mark.parametrize(
    ("exception", "status_code"),
    [(UnauthorizedError, 401), (JobNotExistsError, 404)],
)
def test_get_job_filtered_applications_translates_errors(
    monkeypatch, exception, status_code
):
    def reject(*args):
        raise exception

    monkeypatch.setattr(router.service, "get_job_filtered_applications", reject)

    with pytest.raises(HTTPException) as error:
        router.get_job_filtered_applications(
            9, ADMIN, JobApplicationFilters(), MagicMock()
        )

    assert error.value.status_code == status_code
