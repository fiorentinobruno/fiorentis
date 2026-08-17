import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.dependencies import get_db
from app.models.item_model import StatusItem
from app.schemas.item_schema import ItemCreate, ItemRead, ItemUpdate
from app.services import item_service

router = APIRouter(prefix="/items", tags=["items"])


@router.post("", response_model=ItemRead, status_code=201)
def create_item(data: ItemCreate, db: Session = Depends(get_db)) -> ItemRead:
    return item_service.create_item(db, data)


@router.get("", response_model=list[ItemRead])
def list_items(
    status: StatusItem | None = None,
    view: str | None = None,
    db: Session = Depends(get_db),
) -> list[ItemRead]:
    return item_service.list_items(db, status=status, view=view)


@router.get("/{item_id}", response_model=ItemRead)
def get_item(item_id: uuid.UUID, db: Session = Depends(get_db)) -> ItemRead:
    item = item_service.get_item(db, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Item não encontrado")
    return item


@router.patch("/{item_id}", response_model=ItemRead)
def update_item(item_id: uuid.UUID, data: ItemUpdate, db: Session = Depends(get_db)) -> ItemRead:
    item = item_service.update_item(db, item_id, data)
    if item is None:
        raise HTTPException(status_code=404, detail="Item não encontrado")
    return item


@router.delete("/{item_id}", status_code=204)
def delete_item(item_id: uuid.UUID, db: Session = Depends(get_db)) -> None:
    deleted = item_service.delete_item(db, item_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Item não encontrado")
