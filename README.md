# NjangiFlow AI

A production-oriented, multi-tenant SaaS Progressive Web App for njangi/tontine and community-finance management, with an explainable machine-learning risk layer.

This repository is a deployable product foundation, **not yet a finished or approved production financial service**. Subscription billing, email verification/password recovery, jurisdiction-specific compliance, certified payment processing, and production operations still require implementation and external approvals. Online payment intent/webhook endpoints intentionally return `503` until verified provider integrations exist.

> Brand: **Njangi** · Tagline: **Manage. Grow. Prosper.**

## What is included

- Installable PWA frontend (React + TypeScript + Vite)
- Responsive member/admin dashboard
- Multi-tenant organizations and njangi groups
- Role-based access control
- Contribution and payout workflows
- Double-entry financial ledger foundation
- Loan origination and repayments
- Mobile-money-ready payment intent abstraction and webhook endpoint
- AI/ML member risk scoring with explainable factors
- Reports, audit logs, notifications
- PostgreSQL + Redis via Docker Compose
- FastAPI backend with JWT auth, CORS, rate limiting, security headers
- Local development seed command
- API documentation via FastAPI `/docs`

## Important production note

This repository is a serious product foundation, but a regulated financial product still needs jurisdiction-specific legal/compliance review, KYC/AML controls where applicable, payment-provider certification, data-protection review, penetration testing, secrets management and independent financial reconciliation before processing real customer funds.

## Run locally

### Prerequisites

- Docker + Docker Compose
- Node.js 22+
- Python 3.11+

### Backend

```bash
cd backend
python -m venv .venv
# Windows: .venv\\Scripts\\activate
# Linux/macOS: source .venv/bin/activate
python -m pip install -r requirements.txt
cp .env.example .env
python -m scripts.seed
python -m uvicorn app.main:app --reload --port 8000
```

The demo seed is development-only. It preserves existing data and creates the documented demo login. Do not run it in a deployed environment.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api` requests to the local backend, including when you access the development frontend over your LAN.

### Docker

From the repository root:

```bash
docker compose -f infra/docker-compose.yml up --build
```

The development frontend is served by an unprivileged Nginx container at `http://localhost:4173` and proxies API requests to the backend. The backend docs are available at `http://localhost:8000/docs`. Database and Redis ports are internal to the Compose network.

### Database migrations

The development server creates missing tables for local convenience. Production containers do not mutate the schema on application startup: they run `alembic upgrade head` before starting the API. Back up existing databases before adopting migrations. Do not stamp an existing database as migrated until its schema has been reviewed against the migration.

### Production configuration

The backend image defaults to `ENVIRONMENT=production` and fails closed unless it receives an explicit PostgreSQL URL, Redis URL, a unique secret of at least 32 characters, an HTTPS frontend CORS origin, an allowed-host list, and trusted proxy IPs. Generate a secret with `python -c "import secrets; print(secrets.token_urlsafe(48))"` and provide all settings through your deployment platform's secret manager. Never reuse the development values in `.env.example` or Compose.

Production deployment still requires selecting a hosting provider/region, setting up HTTPS and trusted proxy ranges, database backups/recovery, monitoring/alerts, email delivery, billing, privacy/compliance review, and a certified payment integration. See [the production checklist](./docs/PRODUCTION_CHECKLIST.md).

## Demo credentials after seeding

- Email: `admin@njangi.local`
- Password: `ChangeMe123!`

These are local demo credentials only. The seed command is disabled outside development.

## Product architecture

```text
React + Vite PWA
        |
        v
    FastAPI API
        |
   +----+------------------+
   |                       |
PostgreSQL              Redis
   |
Financial ledger + domain data
   |
   v
ML scoring service layer (scikit-learn)
   |
   +--> risk insights
   +--> contribution behavior
   +--> portfolio indicators
```
