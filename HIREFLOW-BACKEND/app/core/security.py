from typing import Annotated
from fastapi import Depends
import jwt
from datetime import datetime, timedelta, timezone
from core.config import settings
from fastapi.security import OAuth2PasswordBearer
from pwdlib import PasswordHash

password_hash = PasswordHash.recommended()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return password_hash.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc).replace(microsecond=0) + expires_delta
    else:
        expire = datetime.now(timezone.utc).replace(microsecond=0) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
        )
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )
    return encoded_jwt


def verify_access_token(token: str) -> str | None:
    """Verify a JWT access token and return the subject (user id) if valid."""
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
            options={"require": ["exp", "sub"]},
        )
    except jwt.InvalidTokenError:
        return None
    else:
        return payload


def get_authenticated_user(
    token: Annotated[str, Depends(oauth2_scheme)],
):
    payload = verify_access_token(token)
    if payload is None:
        return None

    try:
        user_id = int(payload["id"])
        role = payload["role"]
    except (KeyError, TypeError, ValueError):
        return None

    return {"id": user_id, "role": role}


# Overlooked Negative Cases & Edge Scenarios
# ⚠️ Concurrency Race ConditionsIf a user submits multiple simultaneous
# requests during a poor connection window, the first request revokes
# the token hash and issues a replacement. The second concurrent request
# arrives using the same original token, matches a revoked record, and fails.

# Mitigation: Implement a 30-second token rotation grace window instead of
# instant revocation.

# ⚠️ Session Growth ExplosionEvery login and token rotation
# adds records without clean deletions. Over time, the tracking table will face
# performance degradation.

# Mitigation: Implement a background cleanup routine
# to purge expired tokens.
