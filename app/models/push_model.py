import uuid
from datetime import date, datetime

from sqlalchemy import Date, Uuid, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class PushSubscription(Base):
    __tablename__ = "push_subscriptions"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    endpoint: Mapped[str] = mapped_column(nullable=False, unique=True)
    p256dh: Mapped[str] = mapped_column(nullable=False)
    auth: Mapped[str] = mapped_column(nullable=False)
    criado_em: Mapped[datetime] = mapped_column(nullable=False, default=datetime.now)


class DailyPushLog(Base):
    """Marca o dia em que o resumo diário já foi enviado, pra não duplicar."""

    __tablename__ = "daily_push_log"
    __table_args__ = (UniqueConstraint("dia", "tipo", name="uq_daily_push_log_dia_tipo"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    dia: Mapped[date] = mapped_column(Date, nullable=False)
    tipo: Mapped[str] = mapped_column(nullable=False, default="resumo_diario", server_default="resumo_diario")
    enviado_em: Mapped[datetime] = mapped_column(nullable=False, default=datetime.now)
