# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Fiorentis is a **multi-user personal organization app** (tasks, agenda, daily checklist, class schedule). Each user only sees their own data — see "Auth & multi-tenancy" below. Backend is FastAPI + PostgreSQL + SQLAlchemy 2.x + Alembic, dependency-managed with `uv`. Frontend is plain HTML + Tailwind (CDN) + vanilla JS — no build step, no framework.

`BRIEF.md` has the original product spec (data model rationale, design principles) if you need historical context on *why* something was modeled a certain way.

Note: `todo-api/` is an unrelated, separate old learning project (has its own `.git`) that happens to live nested in this directory — ignore it unless explicitly asked about it.

## Commands

```bash
# Run the dev server (reload on)crie 
uv run uvicorn app.main:app --reload
# or: python main.py

# Dependencies
uv sync

# Tests (real Postgres, separate fiorentis_test_db; schema is recreated each run)
uv run pytest

# Set/create a user's password manually
uv run python -m scripts.definir_senha <email> <senha>

# Migrations
uv run alembic revision --autogenerate -m "description"
uv run alembic upgrade head
uv run alembic downgrade -1

# Local Postgres (docker-compose exposes it on host port 5434)
docker-compose up -d
```

There is a pytest suite (`tests/`), but no linter or frontend build step.

Config comes from `.env` (see `.env.example`), loaded via `app/core/config.py` (`pydantic-settings`). Required: `DATABASE_URL`, `SECRET_KEY` (signs JWTs; Render generates it). Optional: `APP_PASSWORD` (access code required at sign-up, to keep bots out; empty = open sign-up), `VAPID_*` (web push). `OWNER_EMAIL` is read only by the `d4e8a1c27b90` migration.

Deploys to Render (`render.yaml`): build runs `uv sync --frozen && alembic upgrade head`, start runs uvicorn.

## Architecture

### Auth & multi-tenancy

- `POST /auth/register` (needs `codigo_acesso` == `APP_PASSWORD` when that is set) and `POST /auth/login` return a 7-day HS256 JWT. bcrypt hashes, password limited to 8–72 chars (bcrypt's 72-byte limit). `app/core/security.py` has hashing/JWT, `app/core/auth.py` has the `get_current_user` dependency.
- **Every data route takes `user: User = Depends(get_current_user)` and passes `user.id` as the first argument after `db` to the service.** Services must filter by `user_id` on every query, including by-id lookups (never `db.get(Model, id)` on user data — use an owned lookup, otherwise it's an IDOR). Child tables without their own `user_id` (`ChecklistItem`, `HorarioAula`, `DailyChecklistLog`) are scoped by joining through the parent. Item create/update validate that `disciplina_id`/`projeto_id` belong to the user.
- Tables with `user_id` (FK to `users`, cascade delete): `items`, `disciplinas`, `projetos`, `daily_checklist_items`, `daily_quotes`, `push_subscriptions`, `daily_push_log`. New user-owned tables must follow suit and get an isolation test in `tests/test_isolamento.py`.
- Public routes: HTML page routes, `/health`, `/static`, `/manifest.json`, `/service-worker.js`, `/push/public-key`, `/auth/login`, `/auth/register`.
- The migration assigns pre-existing data to an owner user (`OWNER_EMAIL`, default `dono@fiorentis.local`) with no password; registering with that email once claims the account.
- Scheduler jobs loop over users; push is sent per user (`push_service.enviar_push_ao_usuario`). Timezone is still fixed to America/Sao_Paulo.

### Layering (backend)

Every feature follows the same four-file pattern — copy this shape for new features rather than inventing a new one:

```
app/models/<feature>_model.py     # SQLAlchemy ORM models (Base from app/models/base.py)
app/schemas/<feature>_schema.py   # Pydantic request/response schemas
app/services/<feature>_service.py # DB queries + business logic, takes a Session
app/routers/<feature>_router.py   # FastAPI routes, thin — delegates to service, maps None/errors to HTTPException
```

Routers are registered in `app/main.py` via `app.include_router(...)`, and page routes (e.g. `/dashboard`, `/faculdade`) are separate `FileResponse` endpoints in the same file that just serve static HTML. New models must also be imported in `alembic/env.py` (it imports each `app/models/*` module explicitly for autogenerate to see it) — forgetting this means `alembic revision --autogenerate` silently misses the new table.

### Central data model: `Item`

`app/models/item_model.py` defines `Item` as **the single entity for tasks, notes, and events** (`tipo`: tarefa/nota/evento) — deliberately not three separate tables, so an item can change type without a migration. Key fields: `status` (inbox → a_fazer/em_andamento → feito/arquivado), `area` (faculdade/trabalho/namoro/pessoal/estudos_externos/compras/outro), `prioridade` (urgente/alta/media/baixa), `prazo`/`data_evento` (deadline vs. calendar event), `foco_hoje` (manual "focus today" flag), `disciplina_id` (FK to faculdade), `categoria_compra` (for shopping-list items). `ChecklistItem` (`checklist_model.py`) is a **subtask of an Item** — separate from the daily-checklist feature below, don't confuse the two.

The "Hoje" (home) view and the dashboard's "agenda" both query `Item` for what's due today; the definition of "today" is `foco_hoje IS true OR prazo falls within today`, deduplicated — see `list_agenda_hoje` in `app/services/dashboard_service.py` for the current reference implementation of that union query.

### Feature areas

- **Items/Todos** (`item_*`, `checklist_*` for subtasks): core task CRUD, duplicate-title guard (409 on same title among non-archived items), used by the Hoje/Semana/Calendário/Geral pages.
- **Disciplinas** (`disciplina_*`): class schedule (`Disciplina` + `HorarioAula`, weekly grid, no `Item` generation) that `Item.disciplina_id` links into. Faculdade page renders the grid on the left and disciplines with pending-task counts on the right.
- **Dashboard** (`dashboard_*`): the newer "daily home" feature — separate from the `Item`-based "Hoje" board. Has its own `DailyChecklistItem`/`DailyChecklistLog` tables (recurring checklist like "creatina", "academia" — logged per calendar day, one log row per item+day) and `DailyQuote` (daily motivational quote, with a `data_alvo`-targeted quote taking priority over a random fallback). Weekly checklist view is derived on the fly from logs (`_semana_para_data` computes Mon–Sun for a reference date) — there is no separate "week" table. Deactivated checklist items (`ativo=False`) are hidden from new weeks but still shown (tagged) in past weeks where they have logs.
- **Push notifications** (`push_*`): web push via VAPID/`pywebpush`. `app/services/scheduler.py` runs an in-process APScheduler with per-minute jobs (reminders, daily summary at a fixed hour) — jobs self-guard on `agora.hour == X` since they run every minute.

### Frontend conventions

Each page is `static/<page>.html` + `static/<page>.js`, sharing `static/auth.js` (must be the first script on every protected page: stores the JWT in `localStorage`, patches `window.fetch` to add the Bearer header for same-origin calls and redirect to `/login` on 401, exposes `Auth.sair()`), `static/header.js` (renders the dropdown nav — has a hardcoded `MENUS` array that must be updated when adding a page) and `static/shared.js` (shared helpers: `renderItem()` for the standard task-card UI, area/priority color maps, date formatters). `static/theme.css` holds theme tokens (`--accent`, `--accent-soft`) used via Tailwind's `text-[color:var(--accent)]` pattern — keep new UI on this token instead of hardcoding colors, and prefer reusing `renderItem`/`shared.js` helpers over building new card markup for `Item`-based data.

Static assets are cache-busted with a shared `?v=<unix timestamp>` query string appended to every `<script src>`/`<link href>` across all HTML files — when changing any shared static file (`header.js`, `shared.js`, `theme.css`, etc.), bump that timestamp on **all** HTML pages together (they're kept in sync to one value), or browsers will keep serving a stale cached copy.
