from pathlib import Path

from fastapi import Depends, FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db.dependencies import get_db
from app.routers.item_router import router as item_router
from app.routers.push_router import router as push_router
from app.services.scheduler import iniciar_scheduler

STATIC_DIR = Path(__file__).resolve().parent.parent / "static"

app = FastAPI(title="Fiorentis")

app.include_router(item_router)
app.include_router(push_router)
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.on_event("startup")
def on_startup() -> None:
    iniciar_scheduler()


@app.get("/manifest.json")
def manifest() -> FileResponse:
    return FileResponse(STATIC_DIR / "manifest.json")


@app.get("/service-worker.js")
def service_worker() -> FileResponse:
    return FileResponse(STATIC_DIR / "service-worker.js", media_type="application/javascript")


@app.get("/")
def index() -> FileResponse:
    return FileResponse(STATIC_DIR / "index.html")


@app.get("/todos")
def todos_page() -> FileResponse:
    return FileResponse(STATIC_DIR / "todos.html")


@app.get("/semana")
def semana_page() -> FileResponse:
    return FileResponse(STATIC_DIR / "semana.html")


@app.get("/calendario")
def calendario_page() -> FileResponse:
    return FileResponse(STATIC_DIR / "calendario.html")


@app.get("/health")
def health_check(db: Session = Depends(get_db)) -> dict[str, str]:
    db.execute(text("SELECT 1"))
    return {"status": "ok"}
