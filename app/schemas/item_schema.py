import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.item_model import AreaItem, PrioridadeItem, StatusItem, TipoItem


class ItemCreate(BaseModel):
    """Captura rápida: só o título é obrigatório, os demais campos são opcionais."""

    titulo: str
    tipo: TipoItem | None = None
    descricao: str | None = None
    area: AreaItem | None = None
    prioridade: PrioridadeItem | None = None
    prazo: datetime | None = None
    data_evento: datetime | None = None
    foco_hoje: bool = False
    lembrete_minutos: int | None = None


class ItemUpdate(BaseModel):
    """Usado para processar um item do inbox ou editar um item existente."""

    tipo: TipoItem | None = None
    titulo: str | None = None
    descricao: str | None = None
    area: AreaItem | None = None
    status: StatusItem | None = None
    prioridade: PrioridadeItem | None = None
    prazo: datetime | None = None
    data_evento: datetime | None = None
    foco_hoje: bool | None = None
    lembrete_minutos: int | None = None


class ItemRead(BaseModel):
    id: uuid.UUID
    tipo: TipoItem | None
    titulo: str
    descricao: str | None
    area: AreaItem | None
    status: StatusItem
    prioridade: PrioridadeItem | None
    prazo: datetime | None
    data_evento: datetime | None
    foco_hoje: bool
    lembrete_minutos: int | None
    criado_em: datetime
    atualizado_em: datetime
    concluido_em: datetime | None

    model_config = {"from_attributes": True}
