"""add tempo_estimado, projetos, daily_push_log tipo

Revision ID: a2ae529c0fca
Revises: 99d1835d7390
Create Date: 2026-08-29 02:10:06.634142

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a2ae529c0fca'
down_revision: Union[str, Sequence[str], None] = '99d1835d7390'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('projetos',
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('titulo', sa.String(), nullable=False),
    sa.Column('status', sa.Enum('NAO_INICIADO', 'ANDANDO', 'PAUSADO', 'FEITO', name='status_projeto'), nullable=False),
    sa.Column('notas', sa.String(), nullable=True),
    sa.Column('criado_em', sa.DateTime(), nullable=False),
    sa.Column('atualizado_em', sa.DateTime(), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.add_column('daily_push_log', sa.Column('tipo', sa.String(), server_default='resumo_diario', nullable=False))
    op.drop_constraint(op.f('uq_daily_push_log_dia'), 'daily_push_log', type_='unique')
    op.create_unique_constraint('uq_daily_push_log_dia_tipo', 'daily_push_log', ['dia', 'tipo'])
    op.add_column('items', sa.Column('projeto_id', sa.Uuid(), nullable=True))

    tempo_estimado_item = sa.Enum('M15', 'M30', 'H1', 'H2_MAIS', name='tempo_estimado_item')
    tempo_estimado_item.create(op.get_bind())
    op.add_column('items', sa.Column('tempo_estimado', tempo_estimado_item, nullable=True))

    op.create_foreign_key(None, 'items', 'projetos', ['projeto_id'], ['id'], ondelete='SET NULL')

    # Enum(TipoItem) grava o NOME do membro Python ('TAREFA'), não o value ('tarefa').
    op.execute("UPDATE items SET tempo_estimado = 'M30' WHERE tipo = 'TAREFA'")


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint(None, 'items', type_='foreignkey')
    op.drop_column('items', 'tempo_estimado')
    sa.Enum(name='tempo_estimado_item').drop(op.get_bind())
    op.drop_column('items', 'projeto_id')
    op.drop_constraint('uq_daily_push_log_dia_tipo', 'daily_push_log', type_='unique')
    op.create_unique_constraint(op.f('uq_daily_push_log_dia'), 'daily_push_log', ['dia'], postgresql_nulls_not_distinct=False)
    op.drop_column('daily_push_log', 'tipo')
    op.drop_table('projetos')
