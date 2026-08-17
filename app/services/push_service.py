import json
import logging

from pywebpush import WebPushException, webpush
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.push_model import PushSubscription
from app.schemas.push_schema import PushSubscriptionCreate

logger = logging.getLogger(__name__)


def subscribe(db: Session, data: PushSubscriptionCreate) -> PushSubscription:
    existente = db.query(PushSubscription).filter(PushSubscription.endpoint == data.endpoint).first()
    if existente:
        existente.p256dh = data.keys.p256dh
        existente.auth = data.keys.auth
        db.commit()
        db.refresh(existente)
        return existente

    subscription = PushSubscription(
        endpoint=data.endpoint, p256dh=data.keys.p256dh, auth=data.keys.auth
    )
    db.add(subscription)
    db.commit()
    db.refresh(subscription)
    return subscription


def unsubscribe(db: Session, endpoint: str) -> None:
    db.query(PushSubscription).filter(PushSubscription.endpoint == endpoint).delete()
    db.commit()


def enviar_push(db: Session, subscription: PushSubscription, titulo: str, corpo: str, url: str = "/") -> None:
    payload = json.dumps({"title": titulo, "body": corpo, "url": url})
    try:
        webpush(
            subscription_info={
                "endpoint": subscription.endpoint,
                "keys": {"p256dh": subscription.p256dh, "auth": subscription.auth},
            },
            data=payload,
            vapid_private_key=settings.vapid_private_key,
            vapid_claims={"sub": settings.vapid_claims_email},
        )
    except WebPushException as exc:
        status_code = exc.response.status_code if exc.response is not None else None
        if status_code in (404, 410):
            db.query(PushSubscription).filter(PushSubscription.id == subscription.id).delete()
            db.commit()
        else:
            logger.warning("Falha ao enviar push: %s", exc)


def enviar_push_a_todos(db: Session, titulo: str, corpo: str, url: str = "/") -> None:
    for subscription in db.query(PushSubscription).all():
        enviar_push(db, subscription, titulo, corpo, url)
