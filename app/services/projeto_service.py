import uuid

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.item_model import Item, StatusItem
from app.models.projeto_model import Projeto
from app.schemas.projeto_schema import ProjetoCreate, ProjetoRead, ProjetoUpdate


def _get_do_usuario(db: Session, user_id: uuid.UUID, projeto_id: uuid.UUID) -> Projeto | None:
    return db.query(Projeto).filter(Projeto.id == projeto_id, Projeto.user_id == user_id).first()


def _contar_progresso(db: Session, projeto_ids: list[uuid.UUID]) -> dict[uuid.UUID, tuple[int, int]]:
    if not projeto_ids:
        return {}
    totais = dict(
        db.query(Item.projeto_id, func.count(Item.id))
        .filter(Item.projeto_id.in_(projeto_ids), Item.status != StatusItem.ARQUIVADO)
        .group_by(Item.projeto_id)
        .all()
    )
    feitas = dict(
        db.query(Item.projeto_id, func.count(Item.id))
        .filter(Item.projeto_id.in_(projeto_ids), Item.status == StatusItem.FEITO)
        .group_by(Item.projeto_id)
        .all()
    )
    return {pid: (feitas.get(pid, 0), totais.get(pid, 0)) for pid in projeto_ids}


def _anexar_progresso(db: Session, projetos: list[Projeto]) -> list[ProjetoRead]:
    progresso = _contar_progresso(db, [p.id for p in projetos])
    resultado = []
    for projeto in projetos:
        feitas, total = progresso.get(projeto.id, (0, 0))
        resultado.append(
            ProjetoRead.model_validate(projeto, from_attributes=True).model_copy(
                update={"tarefas_feitas": feitas, "tarefas_total": total}
            )
        )
    return resultado


def create_projeto(db: Session, user_id: uuid.UUID, data: ProjetoCreate) -> ProjetoRead:
    projeto = Projeto(user_id=user_id, **data.model_dump())
    db.add(projeto)
    db.commit()
    db.refresh(projeto)
    return _anexar_progresso(db, [projeto])[0]


def list_projetos(db: Session, user_id: uuid.UUID) -> list[ProjetoRead]:
    projetos = db.query(Projeto).filter(Projeto.user_id == user_id).order_by(Projeto.criado_em.desc()).all()
    return _anexar_progresso(db, projetos)


def get_projeto(db: Session, user_id: uuid.UUID, projeto_id: uuid.UUID) -> ProjetoRead | None:
    projeto = _get_do_usuario(db, user_id, projeto_id)
    if projeto is None:
        return None
    return _anexar_progresso(db, [projeto])[0]


def update_projeto(
    db: Session, user_id: uuid.UUID, projeto_id: uuid.UUID, data: ProjetoUpdate
) -> ProjetoRead | None:
    projeto = _get_do_usuario(db, user_id, projeto_id)
    if projeto is None:
        return None

    updates = data.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(projeto, field, value)

    db.commit()
    db.refresh(projeto)
    return _anexar_progresso(db, [projeto])[0]


def delete_projeto(db: Session, user_id: uuid.UUID, projeto_id: uuid.UUID) -> bool:
    projeto = _get_do_usuario(db, user_id, projeto_id)
    if projeto is None:
        return False
    db.delete(projeto)
    db.commit()
    return True
