from core.security import CurrentUser
from core.database import get_db
from core.exceptions import (
    ActiveJobExistsError,
    PhoneAlreadyExistsError,
    RecruiterNotExistsError,
    UnauthorizedError,
)
from domains.jobs.model import Job
from domains.recruiters import service
from domains.recruiters.schemas import (
    RecruiterListResponse,
    RecruiterUpdate,
)
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session
from starlette import status

recruiters_router = APIRouter()


@recruiters_router.get(
    "", status_code=status.HTTP_200_OK, response_model=list[RecruiterListResponse]
)
def get_recruiters(
    current_user: CurrentUser,
    department: str | None = Query(default=None, min_length=3, max_length=100),
    db: Session = Depends(get_db),
):
    try:
        response = service.get_recruiters(db, department, current_user)
        return response
    except UnauthorizedError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Only admins can view the recruiter list",
        )


@recruiters_router.get(
    "/recruiter",
    status_code=status.HTTP_200_OK,
)
def get_recruiter_details(
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    try:
        response = service.get_recruiter_details(db, current_user)
        if not response:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Recruiter does not exists",
            )

        jobs = db.scalars(select(Job).where(Job.created_by == response.id)).all()
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

    except UnauthorizedError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Only admins can view recruiter details",
        )


@recruiters_router.patch("/{recruiter_id}", status_code=status.HTTP_200_OK)
def update_recruiter(
    recruiter_id: int,
    update_recruiter: RecruiterUpdate,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    try:
        service.update_recruiter(db, recruiter_id, update_recruiter, current_user)
        return {"message": "Recruiter profile updated successfully"}
    except UnauthorizedError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Only admins can update recruiter profiles",
        )
    except RecruiterNotExistsError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Recruiter not found"
        )
    except PhoneAlreadyExistsError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number already exists",
        )


@recruiters_router.delete("/{recruiter_id}", status_code=status.HTTP_200_OK)
def delete_recruiter(
    recruiter_id: int,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    try:
        service.delete_recruiter(db, recruiter_id, current_user)
        return {"message": "Recruiter Deleted Successfully"}
    except UnauthorizedError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Only admins can delete recruiters",
        )
    except ActiveJobExistsError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete recruiter with active job postings.Close all jobs first.",
        )
    except RecruiterNotExistsError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Recruiter does not exist"
        )
