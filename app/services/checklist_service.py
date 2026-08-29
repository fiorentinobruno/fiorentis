import uuid
from datetime import datetime

from sqlalchemy.orm import Session

from app.models.checklist_model import ChecklistItem
from app.models.item_model import Item
from app.schemas.checklist_schema import ChecklistItemCreate, ChecklistItemUpdate


def create_checklist_item(db: Session, item_id: uuid.UUID, data: ChecklistItemCreate) -> ChecklistItem | None:
    if db.get(Item, item_id) is None:
        return None
    checklist_item = ChecklistItem(item_id=item_id, titulo=data.titulo)
    db.add(checklist_item)
    db.commit()
    db.refresh(checklist_item)
    return checklist_item


def list_checklist_por_item(db: Session, item_id: uuid.UUID) -> list[ChecklistItem]:
    return (
        db.query(ChecklistItem)
        .filter(ChecklistItem.item_id == item_id)
        .order_by(ChecklistItem.criado_em)
        .all()
    )


def list_concluidos(db: Session, limite: int = 100) -> list[tuple[ChecklistItem, str]]:
    """O 'banco' de checklists concluídas, mais recentes primeiro, com o título do item pai."""
    return (
        db.query(ChecklistItem, Item.titulo)
        .join(Item, Item.id == ChecklistItem.item_id)
        .filter(ChecklistItem.concluido.is_(True))
        .order_by(ChecklistItem.concluido_em.desc())
        .limit(limite)
        .all()
    )


def update_checklist_item(
    db: Session, checklist_id: uuid.UUID, data: ChecklistItemUpdate
) -> ChecklistItem | None:
    checklist_item = db.get(ChecklistItem, checklist_id)
    if checklist_item is None:
        return None

    updates = data.model_dump(exclude_unset=True)
    if "concluido" in updates:
        checklist_item.concluido_em = datetime.now() if updates["concluido"] else None
    for field, value in updates.items():
        setattr(checklist_item, field, value)

    db.commit()
    db.refresh(checklist_item)
    return checklist_item


def delete_checklist_item(db: Session, checklist_id: uuid.UUID) -> bool:
    checklist_item = db.get(ChecklistItem, checklist_id)
    if checklist_item is None:
        return False
    db.delete(checklist_item)
    db.commit()
    return True
