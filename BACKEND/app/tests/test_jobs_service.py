from unittest.mock import MagicMock
from datetime import datetime, timezone, timedelta
from types import SimpleNamespace

import pytest

from core.exceptions import (
    ActiveApplicationsExistsError,
    JobNotExistsError,
    RecruiterNotExistsError,
    SameStatusError,
    UnauthorizedError,
)
from domains.jobs import service
from domains.jobs.model import Job
from domains.jobs.schemas import (
    JobApplicationFilters,
    JobCreate,
    JobFilters,
    JobUpdate,
)


@pytest.fixture
def admin():
    return {"id": 3, "role": "Admin"}


@pytest.fixture
def job_data():
    return JobCreate(
        title="Backend Engineer",
        department="Engineering",
        location="Remote",
        job_type="Full-time",
        description="Build backend services",
        requirements="Python and APIs",
        status="Open",
        openings_count=3,
    )


def test_create_job_requires_admin(db, job_data):
    with pytest.raises(UnauthorizedError):
        service.create_job(db, job_data, {"id": 3, "role": "User"})

    db.add.assert_not_called()


def test_create_job_rejects_missing_recruiter(db, job_data, admin, monkeypatch):
    monkeypatch.setattr(service, "get_recruiter_details", lambda *args: None)

    with pytest.raises(RecruiterNotExistsError):
        service.create_job(db, job_data, admin)

    db.add.assert_not_called()


def test_create_job_saves_job_with_recruiter(db, job_data, admin, monkeypatch):
    monkeypatch.setattr(service, "get_recruiter_details", lambda *args: MagicMock())

    service.create_job(db, job_data, admin)

    job = db.add.call_args.args[0]
    assert isinstance(job, Job)
    assert job.created_by == 3
    assert job.title == "Backend Engineer"
    db.commit.assert_called_once_with()


def test_get_jobs_requires_role(db):
    with pytest.raises(UnauthorizedError):
        service.get_jobs(db, JobFilters(), {"id": 4, "role": ""})

    db.scalars.assert_not_called()


def test_get_jobs_returns_filtered_results(db):
    jobs = [MagicMock()]
    db.scalars.return_value.all.return_value = jobs

    result = service.get_jobs(
        db,
        JobFilters(department="Engineering", status="Open", location="Remote"),
        {"id": 4, "role": "Admin"},
    )

    assert result == jobs


def test_get_jobs_for_candidate_only_selects_open_unapplied_jobs(db):
    db.scalars.return_value.all.return_value = []

    result = service.get_jobs(
        db, JobFilters(), {"id": 7, "role": "User"}
    )

    assert result == []
    statement = db.scalars.call_args.args[0]
    sql = str(statement.compile(compile_kwargs={"literal_binds": True}))
    assert "jobs.status = 'Open'" in sql
    assert "applications.candidate_id = 7" in sql


def test_get_job_by_id_returns_openings_summary(db):
    job = MagicMock(openings_count=4, filled_count=2)
    db.scalar.return_value = job
    db.scalars.return_value.all.return_value = [1, 2, 3]

    result = service.get_job_by_id(db, 9, {"id": 4, "role": "User"})

    assert result is job
    assert job.calculated == {
        "applicant_count": 3,
        "remaining_openings": 2,
        "is_fully_filled": False,
    }


def test_get_job_by_id_rejects_missing_job(db):
    db.scalar.return_value = None

    with pytest.raises(JobNotExistsError):
        service.get_job_by_id(db, 9, {"id": 4, "role": "User"})


def test_get_job_by_id_rejects_missing_role(db):
    with pytest.raises(UnauthorizedError):
        service.get_job_by_id(db, 9, {"id": 4, "role": ""})

    db.scalar.assert_not_called()


def test_update_job_applies_only_provided_fields(db, admin):
    job = MagicMock()
    db.scalar.return_value = job

    service.update_job(db, 9, JobUpdate(description="Updated description"), admin)

    assert job.description == "Updated description"
    db.commit.assert_called_once_with()


def test_update_job_rejects_non_admin(db):
    with pytest.raises(UnauthorizedError):
        service.update_job(
            db, 9, JobUpdate(description="Updated description"), {"id": 4, "role": "User"}
        )


def test_update_job_rejects_missing_job(db, admin):
    db.scalar.return_value = None

    with pytest.raises(JobNotExistsError):
        service.update_job(db, 9, JobUpdate(description="Updated description"), admin)


def test_update_job_status_rejects_same_status(db, admin):
    db.scalar.return_value = MagicMock(status="Open")

    with pytest.raises(SameStatusError):
        service.update_job_status(db, 9, "Open", admin)

    db.commit.assert_not_called()


def test_update_job_status_updates_status(db, admin):
    job = MagicMock(status="Draft")
    db.scalar.return_value = job

    service.update_job_status(db, 9, "Open", admin)

    assert job.status == "Open"
    db.commit.assert_called_once_with()


def test_update_job_status_rejects_missing_job(db, admin):
    db.scalar.return_value = None

    with pytest.raises(JobNotExistsError):
        service.update_job_status(db, 9, "Open", admin)


def test_update_job_status_requires_admin(db):
    with pytest.raises(UnauthorizedError):
        service.update_job_status(db, 9, "Open", {"id": 4, "role": "User"})

    db.scalar.assert_not_called()


def test_delete_job_rejects_active_applications(db, admin):
    job = MagicMock()
    db.scalar.side_effect = [job, MagicMock()]

    with pytest.raises(ActiveApplicationsExistsError):
        service.delete_job(db, 9, admin)

    db.delete.assert_not_called()
    db.commit.assert_not_called()


def test_delete_job_removes_job_without_active_applications(db, admin):
    job = MagicMock()
    db.scalar.side_effect = [job, None]

    service.delete_job(db, 9, admin)

    db.delete.assert_called_once_with(job)
    db.commit.assert_called_once_with()


def test_delete_job_rejects_missing_job(db, admin):
    db.scalar.return_value = None

    with pytest.raises(JobNotExistsError):
        service.delete_job(db, 9, admin)


def test_delete_job_requires_admin(db):
    with pytest.raises(UnauthorizedError):
        service.delete_job(db, 9, {"id": 4, "role": "User"})

    db.scalar.assert_not_called()


def test_get_job_applications_groups_and_counts_by_stage(db, admin):
    target_job = MagicMock(title="Backend Engineer", status="Open")
    application = MagicMock(
        id=11,
        candidate_id=5,
        applied_at=None,
        stage_updated_at=None,
        notes=None,
        cover_note=None,
        stage="Interview_R1",
    )
    candidate = MagicMock(experience_years=5)
    candidate.name = "Casey Candidate"
    db.scalar.return_value = target_job
    db.execute.return_value.all.return_value = [(application, candidate)]

    result = service.get_job_applications(db, 9, admin)

    assert result["total_applications"] == 1
    assert result["total_active"] == 1
    assert result["total_rejected"] == 0
    assert result["total_hired"] == 0
    bucket = result["pipeline"]["Interview_R1"]
    assert bucket["count"] == 1
    assert bucket["applications"][0]["candidate_name"] == "Casey Candidate"


def test_get_job_applications_rejects_missing_job(db, admin):
    db.scalar.return_value = None

    with pytest.raises(JobNotExistsError):
        service.get_job_applications(db, 9, admin)


def test_get_job_applications_requires_admin(db):
    with pytest.raises(UnauthorizedError):
        service.get_job_applications(db, 9, {"id": 4, "role": "User"})

    db.scalar.assert_not_called()


def test_get_job_filtered_applications_returns_empty_results_and_counts(db, admin):
    target_job = MagicMock(
        title="Backend Engineer",
        status="Open",
        location="Remote",
        department="Engineering",
    )
    db.scalar.side_effect = [target_job, 0, 0, 0, 0, 0]
    db.execute.return_value.all.return_value = []

    result = service.get_job_filtered_applications(
        db, 9, JobApplicationFilters(), admin
    )

    assert result["applications"] == []
    assert result["job_id"] == 9
    assert result["job_title"] == "Backend Engineer"
    assert result["total_active"] == 0
    assert result["needs_attention"] == 0
    assert result["this_week"] == 0
    assert result["interview_count"] == 0
    assert result["offers_pending"] == 0


def test_get_job_filtered_applications_applies_filters_and_serializes_applications(
    db, admin
):
    target_job = MagicMock(
        title="Backend Engineer",
        status="Open",
        location="Remote",
        department="Engineering",
    )
    now = datetime.now(timezone.utc)
    application = SimpleNamespace(
        id=11,
        candidate_id=7,
        applied_at=now - timedelta(days=1),
        stage_updated_at=now - timedelta(days=2),
        stage="Offer",
        notes="Strong fit",
        cover_note="Interested",
    )
    candidate = SimpleNamespace(
        name="Casey Candidate",
        email="casey@example.com",
        experience_years=5,
        phone="1234567890",
        resume_url="https://example.com/resume",
    )
    db.scalar.side_effect = [target_job, 2, 1, 1, 1, 1]
    db.execute.return_value.all.return_value = [(application, candidate)]

    result = service.get_job_filtered_applications(
        db,
        9,
        JobApplicationFilters(
            this_week=True,
            needs_attention=True,
            interview_round=True,
            offer_stage=True,
            name_filter="Casey",
            stage_filter="Offer",
            date_applied_filter=14,
        ),
        admin,
    )

    assert result["applications"][0]["candidate_name"] == "Casey Candidate"
    assert result["applications"][0]["job"] == "Backend Engineer"
    assert result["applications"][0]["stage"] == "Offer"
    assert result["total_active"] == 2
    assert result["this_week"] == 1
    assert result["interview_count"] == 1
    assert result["offers_pending"] == 1
    assert result["needs_attention"] == 1


def test_get_job_filtered_applications_rejects_missing_job(db, admin):
    db.scalar.return_value = None

    with pytest.raises(JobNotExistsError):
        service.get_job_filtered_applications(
            db, 9, JobApplicationFilters(), admin
        )


def test_get_job_filtered_applications_rejects_non_admin(db):
    with pytest.raises(UnauthorizedError):
        service.get_job_filtered_applications(
            db, 9, JobApplicationFilters(), {"id": 4, "role": "User"}
        )

    db.scalar.assert_not_called()


def test_get_days_ago_returns_aware_datetime():
    result = service.get_days_ago(7)

    assert result.tzinfo is not None
    assert result.utcoffset().total_seconds() == 0
