"""alter_password_length

Revision ID: 1272bd6c355a
Revises: 26e413e2bae1
Create Date: 2026-08-02 22:56:20.662618

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "1272bd6c355a"
down_revision: Union[str, Sequence[str], None] = "26e413e2bae1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Alter recruiter password length from 100 to 60
    op.alter_column(
        "recruiters",
        "password",
        existing_type=sa.String(length=100),
        type_=sa.String(length=60),
        existing_nullable=False,
    )

    # Alter candidate password length from 100 to 60
    op.alter_column(
        "candidates",
        "password",
        existing_type=sa.String(length=100),
        type_=sa.String(length=60),
        existing_nullable=False,
    )


def downgrade() -> None:
    # Revert recruiter password length back to 100
    op.alter_column(
        "recruiters",
        "password",
        existing_type=sa.String(length=60),
        type_=sa.String(length=100),
        existing_nullable=False,
    )

    # Revert candidate password length back to 100
    op.alter_column(
        "candidates",
        "password",
        existing_type=sa.String(length=60),
        type_=sa.String(length=100),
        existing_nullable=False,
    )
