import uuid
from datetime import date, datetime, timedelta

from sqlalchemy import and_, func, or_
from sqlalchemy.orm import Session

from app.models.checklist_model import ChecklistItem
from app.models.item_model import AreaItem, Item, StatusItem, TempoEstimadoItem, TipoItem
from app.schemas.item_schema import ItemCreate, ItemUpdate
from app.services.data_utils import intervalo_semana

_ORDEM_TEMPO_ESTIMADO = [
    TempoEstimadoItem.M15,
    TempoEstimadoItem.M30,
    TempoEstimadoItem.H1,
    TempoEstimadoItem.H2_MAIS,
]


def _anexar_contagem_checklist(db: Session, itens: list[Item]) -> list[Item]:
    if not itens:
        return itens
    ids = [item.id for item in itens]
    totais = dict(
        db.query(ChecklistItem.item_id, func.count(ChecklistItem.id))
        .filter(ChecklistItem.item_id.in_(ids))
        .group_by(ChecklistItem.item_id)
        .all()
    )
    concluidos = dict(
        db.query(ChecklistItem.item_id, func.count(ChecklistItem.id))
        .filter(ChecklistItem.item_id.in_(ids), ChecklistItem.concluido.is_(True))
        .group_by(ChecklistItem.item_id)
        .all()
    )
    for item in itens:
        item.checklist_total = totais.get(item.id, 0)
        item.checklist_concluidos = concluidos.get(item.id, 0)
    return itens


class TituloDuplicadoError(Exception):
    def __init__(self, titulo: str) -> None:
        self.titulo = titulo
        super().__init__(f"Já existe um item ativo com o título '{titulo}'")


class TempoEstimadoObrigatorioError(Exception):
    def __init__(self) -> None:
        super().__init__("tempo_estimado é obrigatório para itens do tipo tarefa")


def _titulo_duplicado(db: Session, titulo: str, ignorar_id: uuid.UUID | None = None) -> bool:
    query = db.query(Item).filter(
        func.lower(Item.titulo) == titulo.strip().lower(),
        Item.status != StatusItem.ARQUIVADO,
    )
    if ignorar_id is not None:
        query = query.filter(Item.id != ignorar_id)
    return db.query(query.exists()).scalar()


def _validar_tempo_estimado(item: Item) -> None:
    if item.tipo == TipoItem.TAREFA and item.tempo_estimado is None:
        raise TempoEstimadoObrigatorioError()


def _predicado_dia(dia_inicio: datetime, dia_fim: datetime):
    return and_(
        or_(
            Item.foco_hoje.is_(True),
            (Item.data_evento >= dia_inicio) & (Item.data_evento < dia_fim),
            Item.prazo < dia_fim,
        ),
        Item.status != StatusItem.ARQUIVADO,
        or_(
            Item.status != StatusItem.FEITO,
            Item.concluido_em >= dia_inicio,
        ),
    )


def contar_tarefas_dia(db: Session, dia: date) -> tuple[int, int]:
    """Retorna (feitas, total) usando o mesmo predicado da view 'hoje'."""
    dia_inicio = datetime.combine(dia, datetime.min.time())
    dia_fim = dia_inicio + timedelta(days=1)
    predicado = _predicado_dia(dia_inicio, dia_fim)
    total = db.query(Item).filter(predicado).count()
    feitas = db.query(Item).filter(predicado, Item.status == StatusItem.FEITO).count()
    return feitas, total


def create_item(db: Session, data: ItemCreate) -> Item:
    if _titulo_duplicado(db, data.titulo):
        raise TituloDuplicadoError(data.titulo)

    item = Item(**data.model_dump())
    _validar_tempo_estimado(item)
    db.add(item)
    db.commit()
    db.refresh(item)
    item.checklist_total = 0
    item.checklist_concluidos = 0
    return item


def get_item(db: Session, item_id: uuid.UUID) -> Item | None:
    item = db.get(Item, item_id)
    if item is not None:
        _anexar_contagem_checklist(db, [item])
    return item


def list_items(
    db: Session,
    status: StatusItem | None = None,
    view: str | None = None,
    area: AreaItem | None = None,
    disciplina_id: uuid.UUID | None = None,
    projeto_id: uuid.UUID | None = None,
    tempo_estimado: TempoEstimadoItem | None = None,
) -> list[Item]:
    query = db.query(Item)

    if status is not None:
        query = query.filter(Item.status == status)

    if area is not None:
        query = query.filter(Item.area == area)

    if disciplina_id is not None:
        query = query.filter(Item.disciplina_id == disciplina_id)

    if projeto_id is not None:
        query = query.filter(Item.projeto_id == projeto_id)

    if tempo_estimado is not None:
        idx = _ORDEM_TEMPO_ESTIMADO.index(tempo_estimado)
        query = query.filter(Item.tempo_estimado.in_(_ORDEM_TEMPO_ESTIMADO[: idx + 1]))

    if view == "hoje":
        hoje_inicio = datetime.combine(datetime.now().date(), datetime.min.time())
        hoje_fim = hoje_inicio + timedelta(days=1)
        query = query.filter(_predicado_dia(hoje_inicio, hoje_fim))
    elif view == "semana":
        semana_inicio, semana_fim = intervalo_semana(datetime.now().date())
        query = query.filter(
            or_(
                (Item.prazo >= semana_inicio) & (Item.prazo < semana_fim),
                (Item.data_evento >= semana_inicio) & (Item.data_evento < semana_fim),
            ),
            Item.status != StatusItem.ARQUIVADO,
        )

    itens = query.order_by(Item.criado_em.desc()).all()
    return _anexar_contagem_checklist(db, itens)


def list_tarefas_semana_por_disciplina(
    db: Session, referencia: date
) -> dict[uuid.UUID, list[Item]]:
    semana_inicio, semana_fim = intervalo_semana(referencia)
    itens = (
        db.query(Item)
        .filter(
            Item.disciplina_id.isnot(None),
            Item.prazo >= semana_inicio,
            Item.prazo < semana_fim,
            Item.status != StatusItem.ARQUIVADO,
        )
        .order_by(Item.prazo)
        .all()
    )
    _anexar_contagem_checklist(db, itens)
    agrupado: dict[uuid.UUID, list[Item]] = {}
    for item in itens:
        agrupado.setdefault(item.disciplina_id, []).append(item)
    return agrupado


def update_item(db: Session, item_id: uuid.UUID, data: ItemUpdate) -> Item | None:
    item = db.get(Item, item_id)
    if item is None:
        return None

    status_anterior = item.status
    updates = data.model_dump(exclude_unset=True)

    if "titulo" in updates and _titulo_duplicado(db, updates["titulo"], ignorar_id=item.id):
        raise TituloDuplicadoError(updates["titulo"])

    for field, value in updates.items():
        setattr(item, field, value)

    _validar_tempo_estimado(item)

    if "prazo" in updates or "data_evento" in updates or "lembrete_minutos" in updates:
        item.lembrete_enviado_em = None

    if item.status != status_anterior:
        if item.status == StatusItem.FEITO:
            item.concluido_em = datetime.now()
        elif item.status != StatusItem.ARQUIVADO:
            item.concluido_em = None

    db.commit()
    db.refresh(item)
    _anexar_contagem_checklist(db, [item])
    return item


def delete_item(db: Session, item_id: uuid.UUID) -> bool:
    item = db.get(Item, item_id)
    if item is None:
        return False
    db.delete(item)
    db.commit()
    return True


def fechar_dia(
    db: Session, reagendamentos: dict[uuid.UUID, date] | None = None
) -> tuple[int, int, int]:
    """Fecha o dia: conta feitas/total de hoje e adia pendências atrasadas/de hoje.

    Retorna (feitas_hoje, total_hoje, itens_reagendados).
    """
    reagendamentos = reagendamentos or {}
    hoje = datetime.now().date()
    feitas, total = contar_tarefas_dia(db, hoje)

    amanha_inicio = datetime.combine(hoje, datetime.min.time()) + timedelta(days=1)
    pendentes = (
        db.query(Item)
        .filter(
            Item.status.in_([StatusItem.A_FAZER, StatusItem.EM_ANDAMENTO]),
            Item.prazo.isnot(None),
            Item.prazo < amanha_inicio,
        )
        .all()
    )

    reagendados = 0
    for item in pendentes:
        nova_data = reagendamentos.get(item.id, hoje + timedelta(days=1))
        item.prazo = datetime.combine(nova_data, item.prazo.time())
        item.lembrete_enviado_em = None
        reagendados += 1

    db.commit()
    return feitas, total, reagendados
