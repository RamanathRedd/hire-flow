from unittest.mock import MagicMock

import pytest
from fastapi import HTTPException

from core.exceptions import (
    CandidateNotExistsError,
    LinkedInAlreadyExistsError,
    MinGreaterThanMax,
    PhoneAlreadyExistsError,
    ResumeAlreadyExistsError,
    UnauthorizedError,
)
from domains.candidates import router
from domains.candidates.schemas import CandidateFilters, CandidateUpdate


ADMIN = {"id": 3, "role": "Admin"}
USER = {"id": 7, "role": "User"}


def test_get_candidates_returns_wrapped_result(monkeypatch):
    candidates = [MagicMock()]
    monkeypatch.setattr(router.service, "get_candidates", lambda *args: candidates)

    assert router.get_candidates(ADMIN, CandidateFilters(), MagicMock()) == {
        "data": candidates
    }


@pytest.mark.parametrize(
    ("exception", "status_code"),
    [(UnauthorizedError, 401), (MinGreaterThanMax, 400)],
)
def test_get_candidates_translates_errors(monkeypatch, exception, status_code):
    def reject(*args):
        raise exception

    monkeypatch.setattr(router.service, "get_candidates", reject)

    with pytest.raises(HTTPException) as error:
        router.get_candidates(ADMIN, CandidateFilters(), MagicMock())

    assert error.value.status_code == status_code


def test_search_candidates_returns_wrapped_result(monkeypatch):
    candidates = [MagicMock()]
    monkeypatch.setattr(router.service, "search_candidates", lambda *args: candidates)

    assert router.search_candidates(ADMIN, "python", MagicMock()) == {
        "data": candidates
    }


def test_search_candidates_translates_unauthorized(monkeypatch):
    def reject(*args):
        raise UnauthorizedError

    monkeypatch.setattr(router.service, "search_candidates", reject)

    with pytest.raises(HTTPException) as error:
        router.search_candidates(USER, "python", MagicMock())

    assert error.value.status_code == 401


def test_get_candidate_details_returns_profile(monkeypatch):
    candidate = {"id": 7, "name": "Casey Candidate"}
    monkeypatch.setattr(router.service, "get_candidate_details", lambda *args: candidate)

    assert router.get_candidate_details(USER, MagicMock()) == candidate


@pytest.mark.parametrize(
    ("exception", "status_code"),
    [(UnauthorizedError, 401), (CandidateNotExistsError, 404)],
)
def test_get_candidate_details_translates_errors(monkeypatch, exception, status_code):
    def reject(*args):
        raise exception

    monkeypatch.setattr(router.service, "get_candidate_details", reject)

    with pytest.raises(HTTPException) as error:
        router.get_candidate_details(USER, MagicMock())

    assert error.value.status_code == status_code


def test_update_candidate_returns_success(monkeypatch):
    monkeypatch.setattr(router.service, "update_candidate", lambda *args: None)

    assert router.update_candidate(
        7, CandidateUpdate(name="Updated Candidate"), USER, MagicMock()
    ) == {"message": "Candidate updated successfully"}


@pytest.mark.parametrize(
    ("exception", "status_code"),
    [
        (UnauthorizedError, 401),
        (CandidateNotExistsError, 404),
        (PhoneAlreadyExistsError, 400),
        (ResumeAlreadyExistsError, 400),
        (LinkedInAlreadyExistsError, 400),
    ],
)
def test_update_candidate_translates_errors(monkeypatch, exception, status_code):
    def reject(*args):
        raise exception

    monkeypatch.setattr(router.service, "update_candidate", reject)

    with pytest.raises(HTTPException) as error:
        router.update_candidate(7, CandidateUpdate(), USER, MagicMock())

    assert error.value.status_code == status_code
