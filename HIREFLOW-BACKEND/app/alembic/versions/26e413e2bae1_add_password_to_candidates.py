"""add password to candidates

Revision ID: 26e413e2bae1
Revises: 5100c656d2f2
Create Date: 2026-07-30 22:10:29.059901

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "26e413e2bae1"
down_revision: Union[str, Sequence[str], None] = "5100c656d2f2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column("candidates", sa.Column("password", sa.String()))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("candidates", "password")
