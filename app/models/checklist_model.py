import uuid
from datetime import datetime

from sqlalchemy import ForeignKey, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class ChecklistItem(Base):
    """Subtarefa dentro de um Item. Quando concluída, fica marcada mas não é
    apagada — funciona como um pequeno histórico ('banco') das checklists feitas.
    """

    __tablename__ = "checklist_items"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    item_id: Mapped[uuid.UUID] = mapped_column(
        Uuid, ForeignKey("items.id", ondelete="CASCADE"), nullable=False
    )
    titulo: Mapped[str] = mapped_column(nullable=False)
    concluido: Mapped[bool] = mapped_column(nullable=False, default=False)
    concluido_em: Mapped[datetime | None] = mapped_column(nullable=True)
    criado_em: Mapped[datetime] = mapped_column(nullable=False, default=datetime.now)
