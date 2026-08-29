import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.projeto_model import StatusProjeto


class ProjetoCreate(BaseModel):
    titulo: str
    notas: str | None = None


class ProjetoUpdate(BaseModel):
    titulo: str | None = None
    status: StatusProjeto | None = None
    notas: str | None = None


class ProjetoRead(BaseModel):
    id: uuid.UUID
    titulo: str
    status: StatusProjeto
    notas: str | None
    criado_em: datetime
    atualizado_em: datetime
    tarefas_feitas: int = 0
    tarefas_total: int = 0

    model_config = {"from_attributes": True}
