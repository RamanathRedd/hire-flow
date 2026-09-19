from core.security import hash_password
from core.exceptions import (
    CandidateAlreadyExistsError,
    CandidateNotExistsError,
    EmailAlreadyExistsError,
    LinkedInAlreadyExistsError,
    MinGreaterThanMax,
    PhoneAlreadyExistsError,
    ResumeAlreadyExistsError,
)
from domains.applications.model import Application
from domains.candidates.model import Candidate
from domains.candidates.schemas import (
    CandidateCreate,
    CandidateFilters,
    CandidateUpdate,
)
from domains.jobs.model import Job
from sqlalchemy import and_, func, or_, select
from sqlalchemy.orm import Session


def create_candidate(db: Session, candidate: CandidateCreate) -> None:
    candidate_exists = db.scalar(
        select(Candidate).where(
            or_(
                Candidate.email == candidate.email,
                Candidate.phone == candidate.phone,
                Candidate.resume_url == str(candidate.resume_url),
                and_(
                    candidate.linkedin_url is not None,
                    Candidate.linkedin_url == str(candidate.linkedin_url),
                ),
            )
        )
    )

    if candidate_exists:
        raise CandidateAlreadyExistsError

    candidate.password = hash_password(candidate.password)

    db.add(Candidate(**candidate.model_dump(mode="json")))
    db.commit()


def get_candidates(db: Session, candidate_filters: CandidateFilters) -> list:
    query = select(Candidate)

    if (
        candidate_filters.min_experience is not None
        and candidate_filters.max_experience is not None
        and candidate_filters.min_experience > candidate_filters.min_experience
    ):
        raise MinGreaterThanMax
    if candidate_filters.min_experience is not None:
        query = query.where(
            Candidate.experience_years >= candidate_filters.min_experience
        )
    if candidate_filters.max_experience is not None:
        query = query.where(
            Candidate.experience_years <= candidate_filters.max_experience
        )

    if candidate_filters.skills:
        skills = [
            s.strip().lower() for s in candidate_filters.skills.split(",") if s.strip()
        ]
        skill_conditions = [
            func.lower(func.array_to_string(Candidate.skills, ",")).like(
                func.lower(f"%{skill}%")
            )
            for skill in skills
        ]
        query = query.where(or_(*skill_conditions))

    return db.scalars(query.order_by(Candidate.created_at.asc())).all()


def search_candidates(db: Session, search_data: str):
    query = select(Candidate).where(
        Candidate.name.ilike(f"%{search_data}%")
        | Candidate.current_title.ilike(f"%{search_data}%")
        | Candidate.current_company.ilike(f"%{search_data}%")
        | func.array_to_string(Candidate.skills, ",").ilike(f"%{search_data}%")
    )
    response = db.scalars(query).all()
    return response


def get_candidate_details(db: Session, candidate_id: int) -> dict | None:
    candidate = db.scalar(select(Candidate).where(Candidate.id == candidate_id))

    if not candidate:
        raise CandidateNotExistsError

    # Get all candidate columns
    candidate_data = {
        col.name: getattr(candidate, col.name) for col in candidate.__table__.columns
    }

    # Get applications with related jobs
    applications_data = db.execute(
        select(Application, Job)
        .join(Job, Application.job_id == Job.id)
        .where(Application.candidate_id == candidate_id)
    ).all()

    # Process applications and compute summary
    applications = []
    rejected_count = 0
    hired_count = 0

    for application, job in applications_data:
        applications.append(
            {
                "application_id": application.id,
                "job_id": job.id,
                "job_title": job.title,
                "job_department": job.department,
                "job_location": job.location,
                "job_status": job.status,
                "stage": application.stage,
                "applied_at": application.applied_at.isoformat()
                if application.applied_at
                else None,
                "stage_updated_at": application.stage_updated_at.isoformat()
                if application.stage_updated_at
                else None,
                "cover_note": application.cover_note,
                "rejection_reason": application.rejection_reason,
            }
        )

        if application.stage == "rejected":
            rejected_count += 1
        elif application.stage == "hired":
            hired_count += 1

    total_applications = len(applications)

    return candidate_data | {
        "summary": {
            "total_applications": total_applications,
            "active_applications": total_applications - rejected_count - hired_count,
            "rejected_applications": rejected_count,
            "hired_applications": hired_count,
        },
        "applications": applications,
    }


def update_candidate(
    db: Session, candidate_id: int, update_data: CandidateUpdate
) -> None:
    candidate = db.scalar(select(Candidate).where(Candidate.id == candidate_id))

    if not candidate:
        raise CandidateNotExistsError

    # Build update payload with only set fields
    payload = update_data.model_dump(exclude_unset=True, mode="json")

    if not payload:
        return

    # Check for duplicate email
    if (
        "email" in payload
        and payload["email"] != candidate.email
        and db.scalar(
            select(Candidate).where(
                and_(Candidate.id != candidate_id, Candidate.email == payload["email"])
            )
        )
    ):
        raise EmailAlreadyExistsError

    # Check for duplicate phone
    if (
        "phone" in payload
        and payload["phone"] != candidate.phone
        and db.scalar(
            select(Candidate).where(
                and_(Candidate.id != candidate_id, Candidate.phone == payload["phone"])
            )
        )
    ):
        raise PhoneAlreadyExistsError

    # Check for duplicate resume URL
    if (
        "resume_url" in payload
        and payload["resume_url"] != candidate.resume_url
        and db.scalar(
            select(Candidate).where(
                and_(
                    Candidate.id != candidate_id,
                    Candidate.resume_url == payload["resume_url"],
                )
            )
        )
    ):
        raise ResumeAlreadyExistsError

    # Check for duplicate LinkedIn URL
    if (
        "linkedin_url" in payload
        and payload["linkedin_url"]
        and payload["linkedin_url"] != candidate.linkedin_url
        and db.scalar(
            select(Candidate).where(
                and_(
                    Candidate.id != candidate_id,
                    Candidate.linkedin_url == payload["linkedin_url"],
                )
            )
        )
    ):
        raise LinkedInAlreadyExistsError

    # Update candidate
    for key, value in payload.items():
        setattr(candidate, key, value)
    db.commit()


# def search_candidates(db: Session, q: str) -> list[Candidate]:
#     pass

# def delete_candidate(db: Session, candidate_id: int) -> None:
#     candidate = db.scalar(select(Candidate).where(Candidate.id == candidate_id))
#     if not candidate:
#         raise CandidateNotExistsError

#     db.delete(candidate)
#     db.commit()
