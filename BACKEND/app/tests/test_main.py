import asyncio
import importlib
import json
from types import SimpleNamespace
from unittest.mock import MagicMock

from fastapi.exceptions import RequestValidationError

from core import database


def test_main_registers_backend_routers(monkeypatch):
    init_db = MagicMock()
    monkeypatch.setattr(database, "init_db", init_db)

    main = importlib.import_module("main")

    init_db.assert_called_once_with()
    paths = main.app.openapi()["paths"]
    assert "post" in paths["/auth/login"]
    assert "post" in paths["/jobs"]
    assert "get" in paths["/candidates"]
    assert "patch" in paths["/applications/{application_id}/reject"]
    assert "delete" in paths["/recruiters/{recruiter_id}"]
    assert "patch" in paths["/interviews/{interview_id}/feedback"]


def test_validation_errors_use_detail_format_without_echoing_input(monkeypatch):
    monkeypatch.setattr(database, "init_db", MagicMock())
    main = importlib.import_module("main")
    error = RequestValidationError(
        [
            {
                "loc": ("body", "password"),
                "msg": "Field required",
                "type": "missing",
                "input": "sensitive-value",
            }
        ]
    )

    response = asyncio.run(main.handle_request_validation_error(None, error))

    assert response.status_code == 422
    assert json.loads(response.body) == {
        "detail": [
            {
                "loc": ["body", "password"],
                "msg": "Field required",
                "type": "missing",
            }
        ]
    }
    assert b"sensitive-value" not in response.body


def test_unexpected_errors_return_safe_500_and_are_logged(caplog, monkeypatch):
    monkeypatch.setattr(database, "init_db", MagicMock())
    main = importlib.import_module("main")
    request = SimpleNamespace(
        method="GET",
        url=SimpleNamespace(path="/jobs"),
    )
    error = RuntimeError("internal detail")

    async def fail_request(_request):
        raise error

    response = asyncio.run(main.handle_unexpected_error(request, fail_request))

    assert response.status_code == 500
    assert json.loads(response.body) == {
        "detail": "An unexpected error occurred. Please try again later."
    }
    assert "internal detail" in caplog.text
