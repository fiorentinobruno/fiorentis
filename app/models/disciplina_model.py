import uuid
from datetime import time

from sqlalchemy import ForeignKey, Integer, Time, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Disciplina(Base):
    __tablename__ = "disciplinas"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    nome: Mapped[str] = mapped_column(nullable=False)
    professor: Mapped[str | None] = mapped_column(nullable=True)
    cor: Mapped[str | None] = mapped_column(nullable=True)
    horarios: Mapped[list["HorarioAula"]] = relationship(
        back_populates="disciplina", cascade="all, delete-orphan", order_by="HorarioAula.dia_semana"
    )


class HorarioAula(Base):
    """Grade fixa da semana. Não gera Items — é só referência visual."""

    __tablename__ = "horarios_aula"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    disciplina_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("disciplinas.id", ondelete="CASCADE"), nullable=False
    )
    dia_semana: Mapped[int] = mapped_column(Integer, nullable=False)  # 0=segunda ... 6=domingo
    hora_inicio: Mapped[time] = mapped_column(Time, nullable=False)
    hora_fim: Mapped[time] = mapped_column(Time, nullable=False)
    local: Mapped[str | None] = mapped_column(nullable=True)

    disciplina: Mapped["Disciplina"] = relationship(back_populates="horarios")
