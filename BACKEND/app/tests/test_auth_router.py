from unittest.mock import MagicMock

import pytest
from fastapi import HTTPException
from fastapi.security import OAuth2PasswordRequestForm

from core.exceptions import (
    CandidateAlreadyExistsError,
    InvalidCredentials,
    InvalidOrExpiredTokenError,
    OldPasswordMismatchError,
    PasswordMismatchError,
    RecruiterAlreadyExistsError,
)
from domains.auth import router
from domains.auth.schemas import PasswordUpdate


def test_register_returns_service_result(monkeypatch):
    result = {"message": "Candidate created successfully"}
    monkeypatch.setattr(router.service, "register", lambda *args: result)

    assert router.register(False, {"name": "Casey Candidate"}, MagicMock()) == result


@pytest.mark.parametrize(
    "exception", [RecruiterAlreadyExistsError, CandidateAlreadyExistsError]
)
def test_register_translates_duplicate_account(monkeypatch, exception):
    def reject(*args):
        raise exception()

    monkeypatch.setattr(router.service, "register", reject)

    with pytest.raises(HTTPException) as error:
        router.register(False, {}, MagicMock())

    assert error.value.status_code == 400


def test_login_returns_service_result(monkeypatch):
    result = {"access_token": "token", "token_type": "bearer"}
    monkeypatch.setattr(router.service, "login", lambda *args: result)
    form = OAuth2PasswordRequestForm(
        username="casey@example.com", password="password", scope=""
    )

    assert router.login(False, form, MagicMock()) == result


def test_login_translates_invalid_credentials(monkeypatch):
    def reject(*args):
        raise InvalidCredentials

    monkeypatch.setattr(router.service, "login", reject)
    form = OAuth2PasswordRequestForm(
        username="casey@example.com", password="wrong", scope=""
    )

    with pytest.raises(HTTPException) as error:
        router.login(False, form, MagicMock())

    assert error.value.status_code == 401


@pytest.mark.parametrize(
    "route_error",
    [InvalidOrExpiredTokenError, InvalidCredentials],
)
def test_get_current_user_translates_authentication_errors(monkeypatch, route_error):
    def reject(*args):
        raise route_error

    monkeypatch.setattr(router.service, "get_current_user", reject)

    with pytest.raises(HTTPException) as error:
        import asyncio

        asyncio.run(router.get_current_user("invalid-token", MagicMock()))

    assert error.value.status_code == 401


def test_get_current_user_returns_authenticated_profile(monkeypatch):
    profile = {"id": 7, "name": "Casey Candidate"}
    monkeypatch.setattr(router.service, "get_current_user", lambda *args: profile)

    import asyncio

    assert asyncio.run(router.get_current_user("valid-token", MagicMock())) == profile


def test_update_password_returns_success(monkeypatch):
    monkeypatch.setattr(router.service, "update_password", lambda *args: None)
    password_data = PasswordUpdate(
        old_password="old-password",
        new_password="new-password",
        confirm_password="new-password",
    )

    assert router.update_password(
        password_data, {"id": 7, "role": "User"}, MagicMock()
    ) == {"message": "Password updated successfully"}


@pytest.mark.parametrize(
    ("exception", "status_code"),
    [(PasswordMismatchError, 400), (OldPasswordMismatchError, 400)],
)
def test_update_password_translates_errors(monkeypatch, exception, status_code):
    def reject(*args):
        raise exception

    monkeypatch.setattr(router.service, "update_password", reject)
    password_data = PasswordUpdate(
        old_password="old-password",
        new_password="new-password",
        confirm_password="new-password",
    )

    with pytest.raises(HTTPException) as error:
        router.update_password(
            password_data, {"id": 7, "role": "User"}, MagicMock()
        )

    assert error.value.status_code == status_code
