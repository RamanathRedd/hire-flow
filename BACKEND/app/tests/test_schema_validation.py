from datetime import datetime, timezone

import pytest
from pydantic import ValidationError

from domains.applications.schemas import (
    ApplicationCreate,
    ApplicationFilters,
    RejectApplication,
    UpdateStage,
)
from domains.auth.schemas import PasswordUpdate
from domains.candidates.schemas import CandidateCreate, CandidateFilters, CandidateUpdate
from domains.interviews.schemas import (
    CancelInterview,
    InterviewCreate,
    InterviewFilters,
    SubmitFeedback,
    UpdateInterview,
)
from domains.jobs.schemas import JobApplicationFilters, JobCreate, JobFilters, JobUpdate
from domains.recruiters.schemas import RecruiterCreate, RecruiterUpdate


def test_password_update_accepts_valid_passwords_and_rejects_short_values():
    assert PasswordUpdate(
        old_password="old-pass",
        new_password="new-pass",
        confirm_password="new-pass",
    ).new_password == "new-pass"

    with pytest.raises(ValidationError):
        PasswordUpdate(
            old_password="short",
            new_password="new-pass",
            confirm_password="new-pass",
        )


def test_application_schemas_accept_valid_values_and_reject_invalid_stage():
    assert ApplicationCreate(job_id=1).stage == "Applied"
    assert ApplicationFilters(job_id=1, stage="Screened", status="Active").job_id == 1
    assert RejectApplication(rejection_reason="  Role closed  ").rejection_reason == (
        "Role closed"
    )
    assert UpdateStage(new_stage="Screened").new_stage == "Screened"

    with pytest.raises(ValidationError):
        ApplicationCreate(job_id=1, stage="Invalid")

    with pytest.raises(ValidationError):
        RejectApplication(rejection_reason="  ")


def test_candidate_create_and_filters_validate_positive_and_negative_values():
    candidate = CandidateCreate(
        name="Casey Candidate",
        password="password123",
        email="casey@example.com",
        phone="1234567890",
        resume_url="https://example.com/resume",
        experience_years=0,
        skills=[],
        current_title="Engineer",
        current_company="Example",
    )
    assert candidate.experience_years == 0
    assert CandidateFilters(min_experience=1, max_experience=5).max_experience == 5
    assert CandidateUpdate(experience_years=2).experience_years == 2

    with pytest.raises(ValidationError):
        CandidateCreate(
            name="Casey Candidate",
            password="password123",
            email="not-an-email",
            phone="1234567890",
            resume_url="https://example.com/resume",
            experience_years=-1,
            current_title="Engineer",
            current_company="Example",
        )


def test_job_schemas_accept_valid_values_and_reject_invalid_values():
    job = JobCreate(
        title="Backend Engineer",
        department="Engineering",
        location="Remote",
        job_type="Full-time",
        description="Build backend services",
        requirements="Python and APIs",
        openings_count=1,
    )
    assert job.status == "Draft"
    assert JobFilters(status="Open", location="Remote").status == "Open"
    assert JobUpdate(openings_count=2).openings_count == 2
    assert JobApplicationFilters(needs_attention=True).needs_attention

    with pytest.raises(ValidationError):
        JobCreate(
            title="Backend Engineer",
            department="Engineering",
            location="Mars",
            job_type="Full-time",
            description="Build backend services",
            requirements="Python and APIs",
            openings_count=0,
        )


def test_recruiter_schemas_validate_fields():
    recruiter = RecruiterCreate(
        name="Riley Recruiter",
        email="riley@example.com",
        phone="1234567890",
        department="Engineering",
        password="password123",
    )
    assert recruiter.email == "riley@example.com"
    assert RecruiterUpdate(department="Product").department == "Product"

    with pytest.raises(ValidationError):
        RecruiterCreate(
            name="Riley Recruiter",
            email="invalid",
            phone="1234567890",
            department="Engineering",
            password="password123",
        )


def test_interview_schemas_validate_supported_values():
    scheduled_at = datetime(2030, 1, 1, tzinfo=timezone.utc)
    interview = InterviewCreate(
        application_id=1,
        round_number=1,
        round_type="Technical",
        scheduled_at=scheduled_at,
        interviewer_id=2,
    )
    assert interview.status == "Scheduled"
    assert InterviewFilters(status="Completed", round_type="HR").round_type == "HR"
    assert UpdateInterview(interviewer_id=2, scheduled_at=scheduled_at)
    assert CancelInterview(cancellation_reason="Candidate unavailable")
    assert SubmitFeedback(feedback="Good technical skills", rating=5).rating == 5

    with pytest.raises(ValidationError):
        InterviewCreate(
            application_id=1,
            round_number=0,
            round_type="Technical",
            scheduled_at=scheduled_at,
            interviewer_id=2,
        )

    with pytest.raises(ValidationError):
        SubmitFeedback(feedback="Good feedback", rating=6)
