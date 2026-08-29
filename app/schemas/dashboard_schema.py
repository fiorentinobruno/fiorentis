import uuid
from datetime import date, datetime

from pydantic import BaseModel

from app.schemas.item_schema import ItemRead


class DailyChecklistItemCreate(BaseModel):
    titulo: str


class DailyChecklistItemUpdate(BaseModel):
    titulo: str | None = None
    ordem: int | None = None
    ativo: bool | None = None


class DailyChecklistItemRead(BaseModel):
    id: uuid.UUID
    titulo: str
    ordem: int
    ativo: bool
    criado_em: datetime

    model_config = {"from_attributes": True}


class ChecklistLogToggle(BaseModel):
    data: date


class ChecklistDiaCelula(BaseModel):
    data: date
    feito: bool


class ChecklistLinha(BaseModel):
    item_id: uuid.UUID
    titulo: str
    ativo: bool
    dias: list[ChecklistDiaCelula]


class ChecklistSemanaRead(BaseModel):
    semana_inicio: date
    semana_fim: date
    linhas: list[ChecklistLinha]


class GraficoPonto(BaseModel):
    data: date
    total_feitos: int


class DailyQuoteCreate(BaseModel):
    texto: str


class DailyQuoteRead(BaseModel):
    id: uuid.UUID
    texto: str
    is_fallback: bool
    data_alvo: date | None
    criado_em: datetime

    model_config = {"from_attributes": True}


class AgendaItemRead(ItemRead):
    pass


class ResumoPeriodo(BaseModel):
    tarefas_feitas: int
    tarefas_pendentes: int
    eventos: int
    checklist_feitos: int
    checklist_total: int


class ResumoDashboardRead(BaseModel):
    hoje: ResumoPeriodo
    semana: ResumoPeriodo
