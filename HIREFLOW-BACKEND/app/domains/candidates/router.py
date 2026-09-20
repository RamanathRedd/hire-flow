from core.database import get_db
from core.exceptions import (
    CandidateAlreadyExistsError,
    CandidateNotExistsError,
    EmailAlreadyExistsError,
    LinkedInAlreadyExistsError,
    MinGreaterThanMax,
    PhoneAlreadyExistsError,
    ResumeAlreadyExistsError,
)
from domains.candidates import crud
from domains.candidates.schemas import (
    CandidateCreate,
    CandidateFilters,
    CandidateUpdate,
)
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from starlette import status

candidates_router = APIRouter()


@candidates_router.get("", status_code=status.HTTP_200_OK)
def get_candidates(
    candidate_filters: CandidateFilters = Query(), db: Session = Depends(get_db)
):
    try:
        response = crud.get_candidates(db, candidate_filters)
        return {"data": response}
    except MinGreaterThanMax:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="min_experience cannot exceed max_experience",
        )


@candidates_router.get("/search", status_code=status.HTTP_200_OK)
def search_candidates(
    search_data: str = Query(default=""), db: Session = Depends(get_db)
):
    response = crud.search_candidates(db, search_data)
    return {"data": response}


@candidates_router.get("/{candidate_id}", status_code=status.HTTP_200_OK)
def get_candidate_details(candidate_id: int, db: Session = Depends(get_db)):
    try:
        response = crud.get_candidate_details(db, candidate_id)
        return {"data": response}
    except CandidateNotExistsError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found"
        )


@candidates_router.patch("/{candidate_id}", status_code=status.HTTP_200_OK)
def update_candidate(
    candidate_id: int, update_candidate: CandidateUpdate, db: Session = Depends(get_db)
):
    try:
        crud.update_candidate(db, candidate_id, update_candidate)
        return {"message": "Candidate updated successfully"}
    except CandidateNotExistsError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found"
        )
    except EmailAlreadyExistsError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists",
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
#         crud.delete_candidate(db, candidate_id)
#         return {"message": "Candidate deleted successfully"}
#     except CandidateNotExistsError:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found"
#         )
