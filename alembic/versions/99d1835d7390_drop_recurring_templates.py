"""drop recurring templates

Revision ID: 99d1835d7390
Revises: b7e1a4f9c3d2
Create Date: 2026-08-26 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '99d1835d7390'
down_revision: Union[str, Sequence[str], None] = 'b7e1a4f9c3d2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.drop_table('recurring_templates')
    op.drop_table('daily_recurring_log')
    sa.Enum(name='recorrencia_tipo').drop(op.get_bind())


def downgrade() -> None:
    """Downgrade schema."""
    raise NotImplementedError("recurring templates feature was removed; no downgrade path")
