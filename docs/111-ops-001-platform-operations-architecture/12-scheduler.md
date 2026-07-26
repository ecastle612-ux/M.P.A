# 12 — Scheduler

**Package:** OPS-001  
**Status:** Draft — Awaiting Approval

---

## Purpose

Central **time service** for recurring and deferred platform work: reminder scans, nightly maintenance, report schedules, dunning hooks (invoked as jobs — BILL owns money policy), lease expiry materialization, health digests.

---

## Schedule types

| Type | Example |
|------|---------|
| Cron | `0 2 * * *` nightly maintenance |
| Interval | Every 5 minutes outbox dispatch (if not continuous worker) |
| One-shot | Run job at `run_at` |
| Org-local cron | “Every Monday 9am org timezone” |

---

## Schedule record

| Field | Description |
|-------|-------------|
| `schedule_id` | UUID |
| `organization_id` | Null = platform |
| `name` | Label |
| `cron` / `interval` / `run_at` | Timing |
| `timezone` | IANA |
| `job_type` | What to enqueue |
| `payload` | Template |
| `enabled` | Bool |
| `last_run_at` / `next_run_at` | Bookkeeping |

---

## Execution

```
Scheduler leader (single active)
  → due schedules
    → enqueue jobs (idempotent run id = schedule_id + window)
      → workers execute
```

Use leader election / lease to avoid double cron in multi-instance deploys.

---

## Platform schedules (seed)

| Schedule | Purpose |
|----------|---------|
| Outbox sweeper | Catch stuck pending |
| Reminder due scan | Fire reminders |
| Nightly maintenance | Aggregates, cleanup |
| Lease expiry materializer | Emit `lease.expiring` |
| Health digest | Staff alerts |
| Webhook retry sweep | Requeue eligible |

---

## Acceptance

| ID | Criterion |
|----|-----------|
| SC-01 | Cron/interval/one-shot/org-timezone supported |
| SC-02 | Enqueues jobs idempotently per window |
| SC-03 | Single-leader safe for multi-instance |
| SC-04 | Reminder + nightly + lease expiry schedules defined |
