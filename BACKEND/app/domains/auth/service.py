from pydantic import EmailStr
from sqlalchemy import select
from core.security import (
    create_access_token,
    hash_password,
    verify_password,
)
from core.exceptions import (
    InvalidCredentials,
    InvalidOrExpiredTokenError,
    OldPasswordMismatchError,
    PasswordMismatchError,
)
from domains.candidates.model import Candidate
from domains.candidates.schemas import CandidateCreate
from domains.candidates import service as candidate_service
from domains.recruiters.model import Recruiter
from domains.recruiters.schemas import RecruiterCreate
from domains.recruiters import service as recruiter_service
from domains.auth.schemas import PasswordUpdate
from sqlalchemy.orm import Session
from core.config import settings
from core.security import verify_access_token
from domains.recruiters.service import get_recruiter_details
from domains.candidates.service import get_candidate_details


def register(db: Session, isAdmin: bool, data: dict) -> dict:
    if isAdmin:
        recruiter_data = RecruiterCreate.model_validate(data)
        recruiter_service.create_recruiter(db, recruiter_data)
        return {"message": "Recruiter created successfully"}
    else:
        candidate_data = CandidateCreate.model_validate(data)
        candidate_service.create_candidate(db, candidate_data)
        return {"message": "Candidate created successfully"}


def login(
    db: Session,
    isAdmin: bool,
    email: EmailStr,
    password: str,
) -> dict:
    if isAdmin:
        query = select(Recruiter).where(Recruiter.email == email)
        user = db.scalar(query)
        role = "Admin"
    else:
        query = select(Candidate).where(Candidate.email == email)
        user = db.scalar(query)

        if not user:
            raise InvalidCredentials

        role = "User"

    if not verify_password(password, user.password):
        raise InvalidCredentials

    payload = {"sub": str(user.name), "id": user.id, "role": role}
    access_token = create_access_token(payload)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": role,
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    }


def get_current_user(db: Session, token: str) -> dict:
    """Get the currently authenticated user."""
    payload = verify_access_token(token)

    if payload is None:
        raise InvalidOrExpiredTokenError

    # Validate user_id is a valid integer (defense against malformed JWT)
    try:
        user_id = int(payload["id"])
    except (TypeError, ValueError):
        raise InvalidOrExpiredTokenError

    if payload["role"] == "Admin":
        user = get_recruiter_details(db, user_id)
    else:
        user = get_candidate_details(db, user_id)

    if not user:
        raise InvalidCredentials

    return user


def update_password(
    db: Session, role: str, id: int, new_password_data: PasswordUpdate
) -> None:
    if new_password_data.new_password != new_password_data.confirm_password:
        raise PasswordMismatchError

    if role == "Admin":
        query = select(Recruiter).where(Recruiter.id == id)
    else:
        query = select(Candidate).where(Candidate.id == id)

    update_record = db.scalar(query)
    if not verify_password(new_password_data.old_password, update_record.password):
        raise OldPasswordMismatchError

    update_record.password = hash_password(new_password_data.new_password)
    db.commit()
