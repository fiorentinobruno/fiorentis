import enum
import uuid
from datetime import datetime

from sqlalchemy import Enum, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class StatusProjeto(str, enum.Enum):
    NAO_INICIADO = "nao_iniciado"
    ANDANDO = "andando"
    PAUSADO = "pausado"
    FEITO = "feito"


class Projeto(Base):
    __tablename__ = "projetos"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    titulo: Mapped[str] = mapped_column(nullable=False)
    status: Mapped[StatusProjeto] = mapped_column(
        Enum(StatusProjeto, name="status_projeto"), nullable=False, default=StatusProjeto.NAO_INICIADO
    )
    notas: Mapped[str | None] = mapped_column(nullable=True)
    criado_em: Mapped[datetime] = mapped_column(nullable=False, default=datetime.now)
    atualizado_em: Mapped[datetime] = mapped_column(
        nullable=False, default=datetime.now, onupdate=datetime.now
    )
