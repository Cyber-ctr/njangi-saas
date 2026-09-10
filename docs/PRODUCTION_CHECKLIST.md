# Production checklist

Before real-money launch:

1. Replace demo secret and credentials with managed secrets.
2. Add Alembic migrations and disable `create_all` in production.
3. Put API behind HTTPS, WAF/rate-limits and centralized logging.
4. Integrate certified payment providers and verify webhook signatures.
5. Implement KYC/AML policies where legally required.
6. Add idempotency keys to money-moving endpoints.
7. Add immutable ledger controls and daily reconciliation.
8. Add backups, point-in-time recovery and disaster-recovery tests.
9. Add Sentry/OpenTelemetry/metrics/alerting.
10. Independent security review and penetration testing.
11. Complete privacy policy, terms, consent and retention controls.
12. Govern ML: consent, drift monitoring, bias testing, human review and model registry.
