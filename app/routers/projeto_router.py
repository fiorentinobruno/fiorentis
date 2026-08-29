import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.dependencies import get_db
from app.schemas.projeto_schema import ProjetoCreate, ProjetoRead, ProjetoUpdate
from app.services import projeto_service

router = APIRouter(prefix="/api/projetos", tags=["projetos"])


@router.post("", response_model=ProjetoRead, status_code=201)
def create_projeto(data: ProjetoCreate, db: Session = Depends(get_db)) -> ProjetoRead:
    return projeto_service.create_projeto(db, data)


@router.get("", response_model=list[ProjetoRead])
def list_projetos(db: Session = Depends(get_db)) -> list[ProjetoRead]:
    return projeto_service.list_projetos(db)


@router.get("/{projeto_id}", response_model=ProjetoRead)
def get_projeto(projeto_id: uuid.UUID, db: Session = Depends(get_db)) -> ProjetoRead:
    projeto = projeto_service.get_projeto(db, projeto_id)
    if projeto is None:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")
    return projeto


@router.patch("/{projeto_id}", response_model=ProjetoRead)
def update_projeto(projeto_id: uuid.UUID, data: ProjetoUpdate, db: Session = Depends(get_db)) -> ProjetoRead:
    projeto = projeto_service.update_projeto(db, projeto_id, data)
    if projeto is None:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")
    return projeto


@router.delete("/{projeto_id}", status_code=204)
def delete_projeto(projeto_id: uuid.UUID, db: Session = Depends(get_db)) -> None:
    deleted = projeto_service.delete_projeto(db, projeto_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")
