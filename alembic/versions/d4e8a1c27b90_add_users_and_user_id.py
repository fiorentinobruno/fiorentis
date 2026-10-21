"""add users and user_id to all user-owned tables

Revision ID: d4e8a1c27b90
Revises: 1fe8cff66ae9
Create Date: 2026-10-21 12:00:00

Dados já existentes passam a pertencer a um usuário "dono" criado aqui, com senha
inutilizável. Defina a senha dele depois do deploy:
    uv run python -m scripts.definir_senha <email> <nova-senha>
O email do dono vem de OWNER_EMAIL (padrão: dono@fiorentis.local). Se o banco
estiver vazio, nenhum usuário é criado.
"""
import os
import uuid
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "d4e8a1c27b90"
down_revision: Union[str, Sequence[str], None] = "1fe8cff66ae9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

TABELAS = [
    "items",
    "disciplinas",
    "projetos",
    "daily_checklist_items",
    "daily_quotes",
    "push_subscriptions",
    "daily_push_log",
]


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("password_hash", sa.String(), nullable=False),
        sa.Column("criado_em", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)

    for tabela in TABELAS:
        op.add_column(tabela, sa.Column("user_id", sa.Uuid(), nullable=True))

    conn = op.get_bind()
    tem_dados = any(
        conn.execute(sa.text(f"SELECT 1 FROM {t} LIMIT 1")).first() is not None for t in TABELAS
    )
    if tem_dados:
        dono_id = uuid.uuid4()
        conn.execute(
            sa.text(
                "INSERT INTO users (id, email, password_hash, criado_em) "
                "VALUES (:id, :email, '!sem-senha', now())"
            ),
            {"id": dono_id, "email": os.environ.get("OWNER_EMAIL", "dono@fiorentis.local").lower()},
        )
        for tabela in TABELAS:
            conn.execute(sa.text(f"UPDATE {tabela} SET user_id = :id"), {"id": dono_id})

    for tabela in TABELAS:
        op.alter_column(tabela, "user_id", nullable=False)
        op.create_foreign_key(
            f"fk_{tabela}_user_id_users", tabela, "users", ["user_id"], ["id"], ondelete="CASCADE"
        )
        op.create_index(op.f(f"ix_{tabela}_user_id"), tabela, ["user_id"])

    op.drop_constraint("uq_daily_push_log_dia_tipo", "daily_push_log", type_="unique")
    op.create_unique_constraint(
        "uq_daily_push_log_user_dia_tipo", "daily_push_log", ["user_id", "dia", "tipo"]
    )


def downgrade() -> None:
    op.drop_constraint("uq_daily_push_log_user_dia_tipo", "daily_push_log", type_="unique")
    # com vários usuários o log pode ter (dia, tipo) repetido; mantém só uma linha de cada
    op.execute(
        "DELETE FROM daily_push_log a USING daily_push_log b "
        "WHERE a.dia = b.dia AND a.tipo = b.tipo AND a.id > b.id"
    )
    op.create_unique_constraint("uq_daily_push_log_dia_tipo", "daily_push_log", ["dia", "tipo"])

    for tabela in reversed(TABELAS):
        op.drop_index(op.f(f"ix_{tabela}_user_id"), table_name=tabela)
        op.drop_constraint(f"fk_{tabela}_user_id_users", tabela, type_="foreignkey")
        op.drop_column(tabela, "user_id")

    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")
