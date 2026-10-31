# Production readiness: NOT APPROVED

The repository now has a safer production container baseline, explicit production configuration validation, database migrations, shared production rate-limit storage, trusted-host checks, authentication throttling, and tests for tenant isolation/payment fail-closed behavior. These improvements do **not** make the service ready to handle real customer funds or regulated financial data.

## Required before any production pilot

- [ ] Select the hosting provider, deployment region, DNS, and supported recovery region.
- [ ] Configure production secrets, PostgreSQL, Redis/TLS, explicit CORS origins, allowed hosts, and trusted proxy IP ranges in a secrets manager.
- [ ] Put the service behind HTTPS and an appropriately configured WAF/load balancer; confirm forwarded headers are trusted only from that proxy.
- [ ] Build CI/CD with dependency/image scanning, reproducible builds, test gates, deployment approval, and rollback.
- [ ] Configure backups, point-in-time recovery, restore drills, monitoring, alerting, centralized redacted logs, and an incident-response/on-call process.
- [ ] Complete an independent security review and remediate findings.
- [ ] Add email verification, password reset, MFA, account/session management, and abuse controls.
- [ ] Review tenant isolation and role policy for every API route; add comprehensive authorization and concurrency tests.
- [ ] Define data classification, retention/deletion, privacy notice, consent, terms, and customer-support processes for the chosen jurisdiction.
- [ ] Test schema migration, backup/restore, availability, load, and disaster recovery on production-like infrastructure.

## Required before SaaS subscriptions

- [ ] Choose pricing, billing provider, tax/invoicing treatment, plan entitlements, cancellations, dunning, refunds, and support workflow.
- [ ] Implement signed and idempotent billing webhooks and reconcile subscription state server-side.
- [ ] Test tenant plan enforcement on backend endpoints; UI-only plan gating is insufficient.

## Required before live money movement

- [ ] Obtain jurisdiction-specific legal/compliance advice and any required licenses/approvals.
- [ ] Select a certified payment provider and complete its merchant onboarding and production certification.
- [ ] Implement provider-hosted payment flows, verified webhook signatures, idempotency, replay protection, reconciliation, and failure/refund handling.
- [ ] Define KYC/AML, sanctions, fraud, dispute, and customer-funds safeguarding processes as required by law and provider terms.
- [ ] Independently review ledger posting, financial reconciliation, authorization, audit integrity, and operational procedures.

Payment intent and webhook routes currently return `503`; no real provider or signature verification is configured. Do not enable these endpoints by simply removing the guard.

## Existing technical boundaries

- The included Docker Compose stack is for local development only; its credentials are not production secrets.
- Production API startup runs Alembic migrations. Back up pre-existing databases and review their schema before migration adoption; the initial revision is not an automatic conversion of arbitrary legacy databases.
- The PWA caches the application shell, not authenticated financial data or offline transactions.
- The application has no subscription billing, email delivery, password recovery, MFA, or production hosting configuration yet.
- AI risk scores are decision-support estimates and require governance, validation, bias testing, and human review before operational use.
