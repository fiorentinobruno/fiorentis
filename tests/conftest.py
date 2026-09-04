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


@pytest.fixture()
def client(db_session):
    """
    Deliberately does NOT enter TestClient as a context manager: doing so
    would run the app's startup event, which starts the real APScheduler
    background jobs (scheduler.py) against the actual dev database via
    SessionLocal — not the test session. Skipping lifespan keeps tests
    isolated from that.
    """
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    test_client = TestClient(app)
    yield test_client
    app.dependency_overrides.clear()
