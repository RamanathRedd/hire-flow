import bcrypt
import hashlib
from fastapi import Depends, HTTPException
import jwt
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from domains.candidates.model import Candidate
from domains.recruiters.model import Recruiter
from core.database import get_db
from core.config import settings
from sqlalchemy.orm import Session
from fastapi.security import HTTPBearer
# , OAuth2PasswordBearer


# oauth2_scheme = OAuth2PasswordBearer(
#     tokenUrl="auth/login",
# )

http_bearer = HTTPBearer(description="Bearer token for authentication")


def hash_password(plain_password: str) -> str:
    pwd_bytes = plain_password.encode("utf-8")
    # Generate salt and hash
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(pwd_bytes, salt)
    # Return as a string to save in the database (always 60 chars long)
    return hashed_password.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(
        plain_password.encode("utf-8"), hashed_password.encode("utf-8")
    )


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc).replace(microsecond=0) + timedelta(
        minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(
        days=settings.REFRESH_TOKEN_EXPIRE_DAYS
    )
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


# ── Token Decoding (used by both refresh flow and get_current_user) ──


def decode_token(token: str) -> dict:
    """
    Raises jwt.ExpiredSignatureError or jwt.InvalidTokenError on failure —
    callers (dependencies.py, auth router) catch these and convert to 401.
    """
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])


# Refresh Token Hashing (for DB storage)
def hash_token(token: str) -> str:
    """
    Not bcrypt — this doesn't need to be slow, it needs to be a fast, deterministic
    lookup key. The token itself is already high-entropy (a signed JWT), so it
    doesn't need bcrypt's brute-force resistance the way a human password does.
    """
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def get_current_user(
    # token: str = Depends(oauth2_scheme),
    credentials=Depends(http_bearer),
    db: Session = Depends(get_db),
) -> dict:
    token = credentials.credentials
    try:
        payload = decode_token(token)
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        raise HTTPException(401, "Invalid or expired token")

    if payload.get("type") != "access":
        raise HTTPException(401, "Invalid token type")

    role = payload.get("role")
    user_id = payload.get("id")

    if role == "Admin":
        user = db.scalar(select(Recruiter).where(Recruiter.id == user_id))
    else:
        user = db.scalar(select(Candidate).where(Candidate.id == user_id))

    if not user:
        raise HTTPException(401, "User not found")

    return {"id": user_id, "role": role, "email": user.email, "name": user.name}


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
