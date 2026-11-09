from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest

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
from domains.application_stage_history.model import StageHistory
from domains.applications import service
from domains.applications.model import Application
from domains.interviews.model import Interview
from domains.applications.schemas import (
    ApplicationCreate,
    ApplicationFilters,
    RejectApplication,
    UpdateStage,
)
from types import SimpleNamespace


@pytest.fixture
def application_data():
    return ApplicationCreate(job_id=23, cover_note="I am interested in this role")


@pytest.fixture
def candidate_user():
    return {"id": 7, "role": "User"}


def test_rejects_non_candidate_without_database_access(db, application_data):
    with pytest.raises(UnauthorizedError):
        service.create_application(
            db, application_data, {"id": 7, "role": "Admin"}
        )

    db.scalar.assert_not_called()


@pytest.mark.parametrize("stage", ["Hired", "Rejected"])
def test_get_application_details_summarizes_closed_application_duration(db, stage):
    now = datetime.now(timezone.utc).replace(microsecond=0)
    application = Application(
        id=12,
        job_id=9,
        candidate_id=7,
        stage=stage,
        applied_at=now - timedelta(days=5),
        stage_updated_at=now - timedelta(days=2),
    )
    application.interviews = []
    application.stage_histories = []
    application.candidate = MagicMock()
    application.job = MagicMock()
    db.scalar.return_value = application

    result = service.get_application_details(
        db, 12, {"id": 7, "role": "User"}
    )

    assert result["summary"]["total_days_in_process"] == 3


def test_rejects_missing_job(db, application_data, candidate_user):
    db.scalar.return_value = None

    with pytest.raises(JobNotExistsError):
        service.create_application(db, application_data, candidate_user)


def test_rejects_closed_job(db, application_data, candidate_user):
    db.scalar.return_value = MagicMock(status="Closed")

    with pytest.raises(JobNotOpenError):
        service.create_application(db, application_data, candidate_user)


def test_rejects_missing_candidate(db, application_data, candidate_user):
    db.scalar.side_effect = [MagicMock(status="Open"), None]

    with pytest.raises(CandidateNotExistsError):
        service.create_application(db, application_data, candidate_user)


def test_rejects_duplicate_application(db, application_data, candidate_user):
    db.scalar.side_effect = [
        MagicMock(status="Open"),
        MagicMock(),
        MagicMock(),
    ]

    with pytest.raises(ApplicationAlreadyExistsError):
        service.create_application(db, application_data, candidate_user)

    db.add.assert_not_called()
    db.commit.assert_not_called()


def test_reject_application_rejects_already_rejected_application(db):
    db.scalar.side_effect = [MagicMock(), MagicMock(stage="Rejected")]

    with pytest.raises(ApplicationAlreadyRejectedError):
        service.reject_application(
            db,
            12,
            RejectApplication(rejection_reason="No longer hiring"),
            {"id": 3, "role": "Admin"},
        )


def test_reject_application_rejects_missing_application(db):
    db.scalar.side_effect = [MagicMock(), None]

    with pytest.raises(ApplicationNotExistsError):
        service.reject_application(
            db,
            12,
            RejectApplication(rejection_reason="No longer hiring"),
            {"id": 3, "role": "Admin"},
        )


def test_reject_application_rejects_missing_recruiter(db):
    db.scalar.return_value = None

    with pytest.raises(RecruiterNotExistsError):
        service.reject_application(
            db,
            12,
            RejectApplication(rejection_reason="No longer hiring"),
            {"id": 3, "role": "Admin"},
        )


def test_reject_application_requires_admin(db):
    with pytest.raises(UnauthorizedError):
        service.reject_application(
            db,
            12,
            RejectApplication(rejection_reason="No longer hiring"),
            {"id": 3, "role": "User"},
        )

    db.scalar.assert_not_called()


def test_creates_application_and_initial_stage_history(
    db, application_data, candidate_user
):
    db.scalar.side_effect = [MagicMock(status="Open"), MagicMock(), None]

    service.create_application(db, application_data, candidate_user)

    added_records = [call.args[0] for call in db.add.call_args_list]
    assert len(added_records) == 3

    application = added_records[0]
    assert isinstance(application, Application)
    assert application.job_id == 23
    assert application.candidate_id == 7
    assert application.stage == "Screened"

    history = added_records[1:]
    assert all(isinstance(record, StageHistory) for record in history)
    assert [(record.from_stage, record.to_stage) for record in history] == [
        (None, "Applied"),
        ("Applied", "Screened"),
    ]
    assert db.flush.call_count == 2
    db.commit.assert_called_once_with()


@pytest.mark.parametrize(
    ("job_result", "expected_filled_count"),
    [(None, None), (MagicMock(filled_count=0, openings_count=3, status="Open"), 1)],
)
def test_update_application_stage_handles_non_filling_job_outcomes(
    db, job_result, expected_filled_count
):
    application = MagicMock(stage="Offer", job_id=9)
    db.scalar.side_effect = [MagicMock(), application, job_result]

    service.update_application_stage(
        db, 12, UpdateStage(new_stage="Hired"), {"id": 3, "role": "Admin"}
    )

    if job_result is not None:
        assert job_result.filled_count == expected_filled_count
        assert job_result.status == "Open"
    db.commit.assert_called_once_with()


def test_update_application_stage_advances_and_records_history(db):
    recruiter = MagicMock()
    application = MagicMock(stage="Screened", job_id=9)
    db.scalar.side_effect = [recruiter, application]
    update = UpdateStage(new_stage="Interview_R1", notes="Strong application")

    service.update_application_stage(
        db, 12, update, {"id": 3, "role": "Admin"}
    )

    assert application.stage == "Interview_R1"
    assert application.notes == "Strong application"
    history = db.add.call_args.args[0]
    assert isinstance(history, StageHistory)
    assert (history.from_stage, history.to_stage, history.changed_by) == (
        "Screened",
        "Interview_R1",
        3,
    )
    db.commit.assert_called_once_with()


def test_update_application_stage_without_notes_preserves_existing_notes(db):
    application = MagicMock(stage="Applied", job_id=9, notes="Existing notes")
    db.scalar.side_effect = [MagicMock(), application]

    service.update_application_stage(
        db, 12, UpdateStage(new_stage="Screened"), {"id": 3, "role": "Admin"}
    )

    assert application.notes == "Existing notes"
    db.commit.assert_called_once_with()


def test_update_application_stage_closes_job_when_hiring_fills_openings(db):
    recruiter = MagicMock()
    application = MagicMock(stage="Offer", job_id=9)
    job = MagicMock(filled_count=1, openings_count=2, status="Open")
    db.scalar.side_effect = [recruiter, application, job]

    service.update_application_stage(
        db, 12, UpdateStage(new_stage="Hired"), {"id": 3, "role": "Admin"}
    )

    assert application.stage == "Hired"
    assert job.filled_count == 2
    assert job.status == "Closed"
    db.commit.assert_called_once_with()


@pytest.mark.parametrize(
    ("current_stage", "new_stage", "expected_error"),
    [
        ("Screened", "Screened", DuplicateStageError),
        ("Interview_R1", "Screened", BackwardStageError),
        ("Applied", "Interview_R1", SkippedStageError),
        ("Rejected", "Hired", ApplicationAlreadyRejectedError),
        ("Hired", "Rejected", ApplicationAlreadyHiredError),
    ],
)
def test_update_application_stage_rejects_invalid_transition(
    db, current_stage, new_stage, expected_error
):
    db.scalar.side_effect = [MagicMock(), MagicMock(stage=current_stage)]

    with pytest.raises(expected_error):
        service.update_application_stage(
            db, 12, UpdateStage(new_stage=new_stage), {"id": 3, "role": "Admin"}
        )

    db.add.assert_not_called()
    db.commit.assert_not_called()


def test_update_application_stage_rejects_missing_recruiter(db):
    db.scalar.return_value = None

    with pytest.raises(RecruiterNotExistsError):
        service.update_application_stage(
            db, 12, UpdateStage(new_stage="Screened"), {"id": 3, "role": "Admin"}
        )


def test_update_application_stage_rejects_missing_application(db):
    db.scalar.side_effect = [MagicMock(), None]

    with pytest.raises(ApplicationNotExistsError):
        service.update_application_stage(
            db, 12, UpdateStage(new_stage="Screened"), {"id": 3, "role": "Admin"}
        )


def test_update_application_stage_requires_admin(db):
    with pytest.raises(UnauthorizedError):
        service.update_application_stage(
            db, 12, UpdateStage(new_stage="Screened"), {"id": 3, "role": "User"}
        )

    db.scalar.assert_not_called()


def test_reject_application_sets_rejection_and_history(db):
    recruiter = MagicMock()
    application = MagicMock(stage="Interview_R1")
    db.scalar.side_effect = [recruiter, application]
    rejection = RejectApplication(
        rejection_reason="Role requirements changed", notes="Notify candidate"
    )

    service.reject_application(db, 12, rejection, {"id": 3, "role": "Admin"})

    assert application.stage == "Rejected"
    assert application.rejection_reason == "Role requirements changed"
    assert application.notes == "Notify candidate"
    history = db.add.call_args.args[0]
    assert (history.from_stage, history.to_stage) == ("Interview_R1", "Rejected")
    db.commit.assert_called_once_with()


def test_reject_application_without_notes_preserves_existing_notes(db):
    application = MagicMock(stage="Screened", notes="Existing notes")
    db.scalar.side_effect = [MagicMock(), application]

    service.reject_application(
        db,
        12,
        RejectApplication(rejection_reason="Position filled"),
        {"id": 3, "role": "Admin"},
    )

    assert application.notes == "Existing notes"
    assert db.add.call_args.args[0].notes is None


def test_reject_application_rejects_already_hired_application(db):
    db.scalar.side_effect = [MagicMock(), MagicMock(stage="Hired")]

    with pytest.raises(ApplicationAlreadyHiredError):
        service.reject_application(
            db,
            12,
            RejectApplication(rejection_reason="No longer hiring"),
            {"id": 3, "role": "Admin"},
        )

    db.commit.assert_not_called()


def test_get_application_counts_returns_all_pipeline_stages(db):
    db.execute.return_value.all.return_value = [("Applied", 2), ("Hired", 1)]

    result = service.get_application_counts(db, {"id": 3, "role": "Admin"})
    counts = {item["label"]: item["count"] for item in result}

    assert counts["Applied"] == 2
    assert counts["Hired"] == 1
    assert counts["Rejected"] == 0
    assert counts["All"] == 3


def test_get_application_counts_ignores_unknown_stage_values(db):
    db.execute.return_value.all.return_value = [("Unknown", 5)]

    result = service.get_application_counts(db, {"id": 3, "role": "Admin"})

    assert result[-1] == {"label": "All", "count": 0}


def test_get_application_counts_requires_admin(db):
    with pytest.raises(UnauthorizedError):
        service.get_application_counts(db, {"id": 3, "role": "User"})

    db.execute.assert_not_called()


def test_days_between_uses_utc_and_never_returns_negative():
    start = datetime(2026, 1, 1, tzinfo=timezone.utc)

    assert service._days_between(start, start + timedelta(days=3, hours=12)) == 3
    assert service._days_between(start, start - timedelta(days=1)) == 0


def test_get_candidate_applications_deduplicates_history_and_counts_statuses(db):
    created_at = datetime.now(timezone.utc).replace(microsecond=0) - timedelta(days=4)
    application = SimpleNamespace(
        id=21,
        job_id=9,
        candidate_id=7,
        stage="Screened",
        stage_updated_at=created_at + timedelta(days=2),
        applied_at=created_at,
        cover_note="Interested",
        notes=None,
        rejection_reason=None,
    )
    rejected_application = SimpleNamespace(
        id=22,
        job_id=10,
        candidate_id=7,
        stage="Rejected",
        stage_updated_at=created_at + timedelta(days=2),
        applied_at=created_at,
        cover_note=None,
        notes=None,
        rejection_reason="Position filled",
    )
    common = {
        "candidate_name": "Casey Candidate",
        "department": "Engineering",
        "location": "Remote",
        "job_type": "Full-time",
        "interview_scheduled_at": created_at + timedelta(days=6),
        "interview_round_type": "Technical",
        "interviewer_name": "Riley Recruiter",
    }
    rows = [
        SimpleNamespace(
            Application=application,
            job_title="Backend Engineer",
            history_id=2,
            from_stage="Applied",
            to_stage="Screened",
            created_at=created_at + timedelta(days=1),
            interview_status="Scheduled",
            **common,
        ),
        SimpleNamespace(
            Application=application,
            job_title="Backend Engineer",
            history_id=2,
            from_stage="Applied",
            to_stage="Screened",
            created_at=created_at + timedelta(days=1),
            interview_status="Completed",
            **common,
        ),
        SimpleNamespace(
            Application=application,
            job_title="Backend Engineer",
            history_id=1,
            from_stage=None,
            to_stage="Applied",
            created_at=created_at,
            interview_status="Cancelled",
            **common,
        ),
        SimpleNamespace(
            Application=rejected_application,
            job_title="Designer",
            history_id=3,
            from_stage="Screened",
            to_stage="Rejected",
            created_at=created_at + timedelta(days=2),
            interview_status=None,
            interview_scheduled_at=None,
            interview_round_type=None,
            interviewer_name=None,
            candidate_name="Casey Candidate",
            department="Design",
            location="Remote",
            job_type="Contract",
        ),
    ]
    db.execute.return_value.all.return_value = rows

    result = service.get_candidate_applications(
        db, ApplicationFilters(), {"id": 7, "role": "User"}
    )

    assert result["all_applications"] == 2
    assert result["active_applications"] == 1
    assert result["closed_applications"] == 1
    active = next(item for item in result["applications"] if item["id"] == 21)
    assert active["interview_scheduled_at"] == common["interview_scheduled_at"]
    assert [entry["id"] for entry in active["stage_history"]] == [1, 2]
    assert [entry["days_in_stage"] for entry in active["stage_history"]][0] == 1
    assert active["stage_history"][1]["days_in_stage"] >= 2
    assert active["stage_step"] == 2
    assert result["applications"][1]["interview_scheduled_at"] is None


@pytest.mark.parametrize(
    ("status_filter", "expected_stage"),
    [("Active", "Screened"), ("Closed", "Rejected")],
)
def test_get_candidate_applications_filters_by_status(
    db, status_filter, expected_stage
):
    stages = ["Screened", "Rejected"]
    rows = []
    for application_id, stage in enumerate(stages, start=1):
        application = SimpleNamespace(
            id=application_id,
            job_id=9,
            candidate_id=7,
            stage=stage,
            stage_updated_at=datetime.now(timezone.utc),
            applied_at=datetime.now(timezone.utc),
            cover_note=None,
            notes=None,
            rejection_reason=None,
        )
        rows.append(
            SimpleNamespace(
                Application=application,
                candidate_name="Casey Candidate",
                job_title="Backend Engineer",
                department="Engineering",
                location="Remote",
                job_type="Full-time",
                history_id=None,
                from_stage=None,
                to_stage=None,
                created_at=None,
                interview_scheduled_at=None,
                interview_round_type=None,
                interview_status=None,
                interviewer_name=None,
            )
        )
    db.execute.return_value.all.return_value = rows

    result = service.get_candidate_applications(
        db,
        ApplicationFilters(status=status_filter),
        {"id": 7, "role": "User"},
    )

    assert len(result["applications"]) == 1
    assert result["applications"][0]["stage"] == expected_stage
    assert result["all_applications"] == 2


def test_get_candidate_applications_applies_job_and_stage_filters(db):
    db.execute.return_value.all.return_value = []

    result = service.get_candidate_applications(
        db,
        ApplicationFilters(job_id=9, stage="Screened"),
        {"id": 7, "role": "User"},
    )

    sql = str(db.execute.call_args.args[0])
    assert "applications.job_id = :job_id_1" in sql
    assert "applications.stage = :stage_1" in sql
    assert result["applications"] == []


def test_get_candidate_applications_requires_candidate(db):
    with pytest.raises(UnauthorizedError):
        service.get_candidate_applications(
            db, ApplicationFilters(), {"id": 3, "role": "Admin"}
        )


def test_get_candidate_applications_returns_empty_summary(db):
    db.execute.return_value.all.return_value = []

    result = service.get_candidate_applications(
        db, ApplicationFilters(), {"id": 7, "role": "User"}
    )

    assert result["active_applications"] == 0
    assert result["closed_applications"] == 0
    assert result["all_applications"] == 0
    assert result["applications"] == []


def test_get_live_applications_serializes_candidate_and_job_names(db):
    application = MagicMock(id=12)
    application.candidate.name = "Casey Candidate"
    application.job.title = "Backend Engineer"
    db.scalars.return_value.all.return_value = [application]

    result = service.get_live_applications(db, {"id": 3, "role": "Admin"})

    assert result == [
        {
            "id": 12,
            "candidate_name": "Casey Candidate",
            "job_title": "Backend Engineer",
        }
    ]


def test_get_live_applications_requires_admin(db):
    with pytest.raises(UnauthorizedError):
        service.get_live_applications(db, {"id": 7, "role": "User"})

    db.scalars.assert_not_called()


def test_get_application_details_summarizes_interviews_and_stage_history(db):
    now = datetime.now(timezone.utc).replace(microsecond=0)
    application = Application(
        id=12,
        job_id=9,
        candidate_id=7,
        stage="Screened",
        applied_at=now - timedelta(days=4),
        stage_updated_at=now - timedelta(days=2),
    )
    application.interviews = [
        Interview(
            id=1,
            application_id=12,
            round_number=1,
            round_type="Technical",
            scheduled_at=now + timedelta(days=2),
            interviewer_id=3,
            status="Scheduled",
        ),
        Interview(
            id=2,
            application_id=12,
            round_number=2,
            round_type="HR",
            scheduled_at=now - timedelta(days=1),
            interviewer_id=3,
            status="Completed",
        ),
        Interview(
            id=3,
            application_id=12,
            round_number=3,
            round_type="System_Design",
            scheduled_at=now + timedelta(days=3),
            interviewer_id=3,
            status="Rescheduled",
        ),
        Interview(
            id=4,
            application_id=12,
            round_number=4,
            round_type="Assignment",
            scheduled_at=now + timedelta(days=4),
            interviewer_id=3,
            status="Cancelled",
        ),
    ]
    application.stage_histories = [
        StageHistory(
            id=1,
            application_id=12,
            from_stage=None,
            to_stage="Applied",
            created_at=now - timedelta(days=4),
            notes="Submitted",
        )
    ]
    application.candidate = MagicMock()
    application.job = MagicMock()
    db.scalar.return_value = application

    result = service.get_application_details(
        db, 12, {"id": 7, "role": "User"}
    )

    assert result["application"]["id"] == 12
    assert result["candidate"] is application.candidate
    assert result["job"] is application.job
    assert [item.status for item in result["interviews"]] == [
        "Completed",
        "Scheduled",
        "Rescheduled",
        "Cancelled",
    ]
    assert result["summary"]["interviews_completed"] == 1
    assert result["summary"]["interviews_pending"] == 2
    assert result["summary"]["total_stages_passed"] == 1


def test_get_application_details_requires_candidate(db):
    with pytest.raises(UnauthorizedError):
        service.get_application_details(db, 12, {"id": 3, "role": "Admin"})

    db.scalar.assert_not_called()


def test_get_application_details_rejects_missing_application(db):
    db.scalar.return_value = None

    with pytest.raises(ApplicationNotExistsError):
        service.get_application_details(db, 12, {"id": 7, "role": "User"})


def test_get_application_timeline_returns_current_stage_and_empty_history(db):
    application = MagicMock(
        id=12,
        stage="Screened",
        applied_at=datetime.now(timezone.utc),
        rejection_reason=None,
    )
    application.candidate.name = "Casey Candidate"
    application.job.title = "Backend Engineer"
    db.scalar.return_value = application
    db.scalars.return_value.all.return_value = []

    result = service.get_application_timeline(db, 12, {"id": 7, "role": "User"})

    assert result["application_id"] == 12
    assert result["candidate_name"] == "Casey Candidate"
    assert result["job_title"] == "Backend Engineer"
    assert result["current_stage"] == "Screened"
    assert result["timeline"] == []
    assert result["stage_summary"]["Screened"] == "not reached"


def test_get_application_timeline_rejects_missing_application(db):
    db.scalar.return_value = None

    with pytest.raises(ApplicationNotExistsError):
        service.get_application_timeline(db, 12, {"id": 7, "role": "User"})


def test_get_application_timeline_requires_candidate(db):
    with pytest.raises(UnauthorizedError):
        service.get_application_timeline(
            db, 12, {"id": 3, "role": "Admin"}
        )

    db.scalar.assert_not_called()


def test_get_application_timeline_includes_rejection_and_recruiter_details(db):
    now = datetime.now(timezone.utc).replace(microsecond=0)
    application = MagicMock(
        id=12,
        stage="Rejected",
        applied_at=now - timedelta(days=5),
        stage_updated_at=now - timedelta(days=2),
        rejection_reason="Position filled",
    )
    application.candidate.name = "Casey Candidate"
    application.job.title = "Backend Engineer"
    histories = [
        SimpleNamespace(
            id=1,
            from_stage=None,
            to_stage="Applied",
            changed_by=None,
            created_at=now - timedelta(days=5),
            notes=None,
        ),
        SimpleNamespace(
            id=2,
            from_stage="Screened",
            to_stage="Rejected",
            changed_by=3,
            created_at=now - timedelta(days=2),
            notes="Position filled",
        ),
    ]
    db.scalar.return_value = application
    db.scalars.return_value.all.return_value = histories
    db.execute.return_value.all.return_value = [(3, "Riley Recruiter")]

    result = service.get_application_timeline(db, 12, {"id": 7, "role": "User"})

    assert len(result["timeline"]) == 2
    assert result["timeline"][0]["time_spent"]["status"] == "Completed"
    assert result["timeline"][1]["time_spent"] == {
        "display": "closed",
        "status": "terminal",
    }
    assert result["stage_summary"]["Rejected"] == "terminal"
    assert result["rejection_details"] == {
        "rejected_from_stage": "Screened",
        "rejection_reason": "Position filled",
        "rejected_at": histories[1].created_at,
        "rejected_by": "Riley Recruiter",
    }


def test_get_application_timeline_handles_single_ongoing_stage_and_future_apply_date(db):
    now = datetime.now(timezone.utc).replace(microsecond=0)
    application = MagicMock(
        id=12,
        stage="Applied",
        applied_at=now + timedelta(days=1),
        rejection_reason=None,
    )
    application.candidate.name = "Casey Candidate"
    application.job.title = "Backend Engineer"
    history = SimpleNamespace(
        id=1,
        from_stage=None,
        to_stage="Applied",
        changed_by=None,
        created_at=now - timedelta(hours=5),
        notes=None,
    )
    db.scalar.return_value = application
    db.scalars.return_value.all.return_value = [history]

    result = service.get_application_timeline(db, 12, {"id": 7, "role": "User"})

    assert result["total_days_in_process"] == 0
    assert result["timeline"][0]["time_spent"]["status"] == "ongoing"
    assert "ongoing" in result["timeline"][0]["time_spent"]["display"]
