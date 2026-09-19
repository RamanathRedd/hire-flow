from datetime import datetime, timedelta, timezone

import jwt
from pydantic import EmailStr
from sqlalchemy import select
from domains.auth.model import RefreshToken
from core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    hash_token,
    verify_password,
)
from core.exceptions import (
    InvalidCredentials,
    InvalidTokenTypeError,
    OldPasswordMismatchError,
    OtherUserSessionError,
    PasswordMismatchError,
    TokenExpiredError,
    TokenNotFoundError,
    TokenNotRecognizedError,
    UserNotExistsError,
)
from domains.candidates.model import Candidate
from domains.recruiters.model import Recruiter
from domains.auth.schemas import PasswordUpdate
from sqlalchemy.orm import Session
from core.config import settings


def login(db: Session, email: EmailStr, password: str) -> dict:
    query = select(Recruiter).where(Recruiter.email == email)
    user = db.scalar(query)

    role = "Admin"

    if not user:
        query = select(Candidate).where(Candidate.email == email)
        user = db.scalar(query)

        if not user:
            raise InvalidCredentials

        role = "User"

    if not verify_password(password, user.password):
        raise InvalidCredentials

    payload = {"sub": str(user.name), "id": user.id, "role": role}
    access_token = create_access_token(payload)
    refresh_token = create_refresh_token(payload)
    token_hash = hash_token(refresh_token)
    # what if same user again login within 2mins?
    create_refresh_token_record(db, token_hash, user.id, role)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "role": role,
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    }


def create_refresh_token_record(
    db: Session, token_hash: str, user_id: int, role: str
) -> None:
    record = RefreshToken(
        token_hash=token_hash,
        user_id=user_id,
        role=role,
        expires_at=(
            datetime.now(timezone.utc)
            + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        ).replace(microsecond=0),
    )
    db.add(record)
    db.commit()


def refresh_token(db: Session, refresh_token: str) -> dict:
    try:
        payload = decode_token(refresh_token)
    except jwt.PyJWTError as error:
        raise error

    if payload.get("type") != "refresh":
        raise InvalidTokenTypeError

    token_hash = hash_token(refresh_token)
    token_data = get_by_hash(db, token_hash)

    if not token_data:
        raise TokenNotRecognizedError

    if datetime.now(timezone.utc).replace(microsecond=0) > token_data.expires_at:
        raise TokenExpiredError

    user_id = payload.get("id")
    role = payload.get("role")

    if role == "Admin":
        user_exists = db.scalar(select(Recruiter.id).where(Recruiter.id == user_id))
    else:
        user_exists = db.scalar(select(Candidate.id).where(Candidate.id == user_id))

    if not user_exists:
        # Prevent rotation and force logout by cleaning up or raising an error
        raise UserNotExistsError

    access_token = create_access_token(payload)
    refresh_token = create_refresh_token(payload)
    token_hash = hash_token(refresh_token)
    db.delete(token_data)
    db.commit()
    create_refresh_token_record(db, token_hash, token_data.user_id, role)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "role": role,
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    }


def logout(db: Session, refresh_token: str, current_user: dict) -> None:
    token_hash = hash_token(refresh_token)
    token_data = get_by_hash(db, token_hash)

    if not token_data:
        raise TokenNotFoundError

    if (
        token_data.user_id != current_user["id"]
        or token_data.role != current_user["role"]
    ):
        raise OtherUserSessionError

    db.delete(token_data)
    db.commit()


def get_by_hash(db: Session, token_hash: str) -> RefreshToken:
    return db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).first()


def read_me(db: Session, role: str, id: int) -> dict:
    if role == "Admin":
        user = db.scalar(select(Recruiter).where(Recruiter.id == id))
    else:
        user = db.scalar(select(Candidate).where(Candidate.id == id))

    if not user:
        raise UserNotExistsError

    return {
        "id": user.id,
        "role": role,
        "email": user.email,
        "name": user.name,
        "department": user.department if role == "Admin" else None,
        "skills": user.skills if role == "Admin" else [],
        "experience_years": user.experience_years if role == "Admin" else None,
    }


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
