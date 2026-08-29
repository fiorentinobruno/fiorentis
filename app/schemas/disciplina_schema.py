import uuid
from datetime import time

from pydantic import BaseModel


class HorarioAulaCreate(BaseModel):
    dia_semana: int  # 0=segunda ... 6=domingo
    hora_inicio: time
    hora_fim: time
    local: str | None = None


class HorarioAulaRead(BaseModel):
    id: uuid.UUID
    disciplina_id: uuid.UUID
    dia_semana: int
    hora_inicio: time
    hora_fim: time
    local: str | None

    model_config = {"from_attributes": True}


class DisciplinaCreate(BaseModel):
    nome: str
    professor: str | None = None
    cor: str | None = None
    horarios: list[HorarioAulaCreate] = []


class DisciplinaUpdate(BaseModel):
    """Se `horarios` for enviado (mesmo vazio), substitui todos os horários existentes."""

    nome: str | None = None
    professor: str | None = None
    cor: str | None = None
    horarios: list[HorarioAulaCreate] | None = None


class DisciplinaRead(BaseModel):
    id: uuid.UUID
    nome: str
    professor: str | None
    cor: str | None
    horarios: list[HorarioAulaRead] = []

    model_config = {"from_attributes": True}
