from unittest.mock import MagicMock

import pytest

from core.exceptions import (
    ActiveJobExistsError,
    PhoneAlreadyExistsError,
    RecruiterAlreadyExistsError,
    RecruiterNotExistsError,
    UnauthorizedError,
)
from domains.recruiters import service
from domains.recruiters.model import Recruiter
from domains.recruiters.schemas import RecruiterCreate, RecruiterUpdate


@pytest.fixture
def admin():
    return {"id": 3, "role": "Admin"}


@pytest.fixture
def recruiter_data():
    return RecruiterCreate(
        name="Riley Recruiter",
        email="riley@example.com",
        phone="1234567890",
        department="Engineering",
        password="password123",
    )


def test_create_recruiter_hashes_password_and_saves(db, recruiter_data, monkeypatch):
    monkeypatch.setattr(service, "hash_password", lambda password: "hashed-password")
    db.scalar.return_value = None

    service.create_recruiter(db, recruiter_data)

    recruiter = db.add.call_args.args[0]
    assert isinstance(recruiter, Recruiter)
    assert recruiter.password == "hashed-password"
    db.commit.assert_called_once_with()


def test_create_recruiter_rejects_duplicate(db, recruiter_data):
    db.scalar.return_value = MagicMock()

    with pytest.raises(RecruiterAlreadyExistsError):
        service.create_recruiter(db, recruiter_data)

    db.add.assert_not_called()
    db.commit.assert_not_called()


def test_get_recruiters_requires_admin(db):
    with pytest.raises(UnauthorizedError):
        service.get_recruiters(db, None, {"id": 3, "role": "User"})

    db.scalars.assert_not_called()


def test_get_recruiters_returns_department_results(db, admin):
    recruiters = [MagicMock()]
    db.scalars.return_value.all.return_value = recruiters

    result = service.get_recruiters(db, "Engineering", admin)

    assert result == recruiters


def test_get_recruiters_without_department_returns_all(db, admin):
    recruiters = [MagicMock(), MagicMock()]
    db.scalars.return_value.all.return_value = recruiters

    assert service.get_recruiters(db, None, admin) == recruiters


def test_get_recruiter_details_returns_current_admin(db, admin):
    recruiter = MagicMock()
    db.scalar.return_value = recruiter

    assert service.get_recruiter_details(db, admin) is recruiter


def test_get_recruiter_details_requires_admin(db):
    with pytest.raises(UnauthorizedError):
        service.get_recruiter_details(db, {"id": 3, "role": "User"})

    db.scalar.assert_not_called()


def test_update_recruiter_changes_fields(db, admin):
    recruiter = MagicMock(phone="1111111111")
    db.scalar.return_value = recruiter

    service.update_recruiter(
        db, 3, RecruiterUpdate(name="Updated Recruiter"), admin
    )

    assert recruiter.name == "Updated Recruiter"
    db.commit.assert_called_once_with()


def test_update_recruiter_skips_phone_duplicate_check_when_unchanged(db, admin):
    recruiter = MagicMock(phone="1111111111")
    db.scalar.return_value = recruiter

    service.update_recruiter(
        db, 3, RecruiterUpdate(phone="1111111111"), admin
    )

    db.scalar.assert_called_once()
    db.commit.assert_called_once_with()


def test_update_recruiter_allows_new_phone_when_not_taken(db, admin):
    recruiter = MagicMock(phone="1111111111")
    db.scalar.side_effect = [recruiter, None]

    service.update_recruiter(
        db, 3, RecruiterUpdate(phone="2222222222"), admin
    )

    assert recruiter.phone == "2222222222"
    assert db.scalar.call_count == 2
    db.commit.assert_called_once_with()


def test_update_recruiter_rejects_duplicate_phone(db, admin):
    recruiter = MagicMock(phone="1111111111")
    db.scalar.side_effect = [recruiter, MagicMock()]

    with pytest.raises(PhoneAlreadyExistsError):
        service.update_recruiter(
            db, 3, RecruiterUpdate(phone="2222222222"), admin
        )

    db.commit.assert_not_called()


def test_update_recruiter_rejects_missing_recruiter(db, admin):
    db.scalar.return_value = None

    with pytest.raises(RecruiterNotExistsError):
        service.update_recruiter(db, 3, RecruiterUpdate(name="Updated Recruiter"), admin)


def test_update_recruiter_requires_admin(db):
    with pytest.raises(UnauthorizedError):
        service.update_recruiter(
            db, 3, RecruiterUpdate(name="Updated Recruiter"), {"id": 3, "role": "User"}
        )

    db.scalar.assert_not_called()


def test_delete_recruiter_rejects_open_job(db, admin):
    db.scalar.return_value = MagicMock()

    with pytest.raises(ActiveJobExistsError):
        service.delete_recruiter(db, 3, admin)

    db.delete.assert_not_called()


def test_delete_recruiter_removes_recruiter_without_open_jobs(db, admin):
    recruiter = MagicMock()
    db.scalar.side_effect = [None, recruiter]

    service.delete_recruiter(db, 3, admin)

    db.delete.assert_called_once_with(recruiter)
    db.commit.assert_called_once_with()


def test_delete_recruiter_rejects_missing_recruiter(db, admin):
    db.scalar.side_effect = [None, None]

    with pytest.raises(RecruiterNotExistsError):
        service.delete_recruiter(db, 3, admin)

    db.delete.assert_not_called()


def test_delete_recruiter_rejects_non_admin(db):
    with pytest.raises(UnauthorizedError):
        service.delete_recruiter(db, 3, {"id": 3, "role": "User"})

    db.scalar.assert_not_called()
