import uuid
from datetime import datetime

from pydantic import BaseModel


class ChecklistItemCreate(BaseModel):
    titulo: str


class ChecklistItemUpdate(BaseModel):
    titulo: str | None = None
    concluido: bool | None = None


class ChecklistItemRead(BaseModel):
    id: uuid.UUID
    item_id: uuid.UUID
    titulo: str
    concluido: bool
    concluido_em: datetime | None
    criado_em: datetime

    model_config = {"from_attributes": True}


class ChecklistItemComPai(ChecklistItemRead):
    item_titulo: str
