"""
Test fixtures. Runs against a real Postgres database (the same local
docker-compose instance used for dev) so behavior in tests matches
production exactly — no sqlite/dialect differences to worry about.

Uses a separate database ("fiorentis_test_db") on that instance, created
automatically if missing. Each test runs inside a transaction that's rolled
back afterwards, so tests stay isolated and fast without recreating schema
every time.
"""

import psycopg
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.db.dependencies import get_db
from app.main import app
from app.models.base import Base
from app.models import (  # noqa: F401
    checklist_model,
    dashboard_model,
    disciplina_model,
    item_model,
    projeto_model,
    push_model,
    user_model,
)

TEST_DB_NAME = "fiorentis_test_db"


def _base_admin_url() -> str:
    """Same server/credentials as DATABASE_URL, but pointed at the default 'postgres' db."""
    url = settings.database_url.replace("postgresql+psycopg://", "postgresql://")
    prefix, _, _ = url.rpartition("/")
    return f"{prefix}/postgres"


def _test_database_url() -> str:
    url = settings.database_url
    prefix, _, _ = url.rpartition("/")
    return f"{prefix}/{TEST_DB_NAME}"


def _ensure_test_database_exists() -> None:
    conn = psycopg.connect(_base_admin_url(), autocommit=True)
    try:
        exists = conn.execute(
            "SELECT 1 FROM pg_database WHERE datname = %s", (TEST_DB_NAME,)
        ).fetchone()
        if not exists:
            conn.execute(f'CREATE DATABASE "{TEST_DB_NAME}"')
    finally:
        conn.close()


@pytest.fixture(scope="session")
def engine():
    _ensure_test_database_exists()
    engine = create_engine(_test_database_url())
    # banco dedicado a testes: recria o schema a cada execução para acompanhar mudanças nos models
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    yield engine
    engine.dispose()


@pytest.fixture()
def db_session(engine):
    connection = engine.connect()
    transaction = connection.begin()
    TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=connection)
    session = TestSessionLocal()

    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


def _novo_client(email: str) -> TestClient:
    """Client com um usuário recém-cadastrado já autenticado."""
    test_client = TestClient(app)
    resp = test_client.post("/auth/register", json={"email": email, "senha": "senha-segura-123"})
    assert resp.status_code == 201, resp.text
    test_client.headers["Authorization"] = f"Bearer {resp.json()['access_token']}"
    return test_client


@pytest.fixture()
def anon_client(db_session):
    """Client sem autenticação (para testar /auth e rotas protegidas).

    Deliberately does NOT enter TestClient as a context manager: doing so
    would run the app's startup event, which starts the real APScheduler
    background jobs (scheduler.py) against the actual dev database via
    SessionLocal — not the test session. Skipping lifespan keeps tests
    isolated from that.
    """
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture()
def client(anon_client):
    """Client autenticado como o usuário A."""
    return _novo_client("a@exemplo.com")


@pytest.fixture()
def client_b(anon_client):
    """Client autenticado como o usuário B — para testes de isolamento."""
    return _novo_client("b@exemplo.com")
