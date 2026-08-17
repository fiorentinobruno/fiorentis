from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.dependencies import get_db
from app.schemas.push_schema import PushSubscriptionCreate, PushUnsubscribe
from app.services import push_service

router = APIRouter(prefix="/push", tags=["push"])


@router.get("/public-key")
def public_key() -> dict[str, str | None]:
    return {"publicKey": settings.vapid_public_key}


@router.post("/subscribe", status_code=201)
def subscribe(data: PushSubscriptionCreate, db: Session = Depends(get_db)) -> dict[str, str]:
    push_service.subscribe(db, data)
    return {"status": "ok"}


@router.post("/unsubscribe", status_code=204)
def unsubscribe(data: PushUnsubscribe, db: Session = Depends(get_db)) -> None:
    push_service.unsubscribe(db, data.endpoint)
