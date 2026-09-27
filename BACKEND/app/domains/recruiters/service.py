from core.security import hash_password
from core.exceptions import (
    ActiveJobExistsError,
    EmailAlreadyExistsError,
    PhoneAlreadyExistsError,
    RecruiterAlreadyExistsError,
    RecruiterNotExistsError,
)
from domains.jobs.model import Job
from domains.recruiters.model import Recruiter
from domains.recruiters.schemas import (
    RecruiterCreate,
    RecruiterUpdate,
)
from sqlalchemy import select
from sqlalchemy.orm import Session, defer


def create_recruiter(db: Session, recruiter_data: RecruiterCreate) -> None:
    query = select(Recruiter).where(
        (Recruiter.email == recruiter_data.email)
        | (Recruiter.phone == recruiter_data.phone)
    )
    recruiter_exist = db.scalar(query)

    if recruiter_exist:
        raise RecruiterAlreadyExistsError

    recruiter_data.password = hash_password(recruiter_data.password)

    db.add(Recruiter(**recruiter_data.model_dump()))
    db.commit()


def get_recruiters(db: Session, department: str | None) -> list[Recruiter]:
    query = select(Recruiter)
    if department:
        query = query.where(Recruiter.department == department)

    return db.scalars(query).all()


def get_recruiter_details(db: Session, recruiter_id: int) -> Recruiter | None:
    query = (
        select(Recruiter)
        .options(defer(Recruiter.password))
        .where(Recruiter.id == recruiter_id)
    )
    return db.scalar(query)


def update_recruiter(
    db: Session, recruiter_id: int, recruiter_update: RecruiterUpdate
) -> None:
    query = select(Recruiter).where(Recruiter.id == recruiter_id)
    recruiter = db.scalar(query)

    if not recruiter:
        raise RecruiterNotExistsError

    if recruiter_update.email and recruiter_update.email != recruiter.email:
        email_query = select(Recruiter).where(
            (Recruiter.id != recruiter_id) & (Recruiter.email == recruiter_update.email)
        )
        if db.scalar(email_query):
            raise EmailAlreadyExistsError

    if recruiter_update.phone and recruiter_update.phone != recruiter.phone:
        phone_query = select(Recruiter).where(
            (Recruiter.id != recruiter_id) & (Recruiter.phone == recruiter_update.phone)
        )
        if db.scalar(phone_query):
            raise PhoneAlreadyExistsError

    payload = recruiter_update.model_dump(exclude_unset=True)
    for key, value in payload.items():
        setattr(recruiter, key, value)

    db.commit()


def delete_recruiter(db: Session, recruiter_id: int) -> None:
    job_exists = db.scalar(
        select(Job).where((Job.created_by == recruiter_id) & (Job.status == "Open"))
    )

    if job_exists:
        raise ActiveJobExistsError

    query = select(Recruiter).where(Recruiter.id == recruiter_id)
    recruiter = db.scalar(query)

    if not recruiter:
        raise RecruiterNotExistsError

    db.delete(recruiter)
    db.commit()
