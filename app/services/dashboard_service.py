import uuid
from datetime import date, datetime, timedelta

from sqlalchemy import and_, func, or_
from sqlalchemy.orm import Session

from app.models.dashboard_model import DailyChecklistItem, DailyChecklistLog, DailyQuote
from app.models.item_model import Item, PrioridadeItem, StatusItem, TipoItem
from app.schemas.dashboard_schema import (
    ChecklistDiaCelula,
    ChecklistLinha,
    ChecklistSemanaRead,
    DailyChecklistItemCreate,
    DailyChecklistItemUpdate,
    DailyQuoteCreate,
    GraficoPonto,
    ResumoDashboardRead,
    ResumoPeriodo,
)
from app.services import item_service
from app.services.data_utils import intervalo_semana
from app.services.data_utils import semana_para_data as _semana_para_data

_ORDEM_PRIORIDADE = {
    PrioridadeItem.URGENTE: 0,
    PrioridadeItem.ALTA: 1,
    PrioridadeItem.MEDIA: 2,
    PrioridadeItem.BAIXA: 3,
}


def list_agenda_hoje(db: Session, limite: int = 3) -> list[Item]:
    hoje = datetime.now().date()
    hoje_inicio = datetime.combine(hoje, datetime.min.time())
    hoje_fim = hoje_inicio + timedelta(days=1)

    itens = (
        db.query(Item)
        .filter(
            Item.status != StatusItem.ARQUIVADO,
            Item.status != StatusItem.FEITO,
            or_(
                Item.foco_hoje.is_(True),
                (Item.data_inicio >= hoje_inicio) & (Item.data_inicio < hoje_fim),
                and_(
                    (Item.prazo >= hoje_inicio) & (Item.prazo < hoje_fim),
                    or_(Item.data_inicio.is_(None), Item.data_inicio < hoje_fim),
                ),
            ),
        )
        .all()
    )

    def chave(item: Item) -> tuple:
        rank_prioridade = _ORDEM_PRIORIDADE.get(item.prioridade, 4)
        rank_prazo = item.prazo or datetime.max
        return (rank_prioridade, rank_prazo)

    itens.sort(key=chave)
    return itens[:limite]


def concluir_item_agenda(db: Session, item_id: uuid.UUID) -> Item | None:
    item = db.get(Item, item_id)
    if item is None:
        return None
    item.status = StatusItem.FEITO
    item.concluido_em = datetime.now()
    db.commit()
    db.refresh(item)
    return item


def create_daily_checklist_item(db: Session, data: DailyChecklistItemCreate) -> DailyChecklistItem:
    maior_ordem = db.query(func.max(DailyChecklistItem.ordem)).scalar() or 0
    item = DailyChecklistItem(titulo=data.titulo, ordem=maior_ordem + 1)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def list_daily_checklist_items_ativos(db: Session) -> list[DailyChecklistItem]:
    return (
        db.query(DailyChecklistItem)
        .filter(DailyChecklistItem.ativo.is_(True))
        .order_by(DailyChecklistItem.ordem)
        .all()
    )


def update_daily_checklist_item(
    db: Session, item_id: uuid.UUID, data: DailyChecklistItemUpdate
) -> DailyChecklistItem | None:
    item = db.get(DailyChecklistItem, item_id)
    if item is None:
        return None
    updates = data.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(item, field, value)
    db.commit()
    db.refresh(item)
    return item


def get_checklist_semana(db: Session, referencia: date) -> ChecklistSemanaRead:
    semana_inicio, semana_fim = _semana_para_data(referencia)

    itens_com_log_na_semana = (
        db.query(DailyChecklistItem.id)
        .join(DailyChecklistLog, DailyChecklistLog.item_id == DailyChecklistItem.id)
        .filter(DailyChecklistLog.data >= semana_inicio, DailyChecklistLog.data <= semana_fim)
        .distinct()
    )
    itens = (
        db.query(DailyChecklistItem)
        .filter(
            or_(
                DailyChecklistItem.ativo.is_(True),
                DailyChecklistItem.id.in_(itens_com_log_na_semana),
            )
        )
        .order_by(DailyChecklistItem.ordem)
        .all()
    )

    logs = (
        db.query(DailyChecklistLog)
        .filter(DailyChecklistLog.data >= semana_inicio, DailyChecklistLog.data <= semana_fim)
        .all()
    )
    logs_por_item: dict[uuid.UUID, dict[date, bool]] = {}
    for log in logs:
        logs_por_item.setdefault(log.item_id, {})[log.data] = log.feito

    linhas: list[ChecklistLinha] = []
    for item in itens:
        dias = []
        for i in range(7):
            dia = semana_inicio + timedelta(days=i)
            feito = logs_por_item.get(item.id, {}).get(dia, False)
            dias.append(ChecklistDiaCelula(data=dia, feito=feito))
        linhas.append(
            ChecklistLinha(item_id=item.id, titulo=item.titulo, ativo=item.ativo, dias=dias)
        )

    return ChecklistSemanaRead(semana_inicio=semana_inicio, semana_fim=semana_fim, linhas=linhas)


def toggle_checklist_log(db: Session, item_id: uuid.UUID, dia: date) -> DailyChecklistLog | None:
    if db.get(DailyChecklistItem, item_id) is None:
        return None

    log = (
        db.query(DailyChecklistLog)
        .filter(DailyChecklistLog.item_id == item_id, DailyChecklistLog.data == dia)
        .first()
    )
    if log is None:
        log = DailyChecklistLog(item_id=item_id, data=dia, feito=True, feito_em=datetime.now())
        db.add(log)
    else:
        log.feito = not log.feito
        log.feito_em = datetime.now() if log.feito else None

    db.commit()
    db.refresh(log)
    return log


def get_grafico_checklist(db: Session, dias: int) -> list[GraficoPonto]:
    hoje = datetime.now().date()
    inicio = hoje - timedelta(days=dias - 1)

    contagens = dict(
        db.query(DailyChecklistLog.data, func.count(DailyChecklistLog.id))
        .filter(
            DailyChecklistLog.feito.is_(True),
            DailyChecklistLog.data >= inicio,
            DailyChecklistLog.data <= hoje,
        )
        .group_by(DailyChecklistLog.data)
        .all()
    )

    pontos = []
    for i in range(dias):
        dia = inicio + timedelta(days=i)
        pontos.append(GraficoPonto(data=dia, total_feitos=contagens.get(dia, 0)))
    return pontos


def get_frase_do_dia(db: Session) -> DailyQuote | None:
    hoje = datetime.now().date()
    especifica = db.query(DailyQuote).filter(DailyQuote.data_alvo == hoje).first()
    if especifica is not None:
        return especifica
    return (
        db.query(DailyQuote)
        .filter(DailyQuote.is_fallback.is_(True))
        .order_by(func.random())
        .first()
    )


def list_quotes(db: Session) -> list[DailyQuote]:
    return db.query(DailyQuote).order_by(DailyQuote.criado_em.desc()).all()


def create_fallback_quote(db: Session, data: DailyQuoteCreate) -> DailyQuote:
    quote = DailyQuote(texto=data.texto, is_fallback=True, data_alvo=None)
    db.add(quote)
    db.commit()
    db.refresh(quote)
    return quote


def set_frase_amanha(db: Session, data: DailyQuoteCreate) -> DailyQuote:
    amanha = datetime.now().date() + timedelta(days=1)
    quote = db.query(DailyQuote).filter(DailyQuote.data_alvo == amanha).first()
    if quote is None:
        quote = DailyQuote(texto=data.texto, is_fallback=False, data_alvo=amanha)
        db.add(quote)
    else:
        quote.texto = data.texto
    db.commit()
    db.refresh(quote)
    return quote


def delete_quote(db: Session, quote_id: uuid.UUID) -> bool:
    quote = db.get(DailyQuote, quote_id)
    if quote is None:
        return False
    db.delete(quote)
    db.commit()
    return True


def _contar_eventos(db: Session, inicio: datetime, fim: datetime) -> int:
    return (
        db.query(Item)
        .filter(Item.tipo == TipoItem.EVENTO, Item.data_evento >= inicio, Item.data_evento < fim)
        .count()
    )


def _contar_checklist(db: Session, dia_inicio: date, dia_fim: date) -> tuple[int, int]:
    ativos_total = db.query(func.count(DailyChecklistItem.id)).filter(
        DailyChecklistItem.ativo.is_(True)
    ).scalar() or 0
    dias = (dia_fim - dia_inicio).days + 1
    total = ativos_total * dias
    feitos = (
        db.query(func.count(DailyChecklistLog.id))
        .filter(
            DailyChecklistLog.feito.is_(True),
            DailyChecklistLog.data >= dia_inicio,
            DailyChecklistLog.data <= dia_fim,
        )
        .scalar()
        or 0
    )
    return feitos, total


def get_resumo_hoje(db: Session) -> ResumoPeriodo:
    hoje = datetime.now().date()
    feitas, total = item_service.contar_tarefas_dia(db, hoje)
    hoje_inicio = datetime.combine(hoje, datetime.min.time())
    hoje_fim = hoje_inicio + timedelta(days=1)
    eventos = _contar_eventos(db, hoje_inicio, hoje_fim)
    checklist_feitos, checklist_total = _contar_checklist(db, hoje, hoje)
    return ResumoPeriodo(
        tarefas_feitas=feitas,
        tarefas_pendentes=total - feitas,
        eventos=eventos,
        checklist_feitos=checklist_feitos,
        checklist_total=checklist_total,
    )


def get_resumo_semana(db: Session) -> ResumoPeriodo:
    hoje = datetime.now().date()
    semana_inicio, semana_fim = _semana_para_data(hoje)
    semana_inicio_dt, semana_fim_dt = intervalo_semana(hoje)

    feitas = 0
    total = 0
    for i in range((semana_fim - semana_inicio).days + 1):
        dia = semana_inicio + timedelta(days=i)
        f, t = item_service.contar_tarefas_dia(db, dia)
        feitas += f
        total += t

    eventos = _contar_eventos(db, semana_inicio_dt, semana_fim_dt)
    checklist_feitos, checklist_total = _contar_checklist(db, semana_inicio, semana_fim)
    return ResumoPeriodo(
        tarefas_feitas=feitas,
        tarefas_pendentes=total - feitas,
        eventos=eventos,
        checklist_feitos=checklist_feitos,
        checklist_total=checklist_total,
    )


def get_resumo_dashboard(db: Session) -> ResumoDashboardRead:
    return ResumoDashboardRead(hoje=get_resumo_hoje(db), semana=get_resumo_semana(db))
