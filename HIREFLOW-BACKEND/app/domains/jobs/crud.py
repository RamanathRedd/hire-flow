from core.constants import STAGES, STATUS
from core.exceptions import (
    ActiveApplicationsExistsError,
    JobNotExistsError,
    RecruiterNotExistsError,
    SameStatusError,
)
from domains.applications.model import Application
from domains.candidates.model import Candidate
from domains.jobs.model import Job
from domains.jobs.schemas import JobCreate, JobFilters, JobUpdate
from domains.recruiters.crud import get_recruiter_details
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload


def create_job(db: Session, job_data: JobCreate) -> None:
    recruiter_exists = get_recruiter_details(db, job_data.created_by)
    if not recruiter_exists:
        raise RecruiterNotExistsError
    db.add(Job(**job_data.model_dump()))
    db.commit()


def get_jobs(db: Session, job_filters: JobFilters) -> list[Job]:
    query = select(Job).options(joinedload(Job.recruiter))

    if job_filters.department:
        query = query.where(Job.department == job_filters.department)

    if job_filters.status:
        query = query.where(Job.status == job_filters.status)

    if job_filters.location:
        query = query.where(Job.location.ilike(f"%{job_filters.location}%"))

    return db.scalars(query).all()


def get_job_by_id(db: Session, job_id: int) -> dict | None:
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


def update_job(db: Session, job_id: int, job_data: JobUpdate) -> None:
    query = select(Job).where(Job.id == job_id)
    job = db.scalar(query)

    if not job:
        raise JobNotExistsError

    payload = job_data.model_dump(exclude_unset=True)
    for key, value in payload.items():
        setattr(job, key, value)
    db.commit()


def delete_job(db: Session, job_id: int) -> None:
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


def update_job_status(db: Session, job_id: int, new_status: STATUS) -> None:
    query = select(Job).where(Job.id == job_id)
    job = db.scalar(query)

    if not job:
        raise JobNotExistsError

    if job.status == new_status:
        raise SameStatusError

    job.status = new_status
    db.commit()


def get_job_applications(db: Session, job_id: int) -> dict | None:
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
            application.stage if application.stage in pipeline_buckets else "applied"
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
