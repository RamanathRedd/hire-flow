from unittest.mock import MagicMock

import pytest

from core import database


def test_init_db_creates_registered_tables(monkeypatch):
    create_all = MagicMock()
    monkeypatch.setattr(database.Base.metadata, "create_all", create_all)

    database.init_db()

    create_all.assert_called_once_with(bind=database.engine)


def test_get_db_closes_session_after_use(monkeypatch):
    session = MagicMock()
    monkeypatch.setattr(database, "SessionLocal", lambda: session)
    dependency = database.get_db()

    assert next(dependency) is session
    with pytest.raises(StopIteration):
        next(dependency)
    session.close.assert_called_once_with()
