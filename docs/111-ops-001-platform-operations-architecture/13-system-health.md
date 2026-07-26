# 13 — System Health

**Package:** OPS-001  
**Status:** Draft — Awaiting Approval  
**Audience:** M.P.A. platform staff (Master Admin / on-call) — not customers

---

## Purpose

Everything operationally fragile must be **observable**.

Monitor:

| Failure class |
|---------------|
| Queue failures |
| Notification failures |
| Webhook failures |
| Sync failures |
| Background job failures |
| AI failures |
| Storage failures |

---

## Signals

| Signal | Source |
|--------|--------|
| Outbox lag / oldest pending age | Outbox table |
| DLQ depth | `dlq.*` |
| Notify fail rate by channel | Notification Center |
| Job fail rate by `job_type` | Jobs |
| AI error / timeout rate | AI workers |
| Webhook fail / retry exhaustion | Webhook queue |
| Storage upload/sign failures | Media/API-002A metrics |
| Consumer idempotency conflicts | Logs (anomaly) |

Emit `ops.*.failed` events for staff timeline / alerting — never leak tenant PII into public status pages.

---

## Health dashboard (design)

Staff widgets (may live in ADMIN-003):

- Queue lag  
- DLQ counts  
- Channel delivery success  
- Job success ratio  
- AI availability  
- Storage error rate  
- Open P0 ops incidents  

---

## SLOs (design targets)

| Area | Target (starting point) |
|------|-------------------------|
| Outbox dispatch | p95 under 60s under normal load |
| In-app notification write | p95 under 5s from event |
| Push/email | Best-effort; fail visible |
| DLQ | Alert if depth above 0 for critical queues |

Exact numbers finalized at Approve/Implement.

---

## Alerting

| Severity | Example |
|----------|---------|
| P0 | Outbox stalled; payment webhook DLQ |
| P1 | Email provider down; AI timeout spike |
| P2 | Single org job poison |

---

## Acceptance

| ID | Criterion |
|----|-----------|
| SH-01 | Failure classes listed are instrumented in design |
| SH-02 | Staff health surface defined |
| SH-03 | Tenant data not exposed on public health |
| SH-04 | Critical DLQ alerts defined |
