import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.dependencies import get_db
from app.models.user_model import User
from app.schemas.disciplina_schema import DisciplinaCreate, DisciplinaRead, DisciplinaUpdate
from app.services import disciplina_service

router = APIRouter(prefix="/disciplinas", tags=["disciplinas"])


@router.post("", response_model=DisciplinaRead, status_code=201)
def create_disciplina(data: DisciplinaCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> DisciplinaRead:
    return disciplina_service.create_disciplina(db, user.id, data)


@router.get("", response_model=list[DisciplinaRead])
def list_disciplinas(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[DisciplinaRead]:
    return disciplina_service.list_disciplinas(db, user.id)


@router.get("/{disciplina_id}", response_model=DisciplinaRead)
def get_disciplina(disciplina_id: uuid.UUID, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> DisciplinaRead:
    disciplina = disciplina_service.get_disciplina(db, user.id, disciplina_id)
    if disciplina is None:
        raise HTTPException(status_code=404, detail="Disciplina não encontrada")
    return disciplina


@router.patch("/{disciplina_id}", response_model=DisciplinaRead)
def update_disciplina(
    disciplina_id: uuid.UUID, data: DisciplinaUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> DisciplinaRead:
    disciplina = disciplina_service.update_disciplina(db, user.id, disciplina_id, data)
    if disciplina is None:
        raise HTTPException(status_code=404, detail="Disciplina não encontrada")
    return disciplina


@router.delete("/{disciplina_id}", status_code=204)
def delete_disciplina(disciplina_id: uuid.UUID, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> None:
    deleted = disciplina_service.delete_disciplina(db, user.id, disciplina_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Disciplina não encontrada")
