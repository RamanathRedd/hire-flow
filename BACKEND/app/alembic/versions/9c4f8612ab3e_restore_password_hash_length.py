"""restore password hash column capacity

Revision ID: 9c4f8612ab3e
Revises: 1272bd6c355a
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "9c4f8612ab3e"
down_revision: Union[str, Sequence[str], None] = "1272bd6c355a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    _ensure_password_length("recruiters")
    _ensure_password_length("candidates")


def downgrade() -> None:
    """Keep password hashes at a size that can store current hash values."""


def _ensure_password_length(table_name: str) -> None:
    bind = op.get_bind()
    password_column = next(
        (
            column
            for column in sa.inspect(bind).get_columns(table_name)
            if column["name"] == "password"
        ),
        None,
    )
    if password_column is None:
        raise RuntimeError(f"{table_name}.password does not exist")

    existing_type = password_column["type"]
    if getattr(existing_type, "length", None) != 100:
        op.alter_column(
            table_name,
            "password",
            existing_type=existing_type,
            type_=sa.String(length=100),
            existing_nullable=password_column["nullable"],
        )
