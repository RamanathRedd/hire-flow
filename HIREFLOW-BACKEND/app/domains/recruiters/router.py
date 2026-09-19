from core.database import get_db
from core.exceptions import (
    ActiveJobExistsError,
    EmailAlreadyExistsError,
    PhoneAlreadyExistsError,
    RecruiterAlreadyExistsError,
    RecruiterNotExistsError,
)
from domains.jobs.model import Job
from domains.recruiters import crud
from domains.recruiters.schemas import (
    RecruiterCreate,
    RecruiterListResponse,
    RecruiterUpdate,
)
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session
from starlette import status

recruiters_router = APIRouter()


@recruiters_router.post("", status_code=status.HTTP_201_CREATED)
def create_recruiter(recruiter: RecruiterCreate, db: Session = Depends(get_db)):
    try:
        crud.create_recruiter(db, recruiter)
        return {"message": "Recruiter created successfully"}
    except RecruiterAlreadyExistsError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Recruiter already exists"
        )


@recruiters_router.get(
    "", status_code=status.HTTP_200_OK, response_model=RecruiterListResponse
)
def get_recruiters(
    department: str | None = Query(default=None, min_length=3, max_length=100),
    db: Session = Depends(get_db),
):
    response = crud.get_recruiters(db, department)
    return {"data": response}


@recruiters_router.get(
    "/{recruiter_id}",
    status_code=status.HTTP_200_OK,
)
def get_recruiter_details(recruiter_id: int, db: Session = Depends(get_db)):
    response = crud.get_recruiter_details(db, recruiter_id)

    if not response:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Recruiter does not exists"
        )

    jobs = db.scalars(select(Job).where(Job.created_by == recruiter_id)).all()
    filtered_jobs = []
    active_jobs = 0

    for job in jobs:
        if job.status == "Open":
            active_jobs += 1
        filtered_jobs.append(
            {
                "id": job.id,
                "title": job.title,
                "status": job.status,
                "openings_count": job.openings_count,
                "filled_count": job.filled_count,
                "created_at": job.created_at,
            }
        )

    return {
        "data": {
            "id": response.id,
            "name": response.name,
            "email": response.email,
            "phone": response.phone,
            "department": response.department,
            "created_at": response.created_at,
            "stats": {
                "total_jobs_created": len(filtered_jobs),
                "active_jobs": active_jobs,
            },
            "jobs": filtered_jobs,
        }
    }


@recruiters_router.patch("/{recruiter_id}", status_code=status.HTTP_200_OK)
def update_recruiter(
    recruiter_id: int,
    update_recruiter: RecruiterUpdate,
    db: Session = Depends(get_db),
):
    try:
        crud.update_recruiter(db, recruiter_id, update_recruiter)
        return {"message": "Recruiter profile updated successfully"}
    except RecruiterNotExistsError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Recruiter not found"
        )

    except EmailAlreadyExistsError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email already exists"
        )

    except PhoneAlreadyExistsError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number already exists",
        )


@recruiters_router.delete("/{recruiter_id}", status_code=status.HTTP_200_OK)
def delete_recruiter(recruiter_id: int, db: Session = Depends(get_db)):
    try:
        crud.delete_recruiter(db, recruiter_id)
        return {"message": "Recruiter Deleted Successfully"}
    except ActiveJobExistsError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete recruiter with active job postings.Close all jobs first.",
        )
    except RecruiterNotExistsError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Recruiter does not exist"
        )
