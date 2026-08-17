import uuid
from datetime import datetime, timedelta

from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.models.item_model import Item, StatusItem
from app.schemas.item_schema import ItemCreate, ItemUpdate


def create_item(db: Session, data: ItemCreate) -> Item:
    item = Item(**data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def get_item(db: Session, item_id: uuid.UUID) -> Item | None:
    return db.get(Item, item_id)


def list_items(
    db: Session,
    status: StatusItem | None = None,
    view: str | None = None,
) -> list[Item]:
    query = db.query(Item)

    if status is not None:
        query = query.filter(Item.status == status)

    if view == "hoje":
        hoje_inicio = datetime.combine(datetime.now().date(), datetime.min.time())
        hoje_fim = hoje_inicio + timedelta(days=1)
        query = query.filter(
            or_(
                Item.foco_hoje.is_(True),
                (Item.data_evento >= hoje_inicio) & (Item.data_evento < hoje_fim),
                Item.prazo < hoje_fim,
            ),
            Item.status != StatusItem.ARQUIVADO,
            or_(
                Item.status != StatusItem.FEITO,
                Item.concluido_em >= hoje_inicio,
            ),
        )
    elif view == "semana":
        hoje = datetime.now().date()
        semana_inicio = datetime.combine(hoje - timedelta(days=hoje.weekday()), datetime.min.time())
        semana_fim = semana_inicio + timedelta(days=7)
        query = query.filter(
            or_(
                (Item.prazo >= semana_inicio) & (Item.prazo < semana_fim),
                (Item.data_evento >= semana_inicio) & (Item.data_evento < semana_fim),
            ),
            Item.status != StatusItem.ARQUIVADO,
        )

    return query.order_by(Item.criado_em.desc()).all()


def update_item(db: Session, item_id: uuid.UUID, data: ItemUpdate) -> Item | None:
    item = db.get(Item, item_id)
    if item is None:
        return None

    status_anterior = item.status
    updates = data.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(item, field, value)

    if "prazo" in updates or "data_evento" in updates or "lembrete_minutos" in updates:
        item.lembrete_enviado_em = None

    if item.status != status_anterior:
        if item.status == StatusItem.FEITO:
            item.concluido_em = datetime.now()
        elif item.status != StatusItem.ARQUIVADO:
            item.concluido_em = None

    db.commit()
    db.refresh(item)
    return item


def delete_item(db: Session, item_id: uuid.UUID) -> bool:
    item = db.get(Item, item_id)
    if item is None:
        return False
    db.delete(item)
    db.commit()
    return True
