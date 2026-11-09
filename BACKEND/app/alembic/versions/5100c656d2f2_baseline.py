"""Baseline marker for databases whose schema predates Alembic tracking.

Revision ID: 5100c656d2f2
Revises:
Create Date: 2026-07-30 22:04:01.160201
"""

from typing import Sequence, Union

# revision identifiers, used by Alembic.
revision: str = "5100c656d2f2"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Mark the existing schema without dropping or recreating application tables."""


def downgrade() -> None:
    """Keep the existing schema intact when removing the baseline marker."""
