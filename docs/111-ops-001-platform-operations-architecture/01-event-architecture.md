# 01 — Event Architecture

**Package:** OPS-001  
**Status:** Draft — Awaiting Approval  
**Foundation:** [ADR-005](../18-decision-log/adr-005-domain-events.md)

---

## Binding rule

```
Domain mutation (authorized)
  → write business data + outbox event (same transaction)
  → OPS dispatcher publishes
  → consumers: Timeline · Notifications · Automation · Tasks · Reminders · AI · Jobs · Audit projection
```

Domain modules **must not** call notification SDKs, AI providers, or other domains’ mutation APIs as a substitute for events (except synchronous reads required for the mutation itself).

---

## Event envelope (standard)

| Field | Required | Description |
|-------|----------|-------------|
| `event_id` | ✔ | UUID (idempotency key for producers) |
| `event_type` | ✔ | Catalog key e.g. `maintenance.request.created` |
| `event_version` | ✔ | Integer schema version |
| `occurred_at` | ✔ | UTC timestamp of business fact |
| `organization_id` | ✔ | Tenant scope (except pure platform control-plane events) |
| `actor` | ✔ | `{ principal_id?, actor_type, impersonation_id? }` |
| `subject` | ✔ | `{ type, id }` primary entity |
| `correlation_id` | ✔ | Request / workflow correlation |
| `causation_id` | Optional | Parent event id |
| `payload` | ✔ | Versioned JSON (no secrets) |
| `visibility` | ✔ | `ops` / `tenant` / `staff_only` |
| `sensitivity` | ✔ | `normal` / `restricted` / `privileged` |

**Forbidden in payload:** passwords, temp credentials, raw payment card data, MFA secrets.

---

## Planes

| Plane | Examples | Consumers |
|-------|----------|-----------|
| **Tenant ops** | Maintenance, lease, payments (tenant-facing facts) | Timeline, inbox, automations |
| **Commercial** | Subscription renewed, org suspended | COM timeline + OPS |
| **Identity** | User invited, password reset (no secrets) | AUTH audit + OPS |
| **Platform** | Job failed, webhook failed | System health (staff) |

---

## Outbox pattern

1. Edge Function / service writes domain row(s)  
2. Same TX inserts `ops_outbox` (or `event_domain_events`) row `pending`  
3. Dispatcher claims batch, publishes to consumers  
4. Marks `processed` / `failed` with attempts  
5. Poison messages → DLQ ([14](./14-failure-recovery.md))  

**Delivery:** at-least-once. **Consumers:** idempotent on `event_id` + consumer name.

---

## Ordering & concurrency

| Rule | Design |
|------|--------|
| Per-aggregate ordering | Best-effort via `(organization_id, subject)` sequence or `occurred_at` + tie-breaker |
| Cross-aggregate | No global total order required |
| Clock skew | Prefer server `occurred_at` at write time |

---

## Emitters vs consumers

| Role | Responsibility |
|------|----------------|
| **Emitter** | Domain service that owns the mutation |
| **Dispatcher** | OPS outbox worker |
| **Consumer** | Timeline projector, Notification Center, Automation Engine, Task Engine, Reminder Engine, AI Trigger Router, Job enqueuer, Health |

Consumers register interest by `event_type` (+ optional filters).

---

## Multi-org / platform events

Control-plane events (Master Admin) may omit tenant UX projection but still enter staff health/audit streams. Never fan tenant data across organizations.

---

## Acceptance

| ID | Criterion |
|----|-----------|
| EV-01 | Standard envelope defined |
| EV-02 | Outbox + at-least-once + idempotent consumers |
| EV-03 | No secrets in payloads |
| EV-04 | Domain modules do not bypass bus for notify/automate |
