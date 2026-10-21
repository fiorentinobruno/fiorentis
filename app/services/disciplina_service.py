import uuid

from sqlalchemy.orm import Session, selectinload

from app.models.disciplina_model import Disciplina, HorarioAula
from app.schemas.disciplina_schema import DisciplinaCreate, DisciplinaUpdate


def _query_com_horarios(db: Session):
    return db.query(Disciplina).options(selectinload(Disciplina.horarios))


def _get_simples(db: Session, user_id: uuid.UUID, disciplina_id: uuid.UUID) -> Disciplina | None:
    return (
        db.query(Disciplina)
        .filter(Disciplina.id == disciplina_id, Disciplina.user_id == user_id)
        .first()
    )


def create_disciplina(db: Session, user_id: uuid.UUID, data: DisciplinaCreate) -> Disciplina:
    disciplina = Disciplina(user_id=user_id, nome=data.nome, professor=data.professor, cor=data.cor)
    db.add(disciplina)
    db.flush()

    for horario in data.horarios:
        db.add(HorarioAula(disciplina_id=disciplina.id, **horario.model_dump()))

    db.commit()
    db.refresh(disciplina)
    return _query_com_horarios(db).filter(Disciplina.id == disciplina.id).one()


def list_disciplinas(db: Session, user_id: uuid.UUID) -> list[Disciplina]:
    return _query_com_horarios(db).filter(Disciplina.user_id == user_id).order_by(Disciplina.nome).all()


def get_disciplina(db: Session, user_id: uuid.UUID, disciplina_id: uuid.UUID) -> Disciplina | None:
    return (
        _query_com_horarios(db)
        .filter(Disciplina.id == disciplina_id, Disciplina.user_id == user_id)
        .first()
    )


def update_disciplina(
    db: Session, user_id: uuid.UUID, disciplina_id: uuid.UUID, data: DisciplinaUpdate
) -> Disciplina | None:
    disciplina = _get_simples(db, user_id, disciplina_id)
    if disciplina is None:
        return None

    updates = data.model_dump(exclude_unset=True)
    horarios = updates.pop("horarios", None)

    for field, value in updates.items():
        setattr(disciplina, field, value)

    if horarios is not None:
        db.query(HorarioAula).filter(HorarioAula.disciplina_id == disciplina.id).delete()
        for horario in horarios:
            db.add(HorarioAula(disciplina_id=disciplina.id, **horario))

    db.commit()
    db.refresh(disciplina)
    return _query_com_horarios(db).filter(Disciplina.id == disciplina_id).one()


def delete_disciplina(db: Session, user_id: uuid.UUID, disciplina_id: uuid.UUID) -> bool:
    disciplina = _get_simples(db, user_id, disciplina_id)
    if disciplina is None:
        return False
    db.delete(disciplina)
    db.commit()
    return True
