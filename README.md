# Outmate Mini GTM Enrichment System

This repo is a focused take-home implementation of a mini enrichment workflow.

## What is included

- Backend API for CSV upload and job tracking
- PostgreSQL models for jobs and enriched companies
- In-process background processing using FastAPI BackgroundTasks (free-tier friendly)
- Next.js frontend to upload CSV, poll status, and view results
- Docker Compose to run full stack locally

## Architecture

- `POST /api/v1/uploads`: accepts CSV (`domain` column) + `org_id`
- Creates a `job` and queued `company` records
- Triggers background processing in backend (no separate worker required)
- Enrichment flow uses Explorium match (`domain -> business_id`) then firmographics enrich
- Frontend polls `/api/v1/jobs/{id}` and reads `/api/v1/jobs/{id}/companies`

## Run locally

1. Copy env values and set Explorium config:

```bash
cp .env.example .env
```

2. Start services:

```bash
docker compose up --build
```

3. Open app:

- Frontend: `http://localhost:3000`
- Backend docs: `http://localhost:8000/docs`

## CSV format

Use a CSV with a `domain` header, for example:

```csv
domain
stripe.com
openai.com
notion.so
```

## Validation status

- Real Explorium integration is validated end-to-end (no fallback mode) with successful processing on uploaded domain batches.
- `industry` and `company_size` are returned for matched companies.
- `revenue_range` may be unavailable for some records and is stored as `Unknown` when the provider does not return that field.

## Key tradeoffs

- SQLAlchemy `create_all` on startup instead of Alembic to keep setup fast
- Background processing is in-process for free deployment compatibility
- Basic retry/backoff in processing path; no dead-letter queue yet

## Free deployment note

- This project now runs without a separate Redis/worker service, so it can be deployed on free web-tier platforms more easily.
- For production scale, move back to dedicated queue + worker.

## What I would improve next

- Replace startup table creation with migrations (Alembic)
- Add auth + org scoping middleware and RBAC
- Re-introduce dedicated queue/worker for high throughput and isolation
- Add request tracing and metrics (OpenTelemetry + Prometheus)
- Add frontend caching/state via TanStack Query
