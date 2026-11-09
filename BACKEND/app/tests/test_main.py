import importlib
from unittest.mock import MagicMock

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
