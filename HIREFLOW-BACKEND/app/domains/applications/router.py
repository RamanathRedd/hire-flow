from core.database import get_db
from core.exceptions import (
    ApplicationAlreadyExistsError,
    ApplicationAlreadyHiredError,
    ApplicationAlreadyRejectedError,
    ApplicationNotExistsError,
    BackwardStageError,
    CandidateNotExistsError,
    DuplicateStageError,
    JobNotExistsError,
    JobNotOpenError,
    RecruiterNotExistsError,
    SkippedStageError,
    UnauthorizedError,
)
from domains.applications import crud
from domains.applications.schemas import (
    ApplicationCreate,
    ApplicationFilters,
    RejectApplication,
    UpdateStage,
)
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from starlette import status
from core.security import CurrentUser

applications_router = APIRouter()


@applications_router.post("", status_code=status.HTTP_201_CREATED)
def create_application(
    application: ApplicationCreate,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    try:
        crud.create_application(db, application, current_user)
        return {"message": "Application created successfully"}
    except UnauthorizedError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Only candidates can apply for this job",
        )
    except JobNotExistsError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Job not found"
        )
    except JobNotOpenError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job is not accepting applications",
        )
    except CandidateNotExistsError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found"
        )
    except ApplicationAlreadyExistsError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Candidate already applied to this job",
        )


@applications_router.get("", status_code=status.HTTP_200_OK)
def get_applications(
    current_user: CurrentUser,
    application_filters: ApplicationFilters = Query(),
    db: Session = Depends(get_db),
):
    try:
        response = crud.get_applications(db, application_filters, current_user)
        return {"data": response}
    except UnauthorizedError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Only candidates can view applications",
        )


@applications_router.get("/{application_id}", status_code=status.HTTP_200_OK)
def get_application_details(
    application_id: int, current_user: CurrentUser, db: Session = Depends(get_db)
):
    try:
        response = crud.get_application_details(db, application_id, current_user)
        return {"data": response}
    except UnauthorizedError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Only candidates can view this application",
        )
    except ApplicationNotExistsError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Application not found"
        )


@applications_router.patch("/{application_id}/stage", status_code=status.HTTP_200_OK)
def update_application_stage(
    application_id: int,
    update_stage: UpdateStage,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    if update_stage.new_stage == "Rejected":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Use the /applications/{application_id}/reject endpoint to reject an application",
        )
    try:
        crud.update_application_stage(db, application_id, update_stage, current_user)
        return {"message": "Updated Successfully"}
    except UnauthorizedError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Only recruiters can update this application stage",
        )
    except RecruiterNotExistsError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Recruiter not found"
        )
    except ApplicationNotExistsError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Application not found"
        )
    except ApplicationAlreadyRejectedError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot update stage of a rejected application",
        )
    except ApplicationAlreadyHiredError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot update stage of a hired application",
        )
    except DuplicateStageError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Application is already in the specified stage",
        )
    except BackwardStageError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot move to a backward stage",
        )
    except SkippedStageError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot skip stages. Next valid stage is {err.next_valid_stage}",
        )


@applications_router.patch("/{application_id}/reject", status_code=status.HTTP_200_OK)
def reject_application(
    application_id: int,
    update_stage: RejectApplication,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    try:
        crud.reject_application(db, application_id, update_stage, current_user)
        return {"message": "Application rejected successfully"}
    except UnauthorizedError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Only recruiters can reject this application",
        )
    except RecruiterNotExistsError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Recruiter not found"
        )
    except ApplicationNotExistsError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Application not found"
        )
    except ApplicationAlreadyRejectedError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Application is already rejected",
        )
    except ApplicationAlreadyHiredError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot reject a hired application",
        )


@applications_router.get("/{application_id}/timeline", status_code=status.HTTP_200_OK)
def get_application_timeline(
    application_id: int, current_user: CurrentUser, db: Session = Depends(get_db)
):
    try:
        response = crud.get_application_timeline(db, application_id, current_user)
        return {"data": response}
    except UnauthorizedError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Only candidates can view this application timeline",
        )
    except ApplicationNotExistsError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Application not found"
        )
