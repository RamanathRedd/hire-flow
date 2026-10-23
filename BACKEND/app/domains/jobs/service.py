from datetime import datetime, timedelta, timezone

from domains.interviews.model import Interview
from core.constants import STAGES, STATUS
from core.exceptions import (
    ActiveApplicationsExistsError,
    JobNotExistsError,
    RecruiterNotExistsError,
    SameStatusError,
    UnauthorizedError,
)
from domains.applications.model import Application
from domains.candidates.model import Candidate
from domains.jobs.model import Job
from domains.jobs.schemas import JobApplicationFilters, JobCreate, JobFilters, JobUpdate
from domains.recruiters.service import get_recruiter_details
from sqlalchemy import func, not_, select
from sqlalchemy.orm import Session


def create_job(db: Session, job_data: JobCreate, current_user: dict) -> None:
    if current_user["role"] != "Admin":
        raise UnauthorizedError

    recruiter_exists = get_recruiter_details(db, current_user["id"], current_user)

    if not recruiter_exists:
        raise RecruiterNotExistsError

    db.add(Job(**job_data.model_dump(), created_by=current_user["id"]))
    db.commit()


def get_jobs(db: Session, job_filters: JobFilters, current_user: dict) -> list[Job]:
    if not current_user["role"]:
        raise UnauthorizedError

    query = select(Job)

    if current_user["role"] == "User":
        query = query.where(
            Job.status == "Open",
            not_(Job.applications.any(Application.candidate_id == current_user["id"])),
        )

    if job_filters.department:
        query = query.where(Job.department == job_filters.department)

    if job_filters.status:
        query = query.where(Job.status == job_filters.status)

    if job_filters.location:
        query = query.where(Job.location == job_filters.location)

    return db.scalars(query).all()


def get_job_by_id(db: Session, job_id: int, current_user: dict) -> dict | None:
    if not current_user["role"]:
        raise UnauthorizedError

    query = select(Job).where(Job.id == job_id)
    response = db.scalar(query)

    if not response:
        raise JobNotExistsError

    application_count = len(
        db.scalars(select(Application.id).where(Application.job_id == job_id)).all()
    )

    remaining_openings = response.openings_count - response.filled_count
    response.calculated = {
        "applicant_count": application_count,
        "remaining_openings": remaining_openings,
        "is_fully_filled": remaining_openings <= 0,
    }

    return response


def update_job(
    db: Session, job_id: int, job_data: JobUpdate, current_user: dict
) -> None:
    if current_user["role"] != "Admin":
        raise UnauthorizedError

    query = select(Job).where(Job.id == job_id)
    job = db.scalar(query)

    if not job:
        raise JobNotExistsError

    payload = job_data.model_dump(exclude_unset=True)

    for key, value in payload.items():
        setattr(job, key, value)

    db.commit()


def delete_job(db: Session, job_id: int, current_user: dict) -> None:
    if current_user["role"] != "Admin":
        raise UnauthorizedError

    query = select(Job).where(Job.id == job_id)
    job = db.scalar(query)

    if not job:
        raise JobNotExistsError

    query = query.where(Job.applications.any(Application.stage.in_(STAGES[:-2])))

    active_application_exists = db.scalar(query)

    if active_application_exists:
        raise ActiveApplicationsExistsError

    db.delete(job)
    db.commit()


def update_job_status(
    db: Session, job_id: int, new_status: STATUS, current_user: dict
) -> None:
    if current_user["role"] != "Admin":
        raise UnauthorizedError

    query = select(Job).where(Job.id == job_id)
    job = db.scalar(query)

    if not job:
        raise JobNotExistsError

    if job.status == new_status:
        raise SameStatusError

    job.status = new_status
    db.commit()


def get_job_applications(db: Session, job_id: int, current_user: dict) -> dict | None:
    if current_user["role"] != "Admin":
        raise UnauthorizedError

    target_job = db.scalar(select(Job).where(Job.id == job_id))

    if not target_job:
        raise JobNotExistsError

    pipeline_buckets = {
        "Applied": [],
        "Screened": [],
        "Interview_R1": [],
        "Interview_R2": [],
        "HR_Round": [],
        "Offer": [],
        "Rejected": [],
        "Hired": [],
    }

    query = (
        select(Application, Candidate)
        .join(Candidate, Application.candidate_id == Candidate.id)
        .where(Application.job_id == job_id)
    )

    results = db.execute(query).all()

    for application, candidate in results:
        app_data = {
            "id": application.id,
            "candidate_id": application.candidate_id,
            "applied_at": application.applied_at,
            "stage_updated_at": application.stage_updated_at,
            "notes": application.notes,
            "cover_note": application.cover_note,
            "candidate_name": candidate.name,
            "experience_years": candidate.experience_years,
        }

        stage_key = (
            application.stage if application.stage in pipeline_buckets else "Applied"
        )
        pipeline_buckets[stage_key].append(app_data)

    total_active = sum(
        len(pipeline_buckets[stage])
        for stage in [
            "Applied",
            "Screened",
            "Interview_R1",
            "Interview_R2",
            "HR_Round",
        ]
    )
    total_rejected = len(pipeline_buckets["Rejected"])
    total_hired = len(pipeline_buckets["Hired"])

    response = {
        "job_id": job_id,
        "job_title": target_job.title,
        "job_status": target_job.status,
        "total_applications": len(results),
        "total_active": total_active,
        "total_rejected": total_rejected,
        "total_hired": total_hired,
        "pipeline": {
            stage: {"count": len(applications), "applications": applications}
            for stage, applications in pipeline_buckets.items()
        },
    }

    return response


def get_job_filtered_applications(
    db: Session,
    job_id: int,
    applications_filters: JobApplicationFilters,
    current_user: dict,
) -> dict | None:
    print(applications_filters)
    if current_user["role"] != "Admin":
        raise UnauthorizedError

    target_job = db.scalar(select(Job).where(Job.id == job_id))

    if not target_job:
        raise JobNotExistsError

    query = (
        select(Application, Candidate)
        .join(Candidate, Application.candidate_id == Candidate.id)
        .join(Interview, Application.id == Interview.application_id, isouter=True)
        .where(Application.job_id == job_id)
    )

    if applications_filters.this_week:
        query = query.where(Application.applied_at >= get_days_ago(7))

    if applications_filters.needs_attention:
        query = query.where(
            (
                (Application.stage == "Applied")
                & (Application.applied_at <= get_days_ago(3))
            )
            | (
                (Application.stage == "Screened")
                & (Application.stage_updated_at <= get_days_ago(5))
            )
            | (
                (Application.stage.in_(["Interview_R1", "Interview_R2", "HR_Round"]))
                & (Application.stage_updated_at <= get_days_ago(7))
            )
            | (
                (Application.stage == "Offer")
                & (Application.stage_updated_at <= get_days_ago(5))
            )
            | (
                Application.stage.in_(["Interview_R1", "Interview_R2", "HR_Round"])
                & Application.interviews.any(Interview.scheduled_at <= get_days_ago(1))
            )
        )

    if applications_filters.interview_round:
        query = query.where(
            Application.stage.in_(["Interview_R1", "Interview_R2", "HR_Round"])
        )

    if applications_filters.offer_stage:
        query = query.where(Application.stage == "Offer")

    if applications_filters.stage_filter:
        query = query.where(Application.stage == applications_filters.stage_filter)

    if applications_filters.date_applied_filter is not None:
        query = query.where(
            Application.applied_at
            >= get_days_ago(applications_filters.date_applied_filter)
        )

    results = db.execute(query).all()

    applications = []

    for application, candidate in results:
        app_data = {
            "id": application.id,
            "candidate_id": application.candidate_id,
            "applied_at": application.applied_at,
            "stage_updated_at": application.stage_updated_at,
            "in_stage": (
                datetime.now(timezone.utc) - application.stage_updated_at
            ).days,
            "stage": application.stage,
            "notes": application.notes,
            "cover_note": application.cover_note,
            "candidate_name": candidate.name,
            "email": candidate.email,
            "experience_years": candidate.experience_years,
        }

        applications.append(app_data)

    total_active = (
        db.scalar(
            select(func.count(Application.id)).where(Application.job_id == job_id)
        )
        or 0
    )

    this_week = (
        db.scalar(
            select(func.count(Application.id)).where(
                Application.job_id == job_id,
                Application.applied_at >= get_days_ago(7),
            )
        )
        or 0
    )

    interview_count = (
        db.scalar(
            select(func.count(Application.id)).where(
                Application.job_id == job_id,
                Application.stage.in_(["Interview_R1", "Interview_R2", "HR_Round"]),
            )
        )
        or 0
    )

    offers_pending = (
        db.scalar(
            select(func.count(Application.id)).where(
                Application.job_id == job_id,
                Application.stage == "Offer",
            )
        )
        or 0
    )

    needs_attention = (
        db.scalar(
            select(func.count(Application.id)).where(
                Application.job_id == job_id,
                (
                    (Application.stage == "Applied")
                    & (Application.applied_at <= get_days_ago(3))
                    | (
                        (Application.stage == "Screened")
                        & (Application.stage_updated_at <= get_days_ago(5))
                    )
                    | (
                        (
                            Application.stage.in_(
                                ["Interview_R1", "Interview_R2", "HR_Round"]
                            )
                        )
                        & (Application.stage_updated_at <= get_days_ago(7))
                    )
                    | (
                        (Application.stage == "Offer")
                        & (Application.stage_updated_at <= get_days_ago(5))
                    )
                    | (
                        Application.stage.in_(
                            ["Interview_R1", "Interview_R2", "HR_Round"]
                        )
                        & Application.interviews.any(
                            Interview.scheduled_at <= get_days_ago(1)
                        )
                    )
                ),
            )
        )
        or 0
    )

    return {
        "applications": applications,
        "job_id": job_id,
        "job_title": target_job.title,
        "job_status": target_job.status,
        "total_active": total_active,
        "needs_attention": needs_attention,
        "this_week": this_week,
        "interview_count": interview_count,
        "offers_pending": offers_pending,
    }


def get_days_ago(days):
    return datetime.now(timezone.utc) - timedelta(days=days)
