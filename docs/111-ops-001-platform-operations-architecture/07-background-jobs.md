# 07 — Background Jobs

**Package:** OPS-001  
**Status:** Draft — Awaiting Approval

---

## Purpose

Long-running, retryable, or deferred work executes as **Jobs** — never blocking the user request path beyond enqueue acknowledgment.

---

## Job examples

| Job | Notes |
|-----|-------|
| Generate reports | PDF/CSV; vault store |
| Sync QuickBooks | Integration adapter; future |
| Import spreadsheets | MIG / setup imports |
| OCR documents | Media pipeline |
| AI summaries | Triggered by events; heavy compute |
| Nightly maintenance | Cleanup, aggregates, lease.expiring materialization |
| Retry failed webhooks | Outbound delivery |
| Notification channel send | Push/email/SMS workers |
| Timeline projection catch-up | Rebuild/repair |

---

## Job record

| Field | Description |
|-------|-------------|
| `job_id` | UUID |
| `organization_id` | Nullable for platform jobs |
| `job_type` | Catalog key |
| `payload` | JSON (no secrets) |
| `status` | `queued` / `running` / `succeeded` / `failed` / `dead` |
| `attempts` | Counter |
| `run_after` | Delay / schedule |
| `locked_by` / `locked_at` | Worker claim |
| `last_error` | Redacted |
| `correlation_id` | Trace |

---

## Execution rules

1. Enqueue from event consumer, scheduler, or API  
2. Worker claims with lease TTL  
3. Idempotent handlers preferred  
4. Success → terminal; failure → retry policy ([08](./08-queue-architecture.md))  
5. Exhausted → DLQ + `ops.job.failed` + health signal  

---

## Priority classes

| Class | Examples |
|-------|----------|
| **Interactive** | Notification send, small AI classify |
| **Default** | Imports, reports |
| **Batch** | Nightly maintenance |
| **Critical** | Webhook retry for payments facts |

---

## Acceptance

| ID | Criterion |
|----|-----------|
| BJ-01 | Job types cover listed examples |
| BJ-02 | Non-blocking enqueue from request path |
| BJ-03 | Retry + DLQ + health event on failure |
| BJ-04 | Org-scoped where tenant data involved |
