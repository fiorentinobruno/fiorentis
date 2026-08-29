"""add categoria_compra to items

Revision ID: 0c8c76675696
Revises: 58803e4d9f31
Create Date: 2026-08-24 20:41:08.341403

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0c8c76675696'
down_revision: Union[str, Sequence[str], None] = '58803e4d9f31'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    categoria_compra = sa.Enum('MERCADO', 'FARMACIA', 'INTERNET', name='categoria_compra')
    categoria_compra.create(op.get_bind())
    op.add_column('items', sa.Column('categoria_compra', categoria_compra, nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('items', 'categoria_compra')
    sa.Enum(name='categoria_compra').drop(op.get_bind())
