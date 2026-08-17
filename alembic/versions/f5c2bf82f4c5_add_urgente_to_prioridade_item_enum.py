"""add urgente to prioridade_item enum

Revision ID: f5c2bf82f4c5
Revises: f18c717ba351
Create Date: 2026-08-12 02:11:59.867189

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f5c2bf82f4c5'
down_revision: Union[str, Sequence[str], None] = 'f18c717ba351'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("ALTER TYPE prioridade_item ADD VALUE IF NOT EXISTS 'URGENTE' BEFORE 'ALTA'")


def downgrade() -> None:
    """Downgrade schema."""
    # Postgres não suporta remover valor de enum diretamente.
    # Reverter exigiria recriar o tipo; não implementado (destrutivo/sem uso real esperado).
    pass
