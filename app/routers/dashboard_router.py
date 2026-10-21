import uuid
from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.db.dependencies import get_db
from app.models.user_model import User
from app.schemas.dashboard_schema import (
    AgendaItemRead,
    ChecklistLogToggle,
    ChecklistSemanaRead,
    DailyChecklistItemCreate,
    DailyChecklistItemRead,
    DailyChecklistItemUpdate,
    DailyQuoteCreate,
    DailyQuoteRead,
    GraficoPonto,
    ResumoDashboardRead,
)
from app.services import dashboard_service

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/resumo", response_model=ResumoDashboardRead)
def get_resumo(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> ResumoDashboardRead:
    return dashboard_service.get_resumo_dashboard(db, user.id)


@router.get("/agenda", response_model=list[AgendaItemRead])
def get_agenda(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[AgendaItemRead]:
    return dashboard_service.list_agenda_hoje(db, user.id)


@router.post("/agenda/{item_id}/concluir", response_model=AgendaItemRead)
def concluir_agenda(item_id: uuid.UUID, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> AgendaItemRead:
    item = dashboard_service.concluir_item_agenda(db, user.id, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Item não encontrado")
    return item


@router.get("/checklist", response_model=ChecklistSemanaRead)
def get_checklist_semana(data: date | None = None, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> ChecklistSemanaRead:
    referencia = data or datetime.now().date()
    return dashboard_service.get_checklist_semana(db, user.id, referencia)


@router.post("/checklist/{item_id}/toggle")
def toggle_checklist(item_id: uuid.UUID, payload: ChecklistLogToggle, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> dict:
    log = dashboard_service.toggle_checklist_log(db, user.id, item_id, payload.data)
    if log is None:
        raise HTTPException(status_code=404, detail="Item de checklist não encontrado")
    return {"item_id": item_id, "data": log.data, "feito": log.feito}


@router.get("/checklist/grafico", response_model=list[GraficoPonto])
def get_grafico(dias: int = 7, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[GraficoPonto]:
    if dias not in (7, 15, 30):
        raise HTTPException(status_code=422, detail="dias deve ser 7, 15 ou 30")
    return dashboard_service.get_grafico_checklist(db, user.id, dias)


@router.get("/checklist-items", response_model=list[DailyChecklistItemRead])
def list_checklist_items(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[DailyChecklistItemRead]:
    return dashboard_service.list_daily_checklist_items_ativos(db, user.id)


@router.post("/checklist-items", response_model=DailyChecklistItemRead, status_code=201)
def create_checklist_item(
    data: DailyChecklistItemCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> DailyChecklistItemRead:
    return dashboard_service.create_daily_checklist_item(db, user.id, data)


@router.patch("/checklist-items/{item_id}", response_model=DailyChecklistItemRead)
def update_checklist_item(
    item_id: uuid.UUID, data: DailyChecklistItemUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> DailyChecklistItemRead:
    item = dashboard_service.update_daily_checklist_item(db, user.id, item_id, data)
    if item is None:
        raise HTTPException(status_code=404, detail="Item de checklist não encontrado")
    return item


@router.get("/quote", response_model=DailyQuoteRead | None)
def get_quote(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> DailyQuoteRead | None:
    return dashboard_service.get_frase_do_dia(db, user.id)


@router.get("/quotes", response_model=list[DailyQuoteRead])
def list_quotes(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[DailyQuoteRead]:
    return dashboard_service.list_quotes(db, user.id)


@router.post("/quotes", response_model=DailyQuoteRead, status_code=201)
def create_quote(data: DailyQuoteCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> DailyQuoteRead:
    return dashboard_service.create_fallback_quote(db, user.id, data)


@router.post("/quotes/amanha", response_model=DailyQuoteRead)
def set_quote_amanha(data: DailyQuoteCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> DailyQuoteRead:
    return dashboard_service.set_frase_amanha(db, user.id, data)


@router.delete("/quotes/{quote_id}", status_code=204)
def delete_quote(quote_id: uuid.UUID, user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> None:
    deleted = dashboard_service.delete_quote(db, user.id, quote_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Frase não encontrada")
