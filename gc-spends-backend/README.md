# GC Spends — FastAPI Backend

Production-ready scaffold for the payments workflow (Executor → Registrar → Distributor → Treasurer).
Includes modular architecture, Alembic migrations, JWT auth, PostgreSQL, Docker, and seed script.

## Quick start (local)
```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
alembic upgrade head
uvicorn app.main:app --reload
```

## Quick start (Docker)
```bash
cp .env.example .env
docker compose up --build
```

## Seed initial data
```bash
python manage.py seed  # optional XLSX seeding if files are present
```

## API
- Base path: `${API_PREFIX}` (default `/api/v1`)
- Swagger: `/docs`

