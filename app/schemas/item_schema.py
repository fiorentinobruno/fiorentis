import uuid
from datetime import date, datetime

from pydantic import BaseModel

from app.models.item_model import (
    AreaItem,
    CategoriaCompra,
    PrioridadeItem,
    StatusItem,
    TempoEstimadoItem,
    TipoItem,
)


class ItemCreate(BaseModel):
    """Captura rápida: só o título é obrigatório, os demais campos são opcionais."""

    titulo: str
    tipo: TipoItem | None = None
    descricao: str | None = None
    area: AreaItem | None = None
    prioridade: PrioridadeItem | None = None
    tempo_estimado: TempoEstimadoItem | None = None
    prazo: datetime | None = None
    data_evento: datetime | None = None
    data_inicio: datetime | None = None
    foco_hoje: bool = False
    lembrete_minutos: int | None = None
    categoria_compra: CategoriaCompra | None = None
    disciplina_id: uuid.UUID | None = None
    projeto_id: uuid.UUID | None = None


class ItemUpdate(BaseModel):
    """Usado para processar um item do inbox ou editar um item existente."""

    tipo: TipoItem | None = None
    titulo: str | None = None
    descricao: str | None = None
    area: AreaItem | None = None
    status: StatusItem | None = None
    prioridade: PrioridadeItem | None = None
    tempo_estimado: TempoEstimadoItem | None = None
    prazo: datetime | None = None
    data_evento: datetime | None = None
    data_inicio: datetime | None = None
    foco_hoje: bool | None = None
    lembrete_minutos: int | None = None
    categoria_compra: CategoriaCompra | None = None
    disciplina_id: uuid.UUID | None = None
    projeto_id: uuid.UUID | None = None


class ItemRead(BaseModel):
    id: uuid.UUID
    tipo: TipoItem | None
    titulo: str
    descricao: str | None
    area: AreaItem | None
    status: StatusItem
    prioridade: PrioridadeItem | None
    tempo_estimado: TempoEstimadoItem | None
    prazo: datetime | None
    data_evento: datetime | None
    data_inicio: datetime | None
    foco_hoje: bool
    lembrete_minutos: int | None
    categoria_compra: CategoriaCompra | None
    disciplina_id: uuid.UUID | None
    projeto_id: uuid.UUID | None
    checklist_total: int = 0
    checklist_concluidos: int = 0
    criado_em: datetime
    atualizado_em: datetime
    concluido_em: datetime | None

    model_config = {"from_attributes": True}


class FechamentoDiaRequest(BaseModel):
    reagendamentos: dict[uuid.UUID, date] = {}


class FechamentoDiaResumo(BaseModel):
    feitas_hoje: int
    total_hoje: int
    itens_reagendados: int
