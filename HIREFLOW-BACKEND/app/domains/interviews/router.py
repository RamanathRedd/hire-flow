from core.database import get_db
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
from domains.interviews import crud
from domains.interviews.schemas import (
    CancelInterview,
    InterviewCreate,
    InterviewFilters,
    SubmitFeedback,
    UpdateInterview,
)
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from starlette import status
from core.security import CurrentUser

interviews_router = APIRouter()


@interviews_router.post("", status_code=status.HTTP_201_CREATED)
def create_interview(
    interview_details: InterviewCreate,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    try:
        crud.create_interview(db, interview_details, current_user)
        return {"message": "created successfully"}
    except UnauthorizedError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Only recruiters can schedule interviews",
        )
    except ApplicationNotExistsError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Application not found"
        )
    except UnscreenedApplicationError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot schedule interview for unscreened application",
        )
    except RejectedApplicationError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot schedule interview for rejected application",
        )
    except ClosedApplicationError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot schedule interview for closed application",
        )
    except DuplicateRoundError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An interview for this round number is already scheduled",
        )
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err))


@interviews_router.get("", status_code=status.HTTP_200_OK)
def get_interviews(
    current_user: CurrentUser,
    interview_filters: InterviewFilters = Query(),
    db: Session = Depends(get_db),
):
    try:
        response = crud.get_interviews(db, interview_filters, current_user)
        return {"data": response}
    except UnauthorizedError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Only recruiters can view interviews",
        )


@interviews_router.get("/upcoming", status_code=status.HTTP_200_OK)
def list_upcoming_interviews(current_user: CurrentUser, db: Session = Depends(get_db)):
    try:
        response = crud.list_upcoming_interviews(db, current_user)
        return {"data": response}
    except UnauthorizedError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Only recruiters can view upcoming interviews",
        )


@interviews_router.get("/{interview_id}", status_code=status.HTTP_200_OK)
def get_interview_details(
    interview_id: int, current_user: CurrentUser, db: Session = Depends(get_db)
):
    try:
        response = crud.get_interview_details(db, interview_id, current_user)
        return {"data": response}
    except UnauthorizedError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Only recruiters can view this interview",
        )
    except InterviewDetailsNotExistsError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Interview not found"
        )


@interviews_router.patch("/{interview_id}", status_code=status.HTTP_200_OK)
def update_interview(
    interview_id: int,
    interview_update: UpdateInterview,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    try:
        crud.update_interview(db, interview_id, interview_update, current_user)
        return {"message": "updated successfully"}
    except UnauthorizedError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Only recruiters can update this interview",
        )
    except InterviewDetailsNotExistsError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Interview not found"
        )
    except InterviewAlreadyCompletedError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot update a completed interview",
        )
    except InterviewAlreadyCancelledError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot update a cancelled interview",
        )
    except RecruiterNotExistsError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Interviewer not found"
        )
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err))


@interviews_router.patch("/{interview_id}/cancel", status_code=status.HTTP_200_OK)
def cancel_interview(
    interview_id: int,
    cancellation_data: CancelInterview,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    try:
        crud.cancel_interview(db, interview_id, cancellation_data, current_user)
        return {"message": "Interview cancelled successfully"}
    except UnauthorizedError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Only recruiters can cancel this interview",
        )
    except InterviewDetailsNotExistsError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Interview not found"
        )
    except RecruiterNotExistsError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Interviewer not found"
        )
    except FeedbackAlreadySubmittedError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot cancel completed interview",
        )
    except InterviewAlreadyCancelledError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Interview already cancelled",
        )


@interviews_router.patch("/{interview_id}/feedback", status_code=status.HTTP_200_OK)
def submit_interview_feedback(
    interview_id: int,
    submit_feedback: SubmitFeedback,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    try:
        crud.submit_interview_feedback(db, interview_id, submit_feedback, current_user)
        return {"message": "Feedback submitted successfully"}
    except UnauthorizedError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Only recruiters can submit feedback for this interview",
        )
    except FeedbackEmptyError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Feedback cannot be empty"
        )
    except InterviewDetailsNotExistsError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Interview not found"
        )
    except RecruiterNotExistsError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Interviewer not found"
        )
    except FeedbackAlreadySubmittedError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Feedback already submitted"
        )
    except InterviewAlreadyCancelledError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot submit feedback for cancelled interview",
        )
