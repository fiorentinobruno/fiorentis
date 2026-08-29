import logging
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from apscheduler.schedulers.background import BackgroundScheduler

from app.db.session import SessionLocal
from app.models.item_model import Item, StatusItem
from app.models.push_model import DailyPushLog
from app.services import push_service

logger = logging.getLogger(__name__)

FUSO_HORARIO = ZoneInfo("America/Sao_Paulo")
HORA_RESUMO_DIARIO = 8  # 8h da manhã, horário de Brasília


def agora_local() -> datetime:
    """'Agora' em horário de Brasília, naive — pra comparar com os datetimes
    do banco, que são gravados sem timezone assumindo o horário local do usuário.
    """
    return datetime.now(FUSO_HORARIO).replace(tzinfo=None)


def verificar_lembretes() -> None:
    db = SessionLocal()
    try:
        agora = agora_local()
        itens = (
            db.query(Item)
            .filter(
                Item.lembrete_minutos.is_not(None),
                Item.lembrete_enviado_em.is_(None),
                Item.status.notin_([StatusItem.FEITO, StatusItem.ARQUIVADO]),
            )
            .all()
        )

        for item in itens:
            candidatos = [d for d in (item.data_evento, item.prazo) if d is not None and d > agora]
            if not candidatos:
                continue
            data_alvo = min(candidatos)

            gatilho = data_alvo - timedelta(minutes=item.lembrete_minutos)
            if gatilho <= agora < data_alvo:
                push_service.enviar_push_a_todos(
                    db,
                    titulo=item.titulo,
                    corpo=f"Vence às {data_alvo.strftime('%H:%M')}",
                    url="/",
                )
                item.lembrete_enviado_em = agora
                db.commit()
    finally:
        db.close()


def verificar_resumo_diario() -> None:
    db = SessionLocal()
    try:
        agora = agora_local()
        if agora.hour != HORA_RESUMO_DIARIO:
            return

        hoje = agora.date()
        ja_enviado = (
            db.query(DailyPushLog)
            .filter(DailyPushLog.dia == hoje, DailyPushLog.tipo == "resumo_diario")
            .first()
        )
        if ja_enviado:
            return

        hoje_inicio = datetime.combine(hoje, datetime.min.time())
        hoje_fim = hoje_inicio + timedelta(days=1)
        from sqlalchemy import or_

        itens = (
            db.query(Item)
            .filter(
                or_(
                    Item.foco_hoje.is_(True),
                    (Item.data_evento >= hoje_inicio) & (Item.data_evento < hoje_fim),
                    Item.prazo < hoje_fim,
                ),
                Item.status.notin_([StatusItem.ARQUIVADO, StatusItem.FEITO]),
            )
            .all()
        )

        if itens:
            corpo = f"{len(itens)} item{'s' if len(itens) != 1 else ''} pra hoje"
            push_service.enviar_push_a_todos(db, titulo="Resumo do dia", corpo=corpo, url="/")

        db.add(DailyPushLog(dia=hoje, tipo="resumo_diario"))
        db.commit()
    finally:
        db.close()


def verificar_fechamento_dia() -> None:
    db = SessionLocal()
    try:
        agora = agora_local()
        if agora.hour != 23 or agora.minute < 50:
            return

        hoje = agora.date()
        ja_enviado = (
            db.query(DailyPushLog)
            .filter(DailyPushLog.dia == hoje, DailyPushLog.tipo == "fechamento_dia")
            .first()
        )
        if ja_enviado:
            return

        push_service.enviar_push_a_todos(
            db,
            titulo="Fechar o dia",
            corpo="Dá uma olhada no que ficou pendente antes de virar o dia.",
            url="/",
        )

        db.add(DailyPushLog(dia=hoje, tipo="fechamento_dia"))
        db.commit()
    finally:
        db.close()


def iniciar_scheduler() -> BackgroundScheduler:
    scheduler = BackgroundScheduler()
    scheduler.add_job(verificar_lembretes, "interval", minutes=1, id="lembretes")
    scheduler.add_job(verificar_resumo_diario, "interval", minutes=1, id="resumo_diario")
    scheduler.add_job(verificar_fechamento_dia, "interval", minutes=1, id="fechamento_dia")
    scheduler.start()
    return scheduler
