from pathlib import Path

from fastapi import Depends, FastAPI, Request
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db.dependencies import get_db
from app.routers.auth_router import router as auth_router
from app.routers.checklist_router import router as checklist_router
from app.routers.dashboard_router import router as dashboard_router
from app.routers.disciplina_router import router as disciplina_router
from app.routers.item_router import router as item_router
from app.routers.projeto_router import router as projeto_router
from app.routers.push_router import router as push_router
from app.services.scheduler import iniciar_scheduler

STATIC_DIR = Path(__file__).resolve().parent.parent / "static"

app = FastAPI(title="Fiorentis")

@app.middleware("http")
async def sem_cache_em_json(request: Request, call_next):
    """Respostas da API são por usuário: impede que o navegador reaproveite uma resposta
    de outra sessão (o cache HTTP não considera o header Authorization)."""
    response = await call_next(request)
    if response.headers.get("content-type", "").startswith("application/json"):
        response.headers["Cache-Control"] = "no-store"
    return response


app.include_router(auth_router)
app.include_router(item_router)
app.include_router(push_router)
app.include_router(disciplina_router)
app.include_router(checklist_router)
app.include_router(dashboard_router)
app.include_router(projeto_router)
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


@app.get("/login")
def login_page() -> FileResponse:
    return FileResponse(STATIC_DIR / "login.html")


@app.get("/cadastro")
def cadastro_page() -> FileResponse:
    return FileResponse(STATIC_DIR / "cadastro.html")


@app.get("/todos")
def todos_page() -> FileResponse:
    return FileResponse(STATIC_DIR / "todos.html")


@app.get("/semana")
def semana_page() -> FileResponse:
    return FileResponse(STATIC_DIR / "semana.html")


@app.get("/calendario")
def calendario_page() -> FileResponse:
    return FileResponse(STATIC_DIR / "calendario.html")


@app.get("/faculdade")
def faculdade_page() -> FileResponse:
    return FileResponse(STATIC_DIR / "faculdade.html")


@app.get("/pessoal")
def pessoal_page() -> FileResponse:
    return FileResponse(STATIC_DIR / "pessoal.html")


@app.get("/dashboard")
def dashboard_page() -> FileResponse:
    return FileResponse(STATIC_DIR / "dashboard.html")


@app.get("/dashboard/gerenciar")
def dashboard_gerenciar_page() -> FileResponse:
    return FileResponse(STATIC_DIR / "dashboard-gerenciar.html")


@app.get("/estudos")
def estudos_page() -> FileResponse:
    return FileResponse(STATIC_DIR / "estudos.html")


@app.get("/health")
def health_check() -> dict[str, str]:
    """Liveness sem tocar no banco: é o que o monitor externo chama a cada poucos minutos."""
    return {"status": "ok"}


@app.get("/health/db")
def health_check_db(db: Session = Depends(get_db)) -> dict[str, str]:
    db.execute(text("SELECT 1"))
    return {"status": "ok"}
