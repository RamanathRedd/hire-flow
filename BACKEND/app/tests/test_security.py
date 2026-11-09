from datetime import timedelta

import pytest
from fastapi import HTTPException

from core.security import (
    create_access_token,
    get_authenticated_user,
    hash_password,
    verify_access_token,
    verify_password,
)


def test_password_hash_verifies_only_matching_password():
    hashed_password = hash_password("correct horse battery staple")

    assert hashed_password != "correct horse battery staple"
    assert verify_password("correct horse battery staple", hashed_password)
    assert not verify_password("incorrect password", hashed_password)


def test_access_token_round_trips_claims():
    claims = {"sub": "candidate@example.com", "id": 12, "role": "User"}

    token = create_access_token(claims)

    assert verify_access_token(token)["id"] == 12
    assert verify_access_token(token)["role"] == "User"


def test_expired_access_token_is_rejected():
    token = create_access_token(
        {"sub": "candidate@example.com"}, timedelta(seconds=-1)
    )

    assert verify_access_token(token) is None


def test_malformed_access_token_is_rejected():
    assert verify_access_token("not-a-jwt") is None


def test_get_authenticated_user_returns_id_and_role(monkeypatch):
    monkeypatch.setattr(
        "core.security.verify_access_token",
        lambda token: {"id": "12", "role": "User"},
    )

    assert get_authenticated_user("token") == {"id": 12, "role": "User"}


@pytest.mark.parametrize(
    "payload",
    [None, {"id": "invalid", "role": "User"}, {"role": "User"}, {"id": 12}],
)
def test_get_authenticated_user_handles_invalid_or_incomplete_claims(
    monkeypatch, payload
):
    monkeypatch.setattr("core.security.verify_access_token", lambda token: payload)

    if payload is None:
        with pytest.raises(HTTPException) as error:
            get_authenticated_user("token")
        assert error.value.status_code == 401
    else:
        assert get_authenticated_user("token") is None
