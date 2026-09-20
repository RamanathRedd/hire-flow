from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from starlette import status
from core.security import get_authenticated_user, oauth2_scheme
from core.exceptions import (
    CandidateAlreadyExistsError,
    InvalidCredentials,
    InvalidOrExpiredTokenError,
    OldPasswordMismatchError,
    PasswordMismatchError,
    RecruiterAlreadyExistsError,
)
from domains.auth import crud
from core.database import get_db
from domains.auth.schemas import PasswordUpdate
from sqlalchemy.orm import Session
from typing import Annotated


auth_router = APIRouter()


@auth_router.post("/register", status_code=status.HTTP_201_CREATED)
def register(role: str, data: dict, db: Session = Depends(get_db)):
    try:
        return crud.register(db, role, data)
    except ValueError as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error))
    except (
        RecruiterAlreadyExistsError,
        CandidateAlreadyExistsError,
    ) as error:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(error))


@auth_router.post("/login", status_code=status.HTTP_200_OK)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):
    try:
        response = crud.login(db, form_data.username, form_data.password)
        return response
    except InvalidCredentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
        )


@auth_router.get("", status_code=status.HTTP_200_OK)
async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Session = Depends(get_db),
):
    try:
        response = crud.get_current_user(db, token)
        return response
    except InvalidOrExpiredTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    except InvalidCredentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )


@auth_router.patch("", status_code=status.HTTP_200_OK)
def update_password(
    new_password_data: PasswordUpdate,
    current_user=Depends(get_authenticated_user),
    db: Session = Depends(get_db),
):
    try:
        crud.update_password(
            db, current_user["role"], current_user["id"], new_password_data
        )
        return {"message": "Password updated successfully"}
    except PasswordMismatchError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Password Mismatch"
        )
    except OldPasswordMismatchError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Old password is incorrect"
        )
