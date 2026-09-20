from datetime import datetime, timedelta, timezone

from core.exceptions import (
    ApplicationNotExistsError,
    ClosedApplicationError,
    DuplicateRoundError,
    FeedbackAlreadySubmittedError,
    FeedbackEmptyError,
    InterviewAlreadyCancelledError,
    InterviewAlreadyCompletedError,
    InterviewDetailsNotExistsError,
    RecruiterNotExistsError,
    RejectedApplicationError,
    UnauthorizedError,
    UnscreenedApplicationError,
)
from domains.applications.model import Application
from domains.candidates.model import Candidate
from domains.interviews.model import Interview
from domains.interviews.schemas import (
    CancelInterview,
    InterviewCreate,
    InterviewFilters,
    SubmitFeedback,
    UpdateInterview,
)
from domains.jobs.model import Job
from domains.recruiters.model import Recruiter
from sqlalchemy import select
from sqlalchemy.orm import Session


def create_interview(
    db: Session, interview_details: InterviewCreate, current_user: dict
) -> None:
    if current_user["role"] != "Admin":
        raise UnauthorizedError

    parsed_date = interview_details.scheduled_at.astimezone(timezone.utc).replace(
        microsecond=0
    )
    if parsed_date <= datetime.now(timezone.utc).replace(microsecond=0):
        raise ValueError("The interview date and time must be in the future.")

    application = db.scalar(
        select(Application).where(Application.id == interview_details.application_id)
    )
    if not application:
        raise ApplicationNotExistsError

    if application.stage == "Applied":
        raise UnscreenedApplicationError

    if application.stage == "Rejected":
        raise RejectedApplicationError

    if application.stage == "Hired":
        raise ClosedApplicationError

    duplicate_round = db.scalar(
        select(Interview.id).where(
            (Interview.application_id == interview_details.application_id)
            & (Interview.round_number == interview_details.round_number)
        )
    )

    if duplicate_round:
        raise DuplicateRoundError

    db.add(
        Interview(
            **{
                **interview_details.model_dump(),
                "scheduled_at": parsed_date,
                "interviewer_id": current_user["id"],
            }
        )
    )
    db.commit()


def get_interviews(
    db: Session, interview_filters: InterviewFilters, current_user: dict
) -> list:
    if current_user["role"] != "Admin":
        raise UnauthorizedError

    query = (
        select(
            Interview,
            Candidate.name.label("candidate_name"),
            Job.title.label("job_title"),
        )
        .join(Application, Interview.application_id == Application.id)
        .join(Candidate, Application.candidate_id == Candidate.id)
        .join(Job, Application.job_id == Job.id)
    )

    if interview_filters.application_id:
        query = query.where(
            Interview.application_id == interview_filters.application_id
        )

    if interview_filters.status:
        query = query.where(Interview.status == interview_filters.status)

    if interview_filters.round_type:
        query = query.where(Interview.round_type == interview_filters.round_type)

    result = db.execute(query).all()
    response = []

    for row in result:
        interview = row.Interview

        response.append(
            {
                "id": interview.id,
                "application_id": interview.application_id,
                "candidate_name": row.candidate_name,
                "job_title": row.job_title,
                "round_number": interview.round_number,
                "round_type": interview.round_type,
                "scheduled_at": interview.scheduled_at,
                "interviewer_id": interview.interviewer_id,
                "interviewer_name": interview.interviewer_name,
                "status": interview.status,
                "feedback": interview.feedback,
                "rating": interview.rating,
                "created_at": interview.created_at,
            }
        )

    return response


def list_upcoming_interviews(db: Session, current_user: dict) -> dict:
    if current_user["role"] != "Admin":
        raise UnauthorizedError

    now = datetime.now(timezone.utc).replace(microsecond=0)
    seven_days_later = now + timedelta(days=7)
    query = (
        select(
            Interview,
            Candidate.name.label("candidate_name"),
            Job.title.label("job_title"),
        )
        .join(Application, Interview.application_id == Application.id)
        .join(Candidate, Application.candidate_id == Candidate.id)
        .join(Job, Application.job_id == Job.id)
        .where(
            Interview.scheduled_at >= now,
            Interview.scheduled_at <= seven_days_later,
            Interview.status.in_(["Scheduled", "Rescheduled"]),
        )
        .order_by(Interview.scheduled_at.asc())
    )
    result = db.execute(query).all()

    upcoming_interviews = []
    for res in result:
        interview = res.Interview
        upcoming_interviews.append(
            {
                "id": interview.id,
                "application_id": interview.application_id,
                "round_number": interview.round_number,
                "round_type": interview.round_type,
                "scheduled_at": interview.scheduled_at,
                "interviewer_name": interview.interviewer_name,
                "status": interview.status,
                "candidate_name": res.candidate_name,
                "job_title": res.job_title,
            }
        )

    response = {
        "period": f"{now} to {seven_days_later}",
        "total_upcoming": len(upcoming_interviews),
        "interviews": upcoming_interviews,
    }

    return response


def get_interview_details(
    db: Session, interview_id: int, current_user: dict
) -> dict | None:
    if current_user["role"] != "Admin":
        raise UnauthorizedError

    interview = db.scalar(select(Interview).where(Interview.id == interview_id))

    if not interview:
        raise InterviewDetailsNotExistsError

    application = interview.application
    candidate = application.candidate
    job = application.job

    response = {
        "id": interview_id,
        "round_number": interview.round_number,
        "round_type": interview.round_type,
        "scheduled_at": interview.scheduled_at,
        "interviewer_name": interview.interviewer_name,
        "interviewer_id": interview.interviewer_id,
        "status": interview.status,
        "feedback": interview.feedback,
        "rating": interview.rating,
        "created_at": interview.created_at,
        "updated_at": interview.updated_at,
        "application": {
            "application_id": application.id,
            "stage": application.stage,
        },
        "candidate": {
            "id": candidate.id,
            "name": candidate.name,
            "email": candidate.email,
            "experience_years": candidate.experience_years,
            "skills": candidate.skills,
        },
        "job": {
            "id": job.id,
            "title": job.title,
            "department": job.department,
            "location": job.location,
        },
    }

    return response


def update_interview(
    db: Session,
    interview_id: int,
    interview_update: UpdateInterview,
    current_user: dict,
) -> None:
    if current_user["role"] != "Admin":
        raise UnauthorizedError

    interview = db.scalar(select(Interview).where(Interview.id == interview_id))

    if not interview:
        raise InterviewDetailsNotExistsError

    if interview.status == "Completed":
        raise InterviewAlreadyCompletedError

    if interview.status == "Cancelled":
        raise InterviewAlreadyCancelledError

    if db.scalar(select(Recruiter.id).where(Recruiter.id == current_user["id"])):
        raise RecruiterNotExistsError

    if interview_update.scheduled_at is not None:
        parsed_date = interview_update.scheduled_at.astimezone(timezone.utc).replace(
            microsecond=0
        )
        if parsed_date <= datetime.now(timezone.utc).replace(microsecond=0):
            raise ValueError("The interview date and time must be in the future.")
        interview.status = "Rescheduled"

    update_data = interview_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(interview, key, value)

    interview.interviewer_id = current_user["id"]

    db.commit()


def cancel_interview(
    db: Session,
    interview_id: int,
    cancellation_data: CancelInterview,
    current_user: dict,
):
    if current_user["role"] != "Admin":
        raise UnauthorizedError

    if not (db.scalar(select(Recruiter.id).where(Recruiter.id == current_user["id"]))):
        raise RecruiterNotExistsError

    interview = db.scalar(select(Interview).where(Interview.id == interview_id))

    if not interview:
        raise InterviewDetailsNotExistsError

    if interview.status == "Completed":
        raise FeedbackAlreadySubmittedError

    if interview.status == "Cancelled":
        raise InterviewAlreadyCancelledError

    update_data = cancellation_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(interview, key, value)

    interview.interviewer_id = current_user["id"]
    interview.status = "Cancelled"
    db.commit()


def submit_interview_feedback(
    db: Session, interview_id: int, submit_feedback: SubmitFeedback, current_user: dict
) -> None:
    if current_user["role"] != "Admin":
        raise UnauthorizedError

    if not submit_feedback.feedback.strip():
        raise FeedbackEmptyError

    if not (db.scalar(select(Recruiter.id).where(Recruiter.id == current_user["id"]))):
        raise RecruiterNotExistsError

    interview = db.scalar(select(Interview).where(Interview.id == interview_id))

    if not interview:
        raise InterviewDetailsNotExistsError

    if interview.status == "Completed":
        raise FeedbackAlreadySubmittedError

    if interview.status == "Cancelled":
        raise InterviewAlreadyCancelledError

    update_data = submit_feedback.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(interview, key, value)

    interview.interviewer_id = current_user["id"]
    interview.status = "Completed"
    db.commit()
