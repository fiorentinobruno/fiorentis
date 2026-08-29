import uuid
from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.dependencies import get_db
from app.models.item_model import AreaItem, StatusItem, TempoEstimadoItem
from app.schemas.item_schema import (
    FechamentoDiaRequest,
    FechamentoDiaResumo,
    ItemCreate,
    ItemRead,
    ItemUpdate,
)
from app.services import item_service
from app.services.item_service import TempoEstimadoObrigatorioError, TituloDuplicadoError

router = APIRouter(prefix="/items", tags=["items"])


@router.post("", response_model=ItemRead, status_code=201)
def create_item(data: ItemCreate, db: Session = Depends(get_db)) -> ItemRead:
    try:
        return item_service.create_item(db, data)
    except TituloDuplicadoError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except TempoEstimadoObrigatorioError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.get("", response_model=list[ItemRead])
def list_items(
    status: StatusItem | None = None,
    view: str | None = None,
    area: AreaItem | None = None,
    disciplina_id: uuid.UUID | None = None,
    projeto_id: uuid.UUID | None = None,
    tempo_estimado: TempoEstimadoItem | None = None,
    db: Session = Depends(get_db),
) -> list[ItemRead]:
    return item_service.list_items(
        db,
        status=status,
        view=view,
        area=area,
        disciplina_id=disciplina_id,
        projeto_id=projeto_id,
        tempo_estimado=tempo_estimado,
    )


@router.get("/semana-por-disciplina", response_model=dict[uuid.UUID, list[ItemRead]])
def semana_por_disciplina(
    referencia: date | None = None, db: Session = Depends(get_db)
) -> dict[uuid.UUID, list[ItemRead]]:
    return item_service.list_tarefas_semana_por_disciplina(db, referencia or date.today())


@router.post("/fechar-dia", response_model=FechamentoDiaResumo)
def fechar_dia(
    data: FechamentoDiaRequest = FechamentoDiaRequest(), db: Session = Depends(get_db)
) -> FechamentoDiaResumo:
    feitas, total, reagendados = item_service.fechar_dia(db, data.reagendamentos)
    return FechamentoDiaResumo(feitas_hoje=feitas, total_hoje=total, itens_reagendados=reagendados)


@router.get("/{item_id}", response_model=ItemRead)
def get_item(item_id: uuid.UUID, db: Session = Depends(get_db)) -> ItemRead:
    item = item_service.get_item(db, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Item não encontrado")
    return item


@router.patch("/{item_id}", response_model=ItemRead)
def update_item(item_id: uuid.UUID, data: ItemUpdate, db: Session = Depends(get_db)) -> ItemRead:
    try:
        item = item_service.update_item(db, item_id, data)
    except TituloDuplicadoError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    except TempoEstimadoObrigatorioError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    if item is None:
        raise HTTPException(status_code=404, detail="Item não encontrado")
    return item


@router.delete("/{item_id}", status_code=204)
def delete_item(item_id: uuid.UUID, db: Session = Depends(get_db)) -> None:
    deleted = item_service.delete_item(db, item_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Item não encontrado")
