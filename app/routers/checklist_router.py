import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.dependencies import get_db
from app.schemas.checklist_schema import (
    ChecklistItemComPai,
    ChecklistItemCreate,
    ChecklistItemRead,
    ChecklistItemUpdate,
)
from app.services import checklist_service

router = APIRouter(tags=["checklist"])


@router.post("/items/{item_id}/checklist", response_model=ChecklistItemRead, status_code=201)
def create_checklist_item(
    item_id: uuid.UUID, data: ChecklistItemCreate, db: Session = Depends(get_db)
) -> ChecklistItemRead:
    checklist_item = checklist_service.create_checklist_item(db, item_id, data)
    if checklist_item is None:
        raise HTTPException(status_code=404, detail="Item não encontrado")
    return checklist_item


@router.get("/items/{item_id}/checklist", response_model=list[ChecklistItemRead])
def list_checklist_por_item(item_id: uuid.UUID, db: Session = Depends(get_db)) -> list[ChecklistItemRead]:
    return checklist_service.list_checklist_por_item(db, item_id)


@router.get("/checklist/concluidos", response_model=list[ChecklistItemComPai])
def list_concluidos(db: Session = Depends(get_db)) -> list[ChecklistItemComPai]:
    resultados = checklist_service.list_concluidos(db)
    return [
        ChecklistItemComPai(**ChecklistItemRead.model_validate(checklist_item).model_dump(), item_titulo=titulo)
        for checklist_item, titulo in resultados
    ]


@router.patch("/checklist/{checklist_id}", response_model=ChecklistItemRead)
def update_checklist_item(
    checklist_id: uuid.UUID, data: ChecklistItemUpdate, db: Session = Depends(get_db)
) -> ChecklistItemRead:
    checklist_item = checklist_service.update_checklist_item(db, checklist_id, data)
    if checklist_item is None:
        raise HTTPException(status_code=404, detail="Item de checklist não encontrado")
    return checklist_item


@router.delete("/checklist/{checklist_id}", status_code=204)
def delete_checklist_item(checklist_id: uuid.UUID, db: Session = Depends(get_db)) -> None:
    deleted = checklist_service.delete_checklist_item(db, checklist_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Item de checklist não encontrado")
