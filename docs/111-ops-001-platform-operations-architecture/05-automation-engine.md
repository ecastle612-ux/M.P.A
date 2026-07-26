# 05 — Automation Engine

**Package:** OPS-001  
**Status:** Draft — Awaiting Approval  
**Related:** [AUT roadmap](../31-product-requirements/automation-roadmap.md) · ADR-006 AI

---

## Purpose

Declarative **if-this-then-that** (and scheduled) automations that subscribe to OPS events and/or scheduler ticks — creating notifications, tasks, escalations, and AI draft requests without hardcoding every cross-workflow call.

---

## Rule model

| Field | Description |
|-------|-------------|
| `rule_id` | UUID |
| `organization_id` | Tenant (or `platform` template cloned per org) |
| `name` | Human label |
| `trigger` | `event_type` match and/or schedule |
| `conditions` | JSON predicate on payload / context |
| `actions[]` | Ordered action list |
| `enabled` | Bool |
| `human_gate` | Optional require confirm before mutating actions |
| `priority` | Execution order among matches |

---

## Example A — Lease expiry

```
Trigger: lease.expiring (60 days)  [from Reminder/Scheduler]
Actions:
  1. notify.manager
  2. task.create (Generate renewal)
  3. notify.tenant
  4. ai.draft (renewal email) → human review
```

## Example B — Maintenance overdue

```
Trigger: maintenance.overdue
Actions:
  1. maintenance.priority.escalate
  2. notify.supervisor
  3. notify.owner (if entitled + policy)
  4. task.create (Follow-up)
```

---

## Action types (v1)

| Action | Effect |
|--------|--------|
| `notify` | Notification Center |
| `task.create` | Task Engine |
| `task.assign` | Reassign |
| `reminder.schedule` | Reminder Engine |
| `ai.request` | AI Trigger Router (draft/classify/recommend) |
| `job.enqueue` | Background job |
| `event.emit` | Emit follow-on fact event (careful loops) |
| `webhook.outbound` | Future integration hook |

Mutating domain actions (escalate priority) go through domain services, not raw SQL — automation calls approved command APIs.

---

## Safety

| Rule | Design |
|------|--------|
| Org scope | Always |
| Loop protection | Max depth / emit budget per correlation_id |
| Idempotency | `(rule_id, event_id)` |
| Human gate | Required for money-moving / bulk-resident blasts |
| Entitlements | Actions respect plan modules |
| Audit | Every rule fire logged |

---

## Authoring

| Phase | Capability |
|-------|------------|
| MVP | Platform + seeded org templates; limited org toggles |
| Later | Visual rule builder (AUT-E01) under separate Approve |

---

## Acceptance

| ID | Criterion |
|----|-----------|
| AU-01 | Event + schedule triggers supported |
| AU-02 | Lease expiry + maintenance overdue examples expressible |
| AU-03 | Loop protection + idempotency |
| AU-04 | AI drafts are human-gated by default for outbound email |
