"""add daily dashboard tables

Revision ID: b7e1a4f9c3d2
Revises: a3c971e0c032
Create Date: 2026-08-26 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b7e1a4f9c3d2'
down_revision: Union[str, Sequence[str], None] = 'a3c971e0c032'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('daily_checklist_items',
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('titulo', sa.String(), nullable=False),
    sa.Column('ordem', sa.Integer(), nullable=False),
    sa.Column('ativo', sa.Boolean(), nullable=False),
    sa.Column('criado_em', sa.DateTime(), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_table('daily_checklist_logs',
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('item_id', sa.Uuid(), nullable=False),
    sa.Column('data', sa.Date(), nullable=False),
    sa.Column('feito', sa.Boolean(), nullable=False),
    sa.Column('feito_em', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['item_id'], ['daily_checklist_items.id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('item_id', 'data', name='uq_daily_checklist_log_item_data')
    )
    op.create_table('daily_quotes',
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('texto', sa.String(), nullable=False),
    sa.Column('is_fallback', sa.Boolean(), nullable=False),
    sa.Column('data_alvo', sa.Date(), nullable=True),
    sa.Column('criado_em', sa.DateTime(), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('daily_quotes')
    op.drop_table('daily_checklist_logs')
    op.drop_table('daily_checklist_items')
