from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
import jwt
from starlette import status
from core.security import get_current_user
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
from domains.auth import crud
from core.database import get_db
from domains.auth.schemas import PasswordUpdate
from sqlalchemy.orm import Session

auth_router = APIRouter()


@auth_router.post("/login", status_code=status.HTTP_200_OK)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):
    try:
        response = crud.login(db, form_data.username, form_data.password)
        # Return in OAuth2 standard format for Swagger compatibility
        return {
            "access_token": response["access_token"],
            "token_type": "bearer",
            "refresh_token": response["refresh_token"],
            "role": response["role"],
            "expires_in": response["expires_in"] * 60,
        }
    except InvalidCredentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
        )


@auth_router.post("/refresh", status_code=status.HTTP_200_OK)
def refresh_token(refresh_token: str, db: Session = Depends(get_db)):
    try:
        response = crud.refresh_token(db, refresh_token)
        return {"data": response}
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token"
        )
    except InvalidTokenTypeError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type"
        )
    except TokenNotRecognizedError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Token not recognized"
        )
    except TokenExpiredError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired, please log in again",
        )
    except UserNotExistsError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User no longer exists"
        )


@auth_router.post("/logout", status_code=status.HTTP_200_OK)
def logout(
    refresh_token: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    try:
        crud.logout(db, refresh_token, current_user)
        return {"message": "Logout Successful"}
    except TokenNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Token not found"
        )
    except OtherUserSessionError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot revoke another user's session",
        )


@auth_router.get("", status_code=status.HTTP_200_OK)
def read_me(
    current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)
):
    try:
        response = crud.read_me(db, current_user["role"], current_user["id"])
        return response
    except UserNotExistsError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User no longer exists"
        )


@auth_router.patch("", status_code=status.HTTP_200_OK)
def update_password(
    new_password_data: PasswordUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        crud.update_password(
            db, current_user["role"], current_user["id"], new_password_data
        )
        return {"message": "Password Updated Succesfully"}
    except PasswordMismatchError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Password Mismatch"
        )
    except OldPasswordMismatchError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Old password is incorrect"
        )
