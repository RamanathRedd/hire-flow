from core.constants import STATUS
from core.database import get_db
from core.exceptions import (
    ActiveApplicationsExistsError,
    JobNotExistsError,
    RecruiterNotExistsError,
    SameStatusError,
)
from domains.jobs import crud
from domains.jobs.schemas import JobCreate, JobFilters, JobUpdate
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from starlette import status

jobs_router = APIRouter()


def _serialize_job(job) -> dict:
    payload = {
        column.name: getattr(job, column.name) for column in job.__table__.columns
    }
    payload["recruiter_name"] = job.recruiter.name if job.recruiter else None
    return payload


@jobs_router.post("", status_code=status.HTTP_201_CREATED)
def create_job(job: JobCreate, db: Session = Depends(get_db)):
    try:
        crud.create_job(db, job)
        return {"message": "Job created successfully"}
    except RecruiterNotExistsError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Recruiter does not exist"
        )


@jobs_router.get("", status_code=status.HTTP_200_OK)
def get_jobs(job_filters: JobFilters = Query(), db: Session = Depends(get_db)):
    filtered_jobs = crud.get_jobs(db, job_filters)

    filtered_jobs = [_serialize_job(job) for job in filtered_jobs]

    return {"data": filtered_jobs}


@jobs_router.get("/{job_id}", status_code=status.HTTP_200_OK)
def get_job_by_id(job_id: int, db: Session = Depends(get_db)):
    try:
        response = crud.get_job_by_id(db, job_id)
        return {"data": response}
    except JobNotExistsError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Job not found"
        )


@jobs_router.patch("/{job_id}", status_code=status.HTTP_200_OK)
def update_job(job_id: int, job_data: JobUpdate, db: Session = Depends(get_db)):
    try:
        crud.update_job(db, job_id, job_data)
        return {"message": "Job updated successfully"}
    except JobNotExistsError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Job not found"
        )


@jobs_router.delete("/{job_id}", status_code=status.HTTP_200_OK)
def delete_job(job_id: int, db: Session = Depends(get_db)):
    try:
        crud.delete_job(db, job_id)
        return {"message": "Job deleted successfully"}
    except JobNotExistsError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Job not found"
        )
    except ActiveApplicationsExistsError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete job with active applications",
        )


@jobs_router.patch("/{job_id}/status", status_code=status.HTTP_200_OK)
def update_job_status(job_id: int, new_status: STATUS, db: Session = Depends(get_db)):
    try:
        crud.update_job_status(db, job_id, new_status)
        return {"message": "Job status updated successfully"}
    except JobNotExistsError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Job not found"
        )
    except SameStatusError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Job is already {new_status}",
        )


@jobs_router.get("/{job_id}/applications", status_code=status.HTTP_200_OK)
def get_job_applications(job_id: int, db: Session = Depends(get_db)):
    try:
        response = crud.get_job_applications(db, job_id)
        return {"data": response}
    except JobNotExistsError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Job not found"
        )
