from datetime import datetime, timezone
from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest

from core.exceptions import (
    CandidateAlreadyExistsError,
    CandidateNotExistsError,
    LinkedInAlreadyExistsError,
    MinGreaterThanMax,
    PhoneAlreadyExistsError,
    ResumeAlreadyExistsError,
    UnauthorizedError,
)
from domains.candidates import service
from domains.candidates.model import Candidate
from domains.candidates.schemas import CandidateCreate, CandidateFilters, CandidateUpdate


@pytest.fixture
def candidate_data():
    return CandidateCreate(
        name="Casey Candidate",
        password="password123",
        email="casey@example.com",
        phone="1234567890",
        resume_url="https://example.com/resume",
        linkedin_url="https://linkedin.com/in/casey",
        experience_years=5,
        skills=["Python"],
        current_title="Engineer",
        current_company="Example",
    )


def test_create_candidate_hashes_password_and_saves(db, candidate_data, monkeypatch):
    monkeypatch.setattr(service, "hash_password", lambda password: "hashed-password")
    db.scalar.return_value = None

    service.create_candidate(db, candidate_data)

    added_candidate = db.add.call_args.args[0]
    assert isinstance(added_candidate, Candidate)
    assert added_candidate.password == "hashed-password"
    assert added_candidate.email == "casey@example.com"
    db.commit.assert_called_once_with()


def test_create_candidate_rejects_duplicate(db, candidate_data):
    db.scalar.return_value = MagicMock()

    with pytest.raises(CandidateAlreadyExistsError):
        service.create_candidate(db, candidate_data)

    db.add.assert_not_called()
    db.commit.assert_not_called()


def test_get_candidates_requires_admin(db):
    with pytest.raises(UnauthorizedError):
        service.get_candidates(db, CandidateFilters(), {"id": 2, "role": "User"})

    db.scalars.assert_not_called()


def test_get_candidates_rejects_minimum_above_maximum(db):
    filters = CandidateFilters(min_experience=6, max_experience=3)

    with pytest.raises(MinGreaterThanMax):
        service.get_candidates(db, filters, {"id": 2, "role": "Admin"})


def test_get_candidates_returns_database_results(db):
    candidates = [MagicMock(), MagicMock()]
    db.scalars.return_value.all.return_value = candidates

    result = service.get_candidates(
        db,
        CandidateFilters(min_experience=2, max_experience=8, skills="Python, SQL"),
        {"id": 2, "role": "Admin"},
    )

    assert result == candidates
    db.scalars.assert_called_once()


@pytest.mark.parametrize(
    "filters",
    [
        CandidateFilters(min_experience=2),
        CandidateFilters(max_experience=8),
        CandidateFilters(skills=""),
        CandidateFilters(skills=" Python, ,SQL "),
    ],
)
def test_get_candidates_accepts_independent_optional_filters(db, filters):
    db.scalars.return_value.all.return_value = []

    assert service.get_candidates(db, filters, {"id": 2, "role": "Admin"}) == []


def test_search_candidates_requires_admin(db):
    with pytest.raises(UnauthorizedError):
        service.search_candidates(db, "engineer", {"id": 2, "role": "User"})

    db.scalars.assert_not_called()


def test_search_candidates_returns_database_results(db):
    candidates = [MagicMock()]
    db.scalars.return_value.all.return_value = candidates

    result = service.search_candidates(db, "engineer", {"id": 2, "role": "Admin"})

    assert result == candidates


def test_get_candidate_details_omits_password_and_returns_empty_summary(db):
    candidate = Candidate(
        id=7,
        name="Casey Candidate",
        password="secret-hash",
        email="casey@example.com",
        phone="1234567890",
        resume_url="https://example.com/resume",
        experience_years=5,
        skills=["Python"],
        current_title="Engineer",
        current_company="Example",
    )
    db.scalar.return_value = candidate
    db.execute.return_value.all.return_value = []

    result = service.get_candidate_details(db, {"id": 7, "role": "User"})

    assert "password" not in result
    assert result["email"] == "casey@example.com"
    assert result["summary"] == {
        "total_applications": 0,
        "active_applications": 0,
        "rejected_applications": 0,
        "hired_applications": 0,
    }
    assert result["applications"] == []


def test_get_candidate_details_counts_active_rejected_and_hired_applications(db):
    candidate = Candidate(
        id=7,
        name="Casey Candidate",
        password="secret-hash",
        email="casey@example.com",
        phone="1234567890",
        resume_url="https://example.com/resume",
        experience_years=5,
        skills=["Python"],
        current_title="Engineer",
        current_company="Example",
    )
    db.scalar.return_value = candidate
    applied_at = datetime.now(timezone.utc)
    applications = []
    for application_id, stage in enumerate(
        ["Screened", "Rejected", "Hired"], start=1
    ):
        application = SimpleNamespace(
            id=application_id,
            job_id=9,
            stage=stage,
            applied_at=applied_at,
            stage_updated_at=applied_at,
            cover_note=None,
            rejection_reason="Position filled" if stage == "Rejected" else None,
        )
        job = SimpleNamespace(
            id=9,
            title="Backend Engineer",
            department="Engineering",
            location="Remote",
            status="Open",
        )
        applications.append((application, job))
    db.execute.return_value.all.return_value = applications

    result = service.get_candidate_details(db, {"id": 7, "role": "User"})

    assert result["summary"] == {
        "total_applications": 3,
        "active_applications": 1,
        "rejected_applications": 1,
        "hired_applications": 1,
    }
    assert result["applications"][0]["applied_at"] == applied_at.isoformat()


def test_get_candidate_details_rejects_missing_candidate(db):
    db.scalar.return_value = None

    with pytest.raises(CandidateNotExistsError):
        service.get_candidate_details(db, {"id": 7, "role": "User"})


def test_get_candidate_details_rejects_empty_role(db):
    with pytest.raises(UnauthorizedError):
        service.get_candidate_details(db, {"id": 7, "role": ""})

    db.scalar.assert_not_called()


def test_update_candidate_changes_only_set_fields(db):
    candidate = MagicMock(phone="1111111111", resume_url="https://example.com/old")
    db.scalar.return_value = candidate
    update = CandidateUpdate(name="Updated Candidate")

    service.update_candidate(db, 2, update, {"id": 2, "role": "User"})

    assert candidate.name == "Updated Candidate"
    db.commit.assert_called_once_with()


def test_update_candidate_with_empty_patch_is_noop(db):
    db.scalar.return_value = MagicMock()

    service.update_candidate(
        db, 2, CandidateUpdate(), {"id": 2, "role": "User"}
    )

    db.commit.assert_not_called()


@pytest.mark.parametrize(
    ("field", "exception"),
    [
        ("phone", PhoneAlreadyExistsError),
        ("resume_url", ResumeAlreadyExistsError),
        ("linkedin_url", LinkedInAlreadyExistsError),
    ],
)
def test_update_candidate_rejects_duplicate_fields(db, field, exception):
    candidate = MagicMock(
        phone="1111111111",
        resume_url="https://example.com/old",
        linkedin_url="https://linkedin.com/in/old",
    )
    db.scalar.side_effect = [candidate, MagicMock()]
    update = CandidateUpdate(**{field: {
        "phone": "2222222222",
        "resume_url": "https://example.com/new",
        "linkedin_url": "https://linkedin.com/in/new",
    }[field]})

    with pytest.raises(exception):
        service.update_candidate(db, 2, update, {"id": 2, "role": "User"})

    db.commit.assert_not_called()


def test_update_candidate_rejects_missing_candidate(db):
    db.scalar.return_value = None

    with pytest.raises(CandidateNotExistsError):
        service.update_candidate(
            db, 2, CandidateUpdate(name="Updated Candidate"), {"id": 2, "role": "User"}
        )


def test_update_candidate_rejects_empty_role(db):
    with pytest.raises(UnauthorizedError):
        service.update_candidate(
            db, 2, CandidateUpdate(name="Updated Candidate"), {"id": 2, "role": ""}
        )

    db.scalar.assert_not_called()
