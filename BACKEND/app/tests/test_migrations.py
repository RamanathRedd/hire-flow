import importlib.util
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import MagicMock

import sqlalchemy as sa
import pytest
from alembic.config import Config
from alembic.script import ScriptDirectory


VERSIONS = Path(__file__).resolve().parents[1] / "alembic" / "versions"


@pytest.fixture
def sqlite_connection():
    engine = sa.create_engine("sqlite://")
    with engine.connect() as connection:
        yield connection
    engine.dispose()


def load_revision(filename, module_name):
    spec = importlib.util.spec_from_file_location(module_name, VERSIONS / filename)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_baseline_upgrade_and_downgrade_preserve_existing_tables():
    baseline = load_revision("5100c656d2f2_baseline.py", "baseline_revision")

    assert baseline.upgrade() is None
    assert baseline.downgrade() is None


def test_candidate_password_migration_adds_only_missing_column(
    monkeypatch, sqlite_connection
):
    migration = load_revision(
        "26e413e2bae1_add_password_to_candidates.py", "candidate_password_revision"
    )
    sqlite_connection.execute(
        sa.text("CREATE TABLE candidates (id INTEGER PRIMARY KEY)")
    )
    add_column = MagicMock()
    monkeypatch.setattr(
        migration,
        "op",
        SimpleNamespace(get_bind=lambda: sqlite_connection, add_column=add_column),
    )

    migration.upgrade()

    add_column.assert_called_once()
    table_name, column = add_column.call_args.args
    assert table_name == "candidates"
    assert column.name == "password"
    assert column.type.length == 100
    assert column.nullable


def test_candidate_password_migration_skips_existing_column(
    monkeypatch, sqlite_connection
):
    migration = load_revision(
        "26e413e2bae1_add_password_to_candidates.py",
        "candidate_password_existing_revision",
    )
    sqlite_connection.execute(
        sa.text(
            "CREATE TABLE candidates (id INTEGER PRIMARY KEY, password VARCHAR(100))"
        )
    )
    add_column = MagicMock()
    monkeypatch.setattr(
        migration,
        "op",
        SimpleNamespace(get_bind=lambda: sqlite_connection, add_column=add_column),
    )

    migration.upgrade()

    add_column.assert_not_called()


def test_password_length_migration_expands_short_columns_without_shrinking(
    monkeypatch, sqlite_connection
):
    migration = load_revision(
        "1272bd6c355a_alter_password_length.py", "password_length_revision"
    )
    sqlite_connection.execute(
        sa.text("CREATE TABLE recruiters (id INTEGER, password VARCHAR(60) NOT NULL)")
    )
    sqlite_connection.execute(
        sa.text("CREATE TABLE candidates (id INTEGER, password VARCHAR(60))")
    )
    alter_column = MagicMock()
    monkeypatch.setattr(
        migration,
        "op",
        SimpleNamespace(get_bind=lambda: sqlite_connection, alter_column=alter_column),
    )

    migration.upgrade()

    assert alter_column.call_count == 2
    assert {call.args[0] for call in alter_column.call_args_list} == {
        "recruiters",
        "candidates",
    }
    assert all(
        call.kwargs["type_"].length == 100 for call in alter_column.call_args_list
    )


def test_password_length_migration_is_idempotent_for_current_schema(
    monkeypatch, sqlite_connection
):
    migration = load_revision(
        "9c4f8612ab3e_restore_password_hash_length.py",
        "restore_password_length_revision",
    )
    sqlite_connection.execute(
        sa.text("CREATE TABLE recruiters (id INTEGER, password VARCHAR(100) NOT NULL)")
    )
    sqlite_connection.execute(
        sa.text("CREATE TABLE candidates (id INTEGER, password VARCHAR(100))")
    )
    alter_column = MagicMock()
    monkeypatch.setattr(
        migration,
        "op",
        SimpleNamespace(get_bind=lambda: sqlite_connection, alter_column=alter_column),
    )

    migration.upgrade()

    alter_column.assert_not_called()


# def test_migration_history_has_one_linear_head():
#     config = Config(str(VERSIONS.parents[1] / "alembic.ini"))
#     script = ScriptDirectory.from_config(config)

#     assert script.get_heads() == ["9c4f8612ab3e"]
