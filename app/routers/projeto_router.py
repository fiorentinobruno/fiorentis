import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.dependencies import get_db
from app.models.user_model import User
from app.schemas.projeto_schema import ProjetoCreate, ProjetoRead, ProjetoUpdate
from app.services import projeto_service

router = APIRouter(prefix="/api/projetos", tags=["projetos"])


@router.post("", response_model=ProjetoRead, status_code=201)
def create_projeto(data: ProjetoCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> ProjetoRead:
    return projeto_service.create_projeto(db, user.id, data)


@router.get("", response_model=list[ProjetoRead])
def list_projetos(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[ProjetoRead]:
    return projeto_service.list_projetos(db, user.id)


@router.get("/{projeto_id}", response_model=ProjetoRead)
def get_projeto(projeto_id: uuid.UUID, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> ProjetoRead:
    projeto = projeto_service.get_projeto(db, user.id, projeto_id)
    if projeto is None:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")
    return projeto


@router.patch("/{projeto_id}", response_model=ProjetoRead)
def update_projeto(projeto_id: uuid.UUID, data: ProjetoUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> ProjetoRead:
    projeto = projeto_service.update_projeto(db, user.id, projeto_id, data)
    if projeto is None:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")
    return projeto


@router.delete("/{projeto_id}", status_code=204)
def delete_projeto(projeto_id: uuid.UUID, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> None:
    deleted = projeto_service.delete_projeto(db, user.id, projeto_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")
