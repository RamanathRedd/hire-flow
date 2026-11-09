from unittest.mock import MagicMock

import pytest
from fastapi import HTTPException

from core.exceptions import (
    ApplicationAlreadyExistsError,
    ApplicationAlreadyHiredError,
    ApplicationAlreadyRejectedError,
    ApplicationNotExistsError,
    BackwardStageError,
    CandidateNotExistsError,
    DuplicateStageError,
    JobNotExistsError,
    JobNotOpenError,
    RecruiterNotExistsError,
    SkippedStageError,
    UnauthorizedError,
)
from domains.applications import router
from domains.applications.schemas import (
    ApplicationCreate,
    ApplicationFilters,
    RejectApplication,
    UpdateStage,
)


ADMIN = {"id": 3, "role": "Admin"}
USER = {"id": 7, "role": "User"}


def test_create_application_returns_success(monkeypatch):
    monkeypatch.setattr(router.service, "create_application", lambda *args: None)

    assert router.create_application(
        ApplicationCreate(job_id=9), USER, MagicMock()
    ) == {"message": "Application created successfully"}


@pytest.mark.parametrize(
    ("exception", "status_code"),
    [
        (UnauthorizedError, 401),
        (JobNotExistsError, 404),
        (JobNotOpenError, 400),
        (CandidateNotExistsError, 404),
        (ApplicationAlreadyExistsError, 400),
    ],
)
def test_create_application_translates_errors(monkeypatch, exception, status_code):
    def reject(*args):
        raise exception

    monkeypatch.setattr(router.service, "create_application", reject)

    with pytest.raises(HTTPException) as error:
        router.create_application(ApplicationCreate(job_id=9), USER, MagicMock())

    assert error.value.status_code == status_code


def test_get_candidate_applications_returns_service_result(monkeypatch):
    result = {"applications": [], "all_applications": 0}
    monkeypatch.setattr(
        router.service, "get_candidate_applications", lambda *args: result
    )

    assert router.get_candidate_applications(
        USER, ApplicationFilters(), MagicMock()
    ) == result


def test_get_candidate_applications_translates_unauthorized(monkeypatch):
    def reject(*args):
        raise UnauthorizedError

    monkeypatch.setattr(router.service, "get_candidate_applications", reject)

    with pytest.raises(HTTPException) as error:
        router.get_candidate_applications(ADMIN, ApplicationFilters(), MagicMock())

    assert error.value.status_code == 401


@pytest.mark.parametrize(
    "route_name",
    ["get_live_applications", "get_application_counts"],
)
def test_admin_application_lists_return_service_result(monkeypatch, route_name):
    result = [{"label": "Applied", "count": 0}]
    monkeypatch.setattr(router.service, route_name, lambda *args: result)

    assert getattr(router, route_name)(ADMIN, MagicMock()) == result


@pytest.mark.parametrize(
    "route_name",
    ["get_live_applications", "get_application_counts"],
)
def test_admin_application_lists_translate_unauthorized(
    monkeypatch, route_name
):
    def reject(*args):
        raise UnauthorizedError

    monkeypatch.setattr(router.service, route_name, reject)

    with pytest.raises(HTTPException) as error:
        getattr(router, route_name)(USER, MagicMock())

    assert error.value.status_code == 401


def test_get_application_details_returns_wrapped_result(monkeypatch):
    result = {"summary": {}}
    monkeypatch.setattr(router.service, "get_application_details", lambda *args: result)

    assert router.get_application_details(12, USER, MagicMock()) == {"data": result}


@pytest.mark.parametrize(
    ("exception", "status_code"),
    [(UnauthorizedError, 401), (ApplicationNotExistsError, 404)],
)
def test_get_application_details_translates_errors(monkeypatch, exception, status_code):
    def reject(*args):
        raise exception

    monkeypatch.setattr(router.service, "get_application_details", reject)

    with pytest.raises(HTTPException) as error:
        router.get_application_details(12, USER, MagicMock())

    assert error.value.status_code == status_code


def test_update_application_stage_returns_success(monkeypatch):
    monkeypatch.setattr(router.service, "update_application_stage", lambda *args: None)

    assert router.update_application_stage(
        12, UpdateStage(new_stage="Screened"), ADMIN, MagicMock()
    ) == {"message": "Updated Successfully"}


def test_update_application_stage_requires_reject_endpoint():
    with pytest.raises(HTTPException) as error:
        router.update_application_stage(
            12, UpdateStage(new_stage="Rejected"), ADMIN, MagicMock()
        )

    assert error.value.status_code == 400


@pytest.mark.parametrize(
    ("exception", "status_code"),
    [
        (UnauthorizedError, 401),
        (RecruiterNotExistsError, 404),
        (ApplicationNotExistsError, 404),
        (ApplicationAlreadyRejectedError, 400),
        (ApplicationAlreadyHiredError, 400),
        (DuplicateStageError, 400),
        (BackwardStageError, 400),
        (SkippedStageError("Screened"), 400),
    ],
)
def test_update_application_stage_translates_errors(
    monkeypatch, exception, status_code
):
    def reject(*args):
        raise exception

    monkeypatch.setattr(router.service, "update_application_stage", reject)

    with pytest.raises(HTTPException) as error:
        router.update_application_stage(
            12, UpdateStage(new_stage="Interview_R1"), ADMIN, MagicMock()
        )

    assert error.value.status_code == status_code


def test_reject_application_returns_success(monkeypatch):
    monkeypatch.setattr(router.service, "reject_application", lambda *args: None)

    assert router.reject_application(
        12, RejectApplication(rejection_reason="Role closed"), ADMIN, MagicMock()
    ) == {"message": "Application rejected successfully"}


@pytest.mark.parametrize(
    ("exception", "status_code"),
    [
        (UnauthorizedError, 401),
        (RecruiterNotExistsError, 404),
        (ApplicationNotExistsError, 404),
        (ApplicationAlreadyRejectedError, 400),
        (ApplicationAlreadyHiredError, 400),
    ],
)
def test_reject_application_translates_errors(monkeypatch, exception, status_code):
    def reject(*args):
        raise exception

    monkeypatch.setattr(router.service, "reject_application", reject)

    with pytest.raises(HTTPException) as error:
        router.reject_application(
            12, RejectApplication(rejection_reason="Role closed"), ADMIN, MagicMock()
        )

    assert error.value.status_code == status_code


def test_get_application_timeline_returns_wrapped_result(monkeypatch):
    result = {"timeline": []}
    monkeypatch.setattr(router.service, "get_application_timeline", lambda *args: result)

    assert router.get_application_timeline(12, USER, MagicMock()) == {"data": result}


@pytest.mark.parametrize(
    ("exception", "status_code"),
    [(UnauthorizedError, 401), (ApplicationNotExistsError, 404)],
)
def test_get_application_timeline_translates_errors(
    monkeypatch, exception, status_code
):
    def reject(*args):
        raise exception

    monkeypatch.setattr(router.service, "get_application_timeline", reject)

    with pytest.raises(HTTPException) as error:
        router.get_application_timeline(12, USER, MagicMock())

    assert error.value.status_code == status_code
