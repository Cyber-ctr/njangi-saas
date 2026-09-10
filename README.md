# NjangiFlow AI

A production-oriented, multi-tenant SaaS Progressive Web App for njangi/tontine and community-finance management, with an explainable machine-learning risk layer.

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
- Node.js 20+
- Python 3.11+

### Backend

```bash
cd backend
python -m venv .venv
# Windows: .venv\\Scripts\\activate
# Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python scripts/seed.py
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

### Docker

From the repository root:

```bash
docker compose -f infra/docker-compose.yml up --build
```

Frontend: `http://localhost:4173`
Backend: `http://localhost:8000/docs`

## Demo credentials after seeding

- Email: `admin@njangi.local`
- Password: `ChangeMe123!`

Change these immediately in any real deployment.

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
