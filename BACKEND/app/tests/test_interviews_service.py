from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest

from core.exceptions import (
    ApplicationNotExistsError,
    FeedbackEmptyError,
    InterviewAlreadyCancelledError,
    InterviewAlreadyCompletedError,
    InterviewDetailsNotExistsError,
    RecruiterNotExistsError,
    UnauthorizedError,
    UnscreenedApplicationError,
)
from domains.interviews import service
from domains.interviews.model import Interview
from domains.interviews.schemas import (
    CancelInterview,
    InterviewFilters,
    InterviewCreate,
    SubmitFeedback,
    UpdateInterview,
)


@pytest.fixture
def admin():
    return {"id": 3, "role": "Admin"}


def future_time():
    return datetime.now(timezone.utc) + timedelta(days=2)


def test_create_interview_saves_future_screened_application(db, admin):
    db.scalar.side_effect = [
        MagicMock(),
        MagicMock(stage="Screened"),
        None,
    ]
    details = InterviewCreate(
        application_id=8,
        round_number=1,
        round_type="Technical",
        scheduled_at=future_time(),
        interviewer_id=3,
    )

    service.create_interview(db, details, admin)

    interview = db.add.call_args.args[0]
    assert isinstance(interview, Interview)
    assert interview.application_id == 8
    assert interview.interviewer_id == 3
    assert interview.scheduled_at.tzinfo == timezone.utc
    db.commit.assert_called_once_with()


def test_create_interview_requires_admin(db):
    with pytest.raises(UnauthorizedError):
        service.create_interview(db, MagicMock(), {"id": 3, "role": "User"})

    db.scalar.assert_not_called()


def test_create_interview_rejects_missing_interviewer(db, admin):
    db.scalar.return_value = None
    details = InterviewCreate(
        application_id=8,
        round_number=1,
        round_type="Technical",
        scheduled_at=future_time(),
        interviewer_id=3,
    )

    with pytest.raises(RecruiterNotExistsError):
        service.create_interview(db, details, admin)

    db.add.assert_not_called()


def test_create_interview_rejects_past_schedule(db, admin):
    db.scalar.return_value = MagicMock()
    details = InterviewCreate(
        application_id=8,
        round_number=1,
        round_type="Technical",
        scheduled_at=datetime.now(timezone.utc) - timedelta(days=1),
        interviewer_id=3,
    )

    with pytest.raises(ValueError, match="must be in the future"):
        service.create_interview(db, details, admin)


def test_create_interview_rejects_missing_application(db, admin):
    db.scalar.side_effect = [MagicMock(), None]
    details = InterviewCreate(
        application_id=8,
        round_number=1,
        round_type="Technical",
        scheduled_at=future_time(),
        interviewer_id=3,
    )

    with pytest.raises(ApplicationNotExistsError):
        service.create_interview(db, details, admin)


def test_create_interview_rejects_unscreened_application(db, admin):
    db.scalar.side_effect = [MagicMock(), MagicMock(stage="Applied")]
    details = InterviewCreate(
        application_id=8,
        round_number=1,
        round_type="Technical",
        scheduled_at=future_time(),
        interviewer_id=3,
    )

    with pytest.raises(UnscreenedApplicationError):
        service.create_interview(db, details, admin)


@pytest.mark.parametrize(
    ("stage", "exception"),
    [
        ("Rejected", service.RejectedApplicationError),
        ("Hired", service.ClosedApplicationError),
    ],
)
def test_create_interview_rejects_terminal_application_stages(db, admin, stage, exception):
    db.scalar.side_effect = [MagicMock(), MagicMock(stage=stage)]
    details = InterviewCreate(
        application_id=8,
        round_number=1,
        round_type="Technical",
        scheduled_at=future_time(),
        interviewer_id=3,
    )

    with pytest.raises(exception):
        service.create_interview(db, details, admin)


def test_create_interview_rejects_duplicate_round(db, admin):
    db.scalar.side_effect = [MagicMock(), MagicMock(stage="Screened"), 18]
    details = InterviewCreate(
        application_id=8,
        round_number=1,
        round_type="Technical",
        scheduled_at=future_time(),
        interviewer_id=3,
    )

    with pytest.raises(service.DuplicateRoundError):
        service.create_interview(db, details, admin)



def test_cancel_interview_sets_status_and_reason(db, admin):
    interview = MagicMock(status="Scheduled")
    db.scalar.side_effect = [MagicMock(), interview]
    cancellation = CancelInterview(cancellation_reason="Interviewer unavailable")

    service.cancel_interview(db, 14, cancellation, admin)

    assert interview.status == "Cancelled"
    assert interview.interviewer_id == 3
    assert interview.cancellation_reason == "Interviewer unavailable"
    db.commit.assert_called_once_with()


def test_cancel_interview_rejects_completed_interview(db, admin):
    interview = MagicMock(status="Completed")
    db.scalar.side_effect = [MagicMock(), interview]

    with pytest.raises(InterviewAlreadyCompletedError):
        service.cancel_interview(db, 14, CancelInterview(), admin)

    db.commit.assert_not_called()


def test_cancel_interview_requires_admin(db):
    with pytest.raises(UnauthorizedError):
        service.cancel_interview(
            db, 14, CancelInterview(), {"id": 3, "role": "User"}
        )

    db.scalar.assert_not_called()


def test_submit_feedback_marks_interview_completed(db, admin):
    interview = MagicMock(status="Scheduled")
    db.scalar.side_effect = [MagicMock(), interview]
    feedback = SubmitFeedback(feedback="Strong technical skills", rating=5)

    service.submit_interview_feedback(db, 14, feedback, admin)

    assert interview.status == "Completed"
    assert interview.interviewer_id == 3
    assert interview.feedback == "Strong technical skills"
    assert interview.rating == 5
    db.commit.assert_called_once_with()


def test_submit_feedback_rejects_blank_feedback(db, admin):
    feedback = SubmitFeedback(feedback="   ", rating=4)

    with pytest.raises(FeedbackEmptyError):
        service.submit_interview_feedback(db, 14, feedback, admin)

    db.scalar.assert_not_called()


def test_submit_feedback_requires_admin(db):
    with pytest.raises(UnauthorizedError):
        service.submit_interview_feedback(
            db,
            14,
            SubmitFeedback(feedback="Good feedback", rating=4),
            {"id": 3, "role": "User"},
        )

    db.scalar.assert_not_called()


def test_reschedule_interview_updates_interviewer_and_time(db, admin):
    interview = MagicMock(status="Scheduled")
    db.scalar.side_effect = [MagicMock(), interview, MagicMock()]
    scheduled_at = future_time()
    update = UpdateInterview(interviewer_id=5, scheduled_at=scheduled_at)

    service.reschedule_interview(db, 14, update, admin)

    assert interview.interviewer_id == 5
    assert interview.status == "Rescheduled"
    assert interview.scheduled_at.tzinfo == timezone.utc
    db.commit.assert_called_once_with()


def test_reschedule_interview_rejects_cancelled_interview(db, admin):
    interview = MagicMock(status="Cancelled")
    db.scalar.side_effect = [MagicMock(), interview]
    update = UpdateInterview(interviewer_id=5, scheduled_at=future_time())

    with pytest.raises(InterviewAlreadyCancelledError):
        service.reschedule_interview(db, 14, update, admin)

    db.commit.assert_not_called()


def test_reschedule_interview_rejects_completed_interview(db, admin):
    interview = MagicMock(status="Completed")
    db.scalar.side_effect = [MagicMock(), interview]
    update = UpdateInterview(interviewer_id=5, scheduled_at=future_time())

    with pytest.raises(InterviewAlreadyCompletedError):
        service.reschedule_interview(db, 14, update, admin)

    db.commit.assert_not_called()


def test_reschedule_interview_requires_admin(db):
    with pytest.raises(UnauthorizedError):
        service.reschedule_interview(
            db,
            14,
            UpdateInterview(interviewer_id=5, scheduled_at=future_time()),
            {"id": 3, "role": "User"},
        )

    db.scalar.assert_not_called()


def test_get_interview_details_returns_related_records(db, admin):
    interview = MagicMock(
        id=14,
        round_number=1,
        round_type="Technical",
        scheduled_at=future_time(),
        interviewer_name="Riley Recruiter",
        interviewer_id=3,
        status="Scheduled",
        feedback=None,
        rating=None,
        created_at=None,
        updated_at=None,
    )
    candidate = MagicMock(
        id=5,
        email="casey@example.com",
        experience_years=5,
        skills=["Python"],
    )
    candidate.name = "Casey Candidate"
    job = MagicMock(
        id=9, title="Backend Engineer", department="Engineering", location="Remote"
    )
    interview.application = MagicMock(
        id=8, stage="Interview_R1", candidate=candidate, job=job
    )
    db.scalar.return_value = interview

    result = service.get_interview_details(db, 14, admin)

    assert result["application"] == {"application_id": 8, "stage": "Interview_R1"}
    assert result["candidate"]["name"] == "Casey Candidate"
    assert result["job"]["title"] == "Backend Engineer"


def test_get_interview_details_rejects_missing_record(db, admin):
    db.scalar.return_value = None

    with pytest.raises(InterviewDetailsNotExistsError):
        service.get_interview_details(db, 14, admin)


def test_get_interviews_returns_summary_and_serialized_rows(db, admin):
    interview = SimpleNamespace(
        id=14,
        application_id=8,
        round_number=1,
        round_type="Technical",
        scheduled_at=future_time(),
        interviewer_id=3,
        status="Scheduled",
        feedback=None,
        rating=None,
        created_at=None,
    )
    db.scalars.return_value.all.return_value = [interview, interview]
    db.execute.return_value.all.return_value = [
        SimpleNamespace(
            Interview=interview,
            candidate_name="Casey Candidate",
            job_title="Backend Engineer",
            interviewer_name="Riley Recruiter",
        )
    ]

    result = service.get_interviews(
        db,
        InterviewFilters(job_id=9, status="Scheduled", round_type="Technical"),
        admin,
    )

    assert result["upcoming_interviews"] == 2
    assert len(result["interviews"]) == 1
    assert result["interviews"][0]["candidate_name"] == "Casey Candidate"
    assert result["interviews"][0]["job_title"] == "Backend Engineer"


def test_get_interviews_without_optional_filters_returns_empty_results(db, admin):
    db.scalars.return_value.all.return_value = []
    db.execute.return_value.all.return_value = []

    result = service.get_interviews(db, InterviewFilters(), admin)

    assert result == {"upcoming_interviews": 0, "interviews": []}


def test_get_interviews_requires_admin(db):
    with pytest.raises(UnauthorizedError):
        service.get_interviews(db, InterviewFilters(), {"id": 7, "role": "User"})

    db.execute.assert_not_called()


def test_list_upcoming_interviews_returns_empty_list_and_fallback_date(db, admin):
    fallback_date = future_time()
    db.execute.return_value.all.return_value = []
    db.scalar.return_value = fallback_date

    result = service.list_upcoming_interviews(db, InterviewFilters(), admin)

    assert result["total_upcoming"] == 0
    assert result["interviews"] == []
    assert result["first_upcoming_interview_date"] == fallback_date
    assert " to " in result["period"]


def test_list_upcoming_interviews_serializes_rows(db, admin):
    scheduled_at = future_time()
    interview = SimpleNamespace(
        id=14,
        application_id=8,
        round_number=1,
        round_type="Technical",
        scheduled_at=scheduled_at,
        status="Scheduled",
    )
    db.execute.return_value.all.return_value = [
        SimpleNamespace(
            Interview=interview,
            candidate_name="Casey Candidate",
            job_title="Backend Engineer",
            interviewer_name="Riley Recruiter",
        )
    ]

    result = service.list_upcoming_interviews(
        db,
        InterviewFilters(job_id=9, status="Scheduled", round_type="Technical"),
        admin,
    )

    assert result["total_upcoming"] == 1
    assert result["interviews"] == [
        {
            "id": 14,
            "application_id": 8,
            "round_number": 1,
            "round_type": "Technical",
            "scheduled_at": scheduled_at,
            "interviewer_name": "Riley Recruiter",
            "status": "Scheduled",
            "candidate_name": "Casey Candidate",
            "job_title": "Backend Engineer",
        }
    ]


def test_list_upcoming_interviews_requires_admin(db):
    with pytest.raises(UnauthorizedError):
        service.list_upcoming_interviews(
            db, InterviewFilters(), {"id": 7, "role": "User"}
        )

    db.execute.assert_not_called()


def test_get_interview_details_requires_admin(db):
    with pytest.raises(UnauthorizedError):
        service.get_interview_details(db, 14, {"id": 7, "role": "User"})

    db.scalar.assert_not_called()


def test_reschedule_interview_rejects_missing_interviewer(db, admin):
    db.scalar.return_value = None

    with pytest.raises(RecruiterNotExistsError):
        service.reschedule_interview(
            db, 14, UpdateInterview(interviewer_id=5, scheduled_at=future_time()), admin
        )


def test_reschedule_interview_rejects_missing_interview(db, admin):
    db.scalar.side_effect = [MagicMock(), None]

    with pytest.raises(InterviewDetailsNotExistsError):
        service.reschedule_interview(
            db, 14, UpdateInterview(interviewer_id=5, scheduled_at=future_time()), admin
        )


def test_reschedule_interview_rejects_missing_current_recruiter(db, admin):
    db.scalar.side_effect = [MagicMock(), MagicMock(status="Scheduled"), None]

    with pytest.raises(RecruiterNotExistsError):
        service.reschedule_interview(
            db, 14, UpdateInterview(interviewer_id=5, scheduled_at=future_time()), admin
        )


def test_reschedule_interview_rejects_past_schedule(db, admin):
    db.scalar.side_effect = [
        MagicMock(),
        MagicMock(status="Scheduled"),
        MagicMock(),
    ]

    with pytest.raises(ValueError, match="must be in the future"):
        service.reschedule_interview(
            db,
            14,
            UpdateInterview(
                interviewer_id=5,
                scheduled_at=datetime.now(timezone.utc) - timedelta(days=1),
            ),
            admin,
        )


def test_cancel_interview_rejects_missing_current_recruiter(db, admin):
    db.scalar.return_value = None

    with pytest.raises(RecruiterNotExistsError):
        service.cancel_interview(db, 14, CancelInterview(), admin)


def test_cancel_interview_rejects_missing_interview(db, admin):
    db.scalar.side_effect = [MagicMock(), None]

    with pytest.raises(InterviewDetailsNotExistsError):
        service.cancel_interview(db, 14, CancelInterview(), admin)


def test_cancel_interview_rejects_already_cancelled(db, admin):
    db.scalar.side_effect = [MagicMock(), MagicMock(status="Cancelled")]

    with pytest.raises(InterviewAlreadyCancelledError):
        service.cancel_interview(db, 14, CancelInterview(), admin)


def test_submit_feedback_rejects_missing_recruiter(db, admin):
    db.scalar.return_value = None

    with pytest.raises(RecruiterNotExistsError):
        service.submit_interview_feedback(
            db, 14, SubmitFeedback(feedback="Good feedback", rating=4), admin
        )


def test_submit_feedback_rejects_missing_interview(db, admin):
    db.scalar.side_effect = [MagicMock(), None]

    with pytest.raises(InterviewDetailsNotExistsError):
        service.submit_interview_feedback(
            db, 14, SubmitFeedback(feedback="Good feedback", rating=4), admin
        )


def test_submit_feedback_rejects_completed_interview(db, admin):
    db.scalar.side_effect = [MagicMock(), MagicMock(status="Completed")]

    with pytest.raises(InterviewAlreadyCompletedError):
        service.submit_interview_feedback(
            db, 14, SubmitFeedback(feedback="Good feedback", rating=4), admin
        )


def test_submit_feedback_rejects_cancelled_interview(db, admin):
    db.scalar.side_effect = [MagicMock(), MagicMock(status="Cancelled")]

    with pytest.raises(InterviewAlreadyCancelledError):
        service.submit_interview_feedback(
            db, 14, SubmitFeedback(feedback="Good feedback", rating=4), admin
        )
