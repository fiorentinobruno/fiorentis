import enum
import uuid
from datetime import datetime

from sqlalchemy import Enum, ForeignKey, Uuid
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class TipoItem(str, enum.Enum):
    TAREFA = "tarefa"
    NOTA = "nota"
    EVENTO = "evento"


class AreaItem(str, enum.Enum):
    FACULDADE = "faculdade"
    TRABALHO = "trabalho"
    NAMORO = "namoro"
    PESSOAL = "pessoal"
    ESTUDOS_EXTERNOS = "estudos_externos"
    COMPRAS = "compras"
    OUTRO = "outro"


class StatusItem(str, enum.Enum):
    INBOX = "inbox"
    A_FAZER = "a_fazer"
    EM_ANDAMENTO = "em_andamento"
    FEITO = "feito"
    ARQUIVADO = "arquivado"


class PrioridadeItem(str, enum.Enum):
    URGENTE = "urgente"
    ALTA = "alta"
    MEDIA = "media"
    BAIXA = "baixa"


class CategoriaCompra(str, enum.Enum):
    MERCADO = "mercado"
    FARMACIA = "farmacia"
    INTERNET = "internet"


class TempoEstimadoItem(str, enum.Enum):
    M15 = "15min"
    M30 = "30min"
    H1 = "1h"
    H2_MAIS = "2h+"


class Item(Base):
    __tablename__ = "items"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    tipo: Mapped[TipoItem | None] = mapped_column(Enum(TipoItem, name="tipo_item"), nullable=True)
    titulo: Mapped[str] = mapped_column(nullable=False)
    descricao: Mapped[str | None] = mapped_column(nullable=True)
    area: Mapped[AreaItem | None] = mapped_column(Enum(AreaItem, name="area_item"), nullable=True)
    status: Mapped[StatusItem] = mapped_column(
        Enum(StatusItem, name="status_item"), nullable=False, default=StatusItem.INBOX
    )
    prioridade: Mapped[PrioridadeItem | None] = mapped_column(
        Enum(PrioridadeItem, name="prioridade_item"), nullable=True
    )
    categoria_compra: Mapped[CategoriaCompra | None] = mapped_column(
        Enum(CategoriaCompra, name="categoria_compra"), nullable=True
    )
    disciplina_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("disciplinas.id", ondelete="SET NULL"), nullable=True
    )
    projeto_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid, ForeignKey("projetos.id", ondelete="SET NULL"), nullable=True
    )
    tempo_estimado: Mapped[TempoEstimadoItem | None] = mapped_column(
        Enum(TempoEstimadoItem, name="tempo_estimado_item"), nullable=True
    )
    prazo: Mapped[datetime | None] = mapped_column(nullable=True)
    data_evento: Mapped[datetime | None] = mapped_column(nullable=True)
    foco_hoje: Mapped[bool] = mapped_column(nullable=False, default=False)
    lembrete_minutos: Mapped[int | None] = mapped_column(nullable=True)
    lembrete_enviado_em: Mapped[datetime | None] = mapped_column(nullable=True)
    criado_em: Mapped[datetime] = mapped_column(nullable=False, default=datetime.now)
    atualizado_em: Mapped[datetime] = mapped_column(
        nullable=False, default=datetime.now, onupdate=datetime.now
    )
    concluido_em: Mapped[datetime | None] = mapped_column(nullable=True)
