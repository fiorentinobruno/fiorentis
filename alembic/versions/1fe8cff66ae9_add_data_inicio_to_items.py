"""add_data_inicio_to_items

Revision ID: 1fe8cff66ae9
Revises: a2ae529c0fca
Create Date: 2026-09-10 20:37:27.206071

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1fe8cff66ae9'
down_revision: Union[str, Sequence[str], None] = 'a2ae529c0fca'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column("items", sa.Column("data_inicio", sa.DateTime(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column("items", "data_inicio")
