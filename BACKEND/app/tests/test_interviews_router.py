from datetime import datetime, timedelta, timezone
from unittest.mock import MagicMock

import pytest
from fastapi import HTTPException

from core.exceptions import (
    ApplicationNotExistsError,
    ClosedApplicationError,
    DuplicateRoundError,
    FeedbackEmptyError,
    InterviewAlreadyCancelledError,
    InterviewAlreadyCompletedError,
    InterviewDetailsNotExistsError,
    RecruiterNotExistsError,
    RejectedApplicationError,
    UnauthorizedError,
    UnscreenedApplicationError,
)
from domains.interviews import router
from domains.interviews.schemas import (
    CancelInterview,
    InterviewCreate,
    InterviewFilters,
    SubmitFeedback,
    UpdateInterview,
)


ADMIN = {"id": 3, "role": "Admin"}
USER = {"id": 7, "role": "User"}


def future_time():
    return datetime.now(timezone.utc) + timedelta(days=2)


def test_create_interview_returns_success(monkeypatch):
    monkeypatch.setattr(router.service, "create_interview", lambda *args: None)
    details = InterviewCreate(
        application_id=8,
        round_number=1,
        round_type="Technical",
        scheduled_at=future_time(),
        interviewer_id=3,
    )

    assert router.create_interview(details, ADMIN, MagicMock()) == {
        "message": "created successfully"
    }


@pytest.mark.parametrize(
    ("exception", "status_code"),
    [
        (UnauthorizedError, 401),
        (RecruiterNotExistsError, 404),
        (ApplicationNotExistsError, 404),
        (UnscreenedApplicationError, 400),
        (RejectedApplicationError, 400),
        (ClosedApplicationError, 400),
        (DuplicateRoundError, 400),
        (ValueError, 400),
    ],
)
def test_create_interview_translates_errors(monkeypatch, exception, status_code):
    def reject(*args):
        if exception is ValueError:
            raise ValueError("invalid schedule")
        raise exception

    monkeypatch.setattr(router.service, "create_interview", reject)
    details = InterviewCreate(
        application_id=8,
        round_number=1,
        round_type="Technical",
        scheduled_at=future_time(),
        interviewer_id=3,
    )

    with pytest.raises(HTTPException) as error:
        router.create_interview(details, ADMIN, MagicMock())

    assert error.value.status_code == status_code


@pytest.mark.parametrize(
    ("route_name", "service_name"),
    [
        ("get_interviews", "get_interviews"),
        ("list_upcoming_interviews", "list_upcoming_interviews"),
    ],
)
def test_interview_list_routes_return_results(monkeypatch, route_name, service_name):
    result = {"interviews": []}
    monkeypatch.setattr(router.service, service_name, lambda *args: result)

    assert getattr(router, route_name)(ADMIN, InterviewFilters(), MagicMock()) == result


@pytest.mark.parametrize(
    ("route_name", "service_name"),
    [
        ("get_interviews", "get_interviews"),
        ("list_upcoming_interviews", "list_upcoming_interviews"),
    ],
)
def test_interview_list_routes_translate_unauthorized(
    monkeypatch, route_name, service_name
):
    def reject(*args):
        raise UnauthorizedError

    monkeypatch.setattr(router.service, service_name, reject)

    with pytest.raises(HTTPException) as error:
        getattr(router, route_name)(USER, InterviewFilters(), MagicMock())

    assert error.value.status_code == 401


def test_get_interview_details_returns_wrapped_result(monkeypatch):
    result = {"id": 14}
    monkeypatch.setattr(router.service, "get_interview_details", lambda *args: result)

    assert router.get_interview_details(14, ADMIN, MagicMock()) == {"data": result}


@pytest.mark.parametrize(
    ("exception", "status_code"),
    [(UnauthorizedError, 401), (InterviewDetailsNotExistsError, 404)],
)
def test_get_interview_details_translates_errors(monkeypatch, exception, status_code):
    def reject(*args):
        raise exception

    monkeypatch.setattr(router.service, "get_interview_details", reject)

    with pytest.raises(HTTPException) as error:
        router.get_interview_details(14, ADMIN, MagicMock())

    assert error.value.status_code == status_code


def test_reschedule_interview_returns_success(monkeypatch):
    monkeypatch.setattr(router.service, "reschedule_interview", lambda *args: None)
    update = UpdateInterview(interviewer_id=3, scheduled_at=future_time())

    assert router.reschedule_interview(14, update, ADMIN, MagicMock()) == {
        "message": "updated successfully"
    }


@pytest.mark.parametrize(
    ("exception", "status_code"),
    [
        (UnauthorizedError, 401),
        (RecruiterNotExistsError, 404),
        (InterviewDetailsNotExistsError, 404),
        (InterviewAlreadyCompletedError, 400),
        (InterviewAlreadyCancelledError, 400),
        (ValueError, 400),
    ],
)
def test_reschedule_interview_translates_errors(monkeypatch, exception, status_code):
    def reject(*args):
        if exception is ValueError:
            raise ValueError("invalid schedule")
        raise exception

    monkeypatch.setattr(router.service, "reschedule_interview", reject)
    update = UpdateInterview(interviewer_id=3, scheduled_at=future_time())

    with pytest.raises(HTTPException) as error:
        router.reschedule_interview(14, update, ADMIN, MagicMock())

    assert error.value.status_code == status_code


def test_cancel_interview_returns_success(monkeypatch):
    monkeypatch.setattr(router.service, "cancel_interview", lambda *args: None)

    assert router.cancel_interview(
        14, CancelInterview(), ADMIN, MagicMock()
    ) == {"message": "Interview cancelled successfully"}


@pytest.mark.parametrize(
    ("exception", "status_code"),
    [
        (UnauthorizedError, 401),
        (InterviewDetailsNotExistsError, 404),
        (RecruiterNotExistsError, 404),
        (InterviewAlreadyCompletedError, 400),
        (InterviewAlreadyCancelledError, 400),
    ],
)
def test_cancel_interview_translates_errors(monkeypatch, exception, status_code):
    def reject(*args):
        raise exception

    monkeypatch.setattr(router.service, "cancel_interview", reject)

    with pytest.raises(HTTPException) as error:
        router.cancel_interview(14, CancelInterview(), ADMIN, MagicMock())

    assert error.value.status_code == status_code


def test_submit_interview_feedback_returns_success(monkeypatch):
    monkeypatch.setattr(
        router.service, "submit_interview_feedback", lambda *args: None
    )

    assert router.submit_interview_feedback(
        14, SubmitFeedback(feedback="Good", rating=4), ADMIN, MagicMock()
    ) == {"message": "Feedback submitted successfully"}


@pytest.mark.parametrize(
    ("exception", "status_code"),
    [
        (UnauthorizedError, 401),
        (FeedbackEmptyError, 400),
        (InterviewDetailsNotExistsError, 404),
        (RecruiterNotExistsError, 404),
        (InterviewAlreadyCompletedError, 400),
        (InterviewAlreadyCancelledError, 400),
    ],
)
def test_submit_interview_feedback_translates_errors(
    monkeypatch, exception, status_code
):
    def reject(*args):
        raise exception

    monkeypatch.setattr(router.service, "submit_interview_feedback", reject)

    with pytest.raises(HTTPException) as error:
        router.submit_interview_feedback(
            14, SubmitFeedback(feedback="Good", rating=4), ADMIN, MagicMock()
        )

    assert error.value.status_code == status_code
