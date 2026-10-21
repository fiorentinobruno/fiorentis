import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, Date, ForeignKey, Integer, String, Uuid, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class DailyChecklistItem(Base):
    """Item recorrente da checklist diária (ex: creatina, academia, leitura)."""

    __tablename__ = "daily_checklist_items"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    titulo: Mapped[str] = mapped_column(String, nullable=False)
    ordem: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    ativo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    criado_em: Mapped[datetime] = mapped_column(nullable=False, default=datetime.now)


class DailyChecklistLog(Base):
    """Marcação de um item da checklist diária num dia específico."""

    __tablename__ = "daily_checklist_logs"
    __table_args__ = (UniqueConstraint("item_id", "data", name="uq_daily_checklist_log_item_data"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    item_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("daily_checklist_items.id", ondelete="CASCADE"), nullable=False
    )
    data: Mapped[date] = mapped_column(Date, nullable=False)
    feito: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    feito_em: Mapped[datetime | None] = mapped_column(nullable=True)


class DailyQuote(Base):
    """Frase do dia — pode ser específica (data_alvo) ou parte do banco de fallback."""

    __tablename__ = "daily_quotes"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    texto: Mapped[str] = mapped_column(String, nullable=False)
    is_fallback: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    data_alvo: Mapped[date | None] = mapped_column(Date, nullable=True)
    criado_em: Mapped[datetime] = mapped_column(nullable=False, default=datetime.now)
