from core.security import CurrentUser
from core.database import get_db
from core.exceptions import (
    CandidateNotExistsError,
    EmailAlreadyExistsError,
    LinkedInAlreadyExistsError,
    MinGreaterThanMax,
    PhoneAlreadyExistsError,
    ResumeAlreadyExistsError,
    UnauthorizedError,
)
from domains.candidates import service
from domains.candidates.schemas import (
    CandidateFilters,
    CandidateUpdate,
)
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from starlette import status

candidates_router = APIRouter()


@candidates_router.get("", status_code=status.HTTP_200_OK)
def get_candidates(
    current_user: CurrentUser,
    candidate_filters: CandidateFilters = Query(),
    db: Session = Depends(get_db),
):
    try:
        response = service.get_candidates(db, candidate_filters, current_user)
        return {"data": response}
    except UnauthorizedError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Only admins can view the candidate list",
        )
    except MinGreaterThanMax:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="min_experience cannot exceed max_experience",
        )


@candidates_router.get("/search", status_code=status.HTTP_200_OK)
def search_candidates(
    current_user: CurrentUser,
    search_data: str = Query(default=""),
    db: Session = Depends(get_db),
):
    try:
        response = service.search_candidates(db, search_data, current_user)
        return {"data": response}
    except UnauthorizedError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Only admins can search candidates",
        )


@candidates_router.get("/candidate", status_code=status.HTTP_200_OK)
def get_candidate_details(current_user: CurrentUser, db: Session = Depends(get_db)):
    try:
        response = service.get_candidate_details(db, current_user)
        return response
    except UnauthorizedError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="You are not authorized to view candidate details",
        )
    except CandidateNotExistsError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found"
        )


@candidates_router.patch("/{candidate_id}", status_code=status.HTTP_200_OK)
def update_candidate(
    candidate_id: int,
    update_candidate: CandidateUpdate,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
):
    try:
        service.update_candidate(db, candidate_id, update_candidate, current_user)
        return {"message": "Candidate updated successfully"}
    except UnauthorizedError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="You are not authorized to update candidate profiles",
        )
    except CandidateNotExistsError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found"
        )
    except PhoneAlreadyExistsError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number already exists",
        )
    except ResumeAlreadyExistsError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Resume URL already exists",
        )
    except LinkedInAlreadyExistsError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="LinkedIn URL already exists",
        )


# @candidates_router

# @candidates_router.delete("/{candidate_id}", status_code=status.HTTP_200_OK)
# def delete_candidate(candidate_id: int, db: Session = Depends(get_db)):
#     try:
#         service.delete_candidate(db, candidate_id)
#         return {"message": "Candidate deleted successfully"}
#     except CandidateNotExistsError:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found"
#         )
