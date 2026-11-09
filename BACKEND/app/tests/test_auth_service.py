from unittest.mock import MagicMock

import pytest

from core.config import settings
from core.exceptions import (
    InvalidCredentials,
    InvalidOrExpiredTokenError,
    OldPasswordMismatchError,
    PasswordMismatchError,
)
from domains.auth import service
from domains.auth.schemas import PasswordUpdate


def test_candidate_login_returns_bearer_token(monkeypatch):
    db = MagicMock()
    candidate = MagicMock()
    candidate.id = 7
    candidate.name = "Candidate Name"
    candidate.password = "hashed-password"
    db.scalar.return_value = candidate
    create_token = MagicMock(return_value="signed-token")
    verify_password = MagicMock(return_value=True)
    monkeypatch.setattr(service, "create_access_token", create_token)
    monkeypatch.setattr(service, "verify_password", verify_password)

    response = service.login(db, False, "candidate@example.com", "password")

    assert response == {
        "access_token": "signed-token",
        "token_type": "bearer",
        "role": "User",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    }
    verify_password.assert_called_once_with("password", "hashed-password")
    create_token.assert_called_once_with(
        {"sub": "Candidate Name", "id": 7, "role": "User"}
    )


def test_admin_login_returns_admin_role_and_token(monkeypatch):
    db = MagicMock()
    recruiter = MagicMock()
    recruiter.id = 3
    recruiter.name = "Riley Recruiter"
    recruiter.password = "hashed-password"
    db.scalar.return_value = recruiter
    monkeypatch.setattr(service, "verify_password", lambda *args: True)
    create_token = MagicMock(return_value="admin-token")
    monkeypatch.setattr(service, "create_access_token", create_token)

    response = service.login(db, True, "riley@example.com", "password")

    assert response["access_token"] == "admin-token"
    assert response["role"] == "Admin"
    create_token.assert_called_once_with(
        {"sub": "Riley Recruiter", "id": 3, "role": "Admin"}
    )


def test_login_rejects_incorrect_password(monkeypatch):
    db = MagicMock()
    db.scalar.return_value = MagicMock(password="hashed-password")
    verify_password = MagicMock(return_value=False)
    monkeypatch.setattr(service, "verify_password", verify_password)

    with pytest.raises(InvalidCredentials):
        service.login(db, False, "candidate@example.com", "wrong-password")

    verify_password.assert_called_once_with("wrong-password", "hashed-password")


def test_login_rejects_unknown_candidate():
    db = MagicMock()
    db.scalar.return_value = None

    with pytest.raises(InvalidCredentials):
        service.login(db, False, "unknown@example.com", "password")


def test_login_rejects_unknown_admin():
    db = MagicMock()
    db.scalar.return_value = None

    with pytest.raises(InvalidCredentials):
        service.login(db, True, "unknown@example.com", "password")


def test_password_update_rejects_mismatched_confirmation():
    db = MagicMock()
    password_data = PasswordUpdate(
        old_password="old-password",
        new_password="new-password",
        confirm_password="different-password",
    )

    with pytest.raises(PasswordMismatchError):
        service.update_password(db, "User", 7, password_data)

    db.scalar.assert_not_called()
    db.commit.assert_not_called()


def test_password_update_hashes_new_password_and_commits(monkeypatch):
    db = MagicMock()
    candidate = MagicMock(password="old-hash")
    db.scalar.return_value = candidate
    verify_password = MagicMock(return_value=True)
    hash_password = MagicMock(return_value="new-hash")
    monkeypatch.setattr(service, "verify_password", verify_password)
    monkeypatch.setattr(service, "hash_password", hash_password)
    password_data = PasswordUpdate(
        old_password="old-password",
        new_password="new-password",
        confirm_password="new-password",
    )

    service.update_password(db, "User", 7, password_data)

    verify_password.assert_called_once_with("old-password", "old-hash")
    hash_password.assert_called_once_with("new-password")
    assert candidate.password == "new-hash"
    db.commit.assert_called_once_with()


def test_admin_password_update_selects_recruiter_record(monkeypatch):
    db = MagicMock()
    recruiter = MagicMock(password="old-hash")
    db.scalar.return_value = recruiter
    monkeypatch.setattr(service, "verify_password", lambda *args: True)
    monkeypatch.setattr(service, "hash_password", lambda password: "new-hash")
    password_data = PasswordUpdate(
        old_password="old-password",
        new_password="new-password",
        confirm_password="new-password",
    )

    service.update_password(db, "Admin", 3, password_data)

    assert recruiter.password == "new-hash"
    assert "recruiters" in str(db.scalar.call_args.args[0])
    db.commit.assert_called_once_with()


def test_register_recruiter_delegates_to_recruiter_service(monkeypatch):
    create_recruiter = MagicMock()
    monkeypatch.setattr(service.recruiter_service, "create_recruiter", create_recruiter)
    data = {
        "name": "Riley Recruiter",
        "email": "riley@example.com",
        "phone": "1234567890",
        "department": "Engineering",
        "password": "password123",
    }

    result = service.register(MagicMock(), True, data)

    assert result == {"message": "Recruiter created successfully"}
    create_recruiter.assert_called_once()
    assert create_recruiter.call_args.args[1].email == "riley@example.com"


def test_register_candidate_delegates_to_candidate_service(monkeypatch):
    create_candidate = MagicMock()
    monkeypatch.setattr(service.candidate_service, "create_candidate", create_candidate)
    data = {
        "name": "Casey Candidate",
        "email": "casey@example.com",
        "phone": "1234567890",
        "resume_url": "https://example.com/resume",
        "experience_years": 2,
        "current_title": "Engineer",
        "current_company": "Example",
        "password": "password123",
    }

    result = service.register(MagicMock(), False, data)

    assert result == {"message": "Candidate created successfully"}
    create_candidate.assert_called_once()
    assert create_candidate.call_args.args[1].email == "casey@example.com"


def test_get_current_user_rejects_invalid_token(monkeypatch):
    monkeypatch.setattr(service, "verify_access_token", lambda token: None)

    with pytest.raises(InvalidOrExpiredTokenError):
        service.get_current_user(MagicMock(), "invalid")


@pytest.mark.parametrize("user_id", ["invalid", None])
def test_get_current_user_rejects_malformed_user_id(monkeypatch, user_id):
    monkeypatch.setattr(
        service,
        "verify_access_token",
        lambda token: {"id": user_id, "role": "User"},
    )

    with pytest.raises(InvalidOrExpiredTokenError):
        service.get_current_user(MagicMock(), "token")


def test_get_current_user_loads_candidate(monkeypatch):
    candidate = MagicMock()
    db = MagicMock()
    monkeypatch.setattr(
        service, "verify_access_token", lambda token: {"id": "7", "role": "User"}
    )
    get_candidate_details = MagicMock(return_value=candidate)
    monkeypatch.setattr(service, "get_candidate_details", get_candidate_details)

    result = service.get_current_user(db, "valid-token")

    assert result is candidate
    get_candidate_details.assert_called_once_with(
        db, {"id": 7, "role": "User"}
    )


def test_get_current_user_loads_recruiter(monkeypatch):
    recruiter = MagicMock()
    db = MagicMock()
    monkeypatch.setattr(
        service, "verify_access_token", lambda token: {"id": "3", "role": "Admin"}
    )
    get_recruiter_details = MagicMock(return_value=recruiter)
    monkeypatch.setattr(service, "get_recruiter_details", get_recruiter_details)

    result = service.get_current_user(db, "valid-token")

    assert result is recruiter
    get_recruiter_details.assert_called_once_with(
        db, {"id": 3, "role": "Admin"}
    )


def test_get_current_user_rejects_missing_account(monkeypatch):
    monkeypatch.setattr(
        service, "verify_access_token", lambda token: {"id": "7", "role": "User"}
    )
    monkeypatch.setattr(service, "get_candidate_details", lambda *args: None)

    with pytest.raises(InvalidCredentials):
        service.get_current_user(MagicMock(), "valid-token")


def test_password_update_rejects_incorrect_old_password(monkeypatch):
    db = MagicMock()
    db.scalar.return_value = MagicMock(password="old-hash")
    monkeypatch.setattr(service, "verify_password", lambda *args: False)
    password_data = PasswordUpdate(
        old_password="wrong-password",
        new_password="new-password",
        confirm_password="new-password",
    )

    with pytest.raises(OldPasswordMismatchError):
        service.update_password(db, "User", 7, password_data)

    db.commit.assert_not_called()
