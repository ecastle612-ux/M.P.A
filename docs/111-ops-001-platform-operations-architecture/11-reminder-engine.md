# 11 — Reminder Engine

**Package:** OPS-001  
**Status:** Draft — Awaiting Approval

---

## Purpose

Time-based and condition-based **nudges** that materialize as events, notifications, and/or tasks — distinct from one-shot automation on a domain event, though often chained.

---

## Reminder types

| Type | Example |
|------|---------|
| **Absolute** | At 2026-08-01 09:00 notify |
| **Relative** | Lease end − 60 days → `lease.expiring` |
| **Recurring** | Monthly rent reminder |
| **Snooze** | User snoozed inbox item → revisit |
| **Escalation** | If task open after due → escalate |

---

## Reminder record

| Field | Description |
|-------|-------------|
| `reminder_id` | UUID |
| `organization_id` | Tenant |
| `subject` | Entity ref |
| `fire_at` | Next run |
| `rrule` / cadence | Optional recurrence |
| `action` | emit event / notify / create task |
| `status` | `scheduled` / `fired` / `canceled` / `error` |
| `idempotency_key` | Prevent double fire |

---

## Flow

```
Scheduler tick / due scan
  → Reminder Engine due set
    → emit fact event (e.g. lease.expiring) OR notify/task directly
      → Automation may chain further
```

Prefer **emit event then automate** for observability on the timeline.

---

## Deduping

- Same `(subject, reminder_type, fire_at day)` fires once  
- Cancel on subject terminal state (lease ended, WO closed)  

---

## Acceptance

| ID | Criterion |
|----|-----------|
| RM-01 | Absolute, relative, recurring, snooze, escalation supported |
| RM-02 | Lease−60d style reminders expressible |
| RM-03 | Idempotent fire |
| RM-04 | Prefer event emission for timeline visibility |
