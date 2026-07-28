# 02 — Event Catalog

**Package:** OPS-001  
**Status:** Draft — Awaiting Approval

---

## Naming

```
{domain}.{entity}.{verb}
```

Examples: `maintenance.request.created`, `billing.payment.failed`, `auth.user.invited`.

Verbs prefer past tense for facts (`created`, `signed`, `completed`).

---

## Catalog (v1 core)

### Tenancy / property

| `event_type` | When |
|--------------|------|
| `property.created` | Property created |
| `property.archived` | Property archived |
| `unit.created` | Unit created |
| `tenant.created` | Tenant record created |
| `tenant.invited` | Tenant user invited |

### Lease / occupancy

| `event_type` | When |
|--------------|------|
| `lease.created` | Lease created |
| `lease.signed` | Lease fully signed |
| `lease.activated` | Lease active |
| `lease.expiring` | Reminder engine / scheduler fact (N days) |
| `lease.renewed` | Renewal completed |
| `lease.ended` | Move-out / end |

### Maintenance / vendors

| `event_type` | When |
|--------------|------|
| `maintenance.request.created` | WO / request opened |
| `maintenance.vendor.assigned` | Vendor assigned |
| `maintenance.vendor.accepted` | Vendor accepted |
| `maintenance.vendor.declined` | Vendor declined |
| `maintenance.technician.arrived` | Check-in / arrived |
| `maintenance.work.completed` | Work completed |
| `maintenance.overdue` | SLA breach detected |

### Payments / billing (facts, not card data)

| `event_type` | When |
|--------------|------|
| `billing.payment.received` | Resident/SaaS payment success (typed in payload) |
| `billing.payment.failed` | Payment failed |
| `billing.invoice.past_due` | Past due entered |
| `saas.subscription.renewed` | SaaS renewed (COM/BILL) |
| `saas.organization.activated` | Org Active |
| `saas.organization.suspended` | Org suspended |

### Documents / inspections / messages

| `event_type` | When |
|--------------|------|
| `document.uploaded` | Document stored |
| `inspection.completed` | Inspection done |
| `inspection.media.uploaded` | Photos/docs attached |
| `message.sent` | Thread message sent |
| `announcement.published` | Announcement live |

### Identity / access (no secrets)

| `event_type` | When |
|--------------|------|
| `auth.user.invited` | Invite issued |
| `auth.user.disabled` | User disabled |
| `auth.password.reset_issued` | Reset issued (metadata only) |
| `auth.organization.provisioned` | Org + Org Admin provisioned |

### Commercial (COM-001 Slice A / B / C / D / E)

| `event_type` | When |
|--------------|------|
| `commercial.opportunity.created` | Opportunity record created |
| `commercial.opportunity.stage_changed` | Pipeline stage changed (incl. org link) |
| `commercial.activation.requested` | Activation handoff recorded (pre-AUTH) |
| `commercial.activation.completed` | AUTH provision + org↔opportunity link done |
| `commercial.activation.failed` | Activation / AUTH handoff failed |
| `commercial.implementation.score_updated` | Implementation score / highest milestone changed |
| `commercial.implementation.milestone_updated` | Milestone waived / deferred / solo-ack |
| `commercial.trial.status_changed` | Trial lifecycle status transition |
| `commercial.trial.reminder_due` | Reminder hook due (day0/3/7/t3/t1/expiry/grace) |
| `commercial.trial.convert_started` | Trial convert started via BILL-001 portal |
| `commercial.health.score_updated` | Health score / band changed |
| `commercial.discovery.impressed` | Feature discovery impressed |
| `commercial.discovery.accepted` | Feature discovery accepted |
| `commercial.discovery.dismissed` | Feature discovery dismissed |
| `commercial.discovery.snoozed` | Feature discovery snoozed |
| `commercial.timeline.entry_appended` | Commercial communication timeline entry appended |
| `commercial.offboarding.stage_changed` | Offboarding stage transition |
| `commercial.offboarding.export_ready` | Export inventory / window ready |
| `commercial.offboarding.frozen` | Organization frozen (mutations blocked) |
| `commercial.offboarding.archived` | Organization archived (purge still gated) |
| `commercial.offboarding.recovered` | Win-back same-org restore |
| `commercial.cs_motion.scheduled` | CS 30/90 motions scheduled |
| `commercial.cs_motion.due` | CS motion due (idempotent emit) |
| `commercial.cs_motion.completed` | CS motion completed or skipped |
| `commercial.renewal.alert_due` | Renewal milestone due (T-90…T-7) |
| `commercial.dashboard.opened` | Staff commercial dashboard opened (Slice E) |
| `commercial.engagement.created` | Marketplace engagement created (Slice E prep) |
| `commercial.engagement.status_changed` | Marketplace engagement status changed |

Payloads are **secret-free** (ids, stage, score, band, discovery keys, trial status, motion/milestone keys, engagement path/provider/status, aggregate counts, reason codes only). No credentials or payment secrets.

### AI / ops system

| `event_type` | When |
|--------------|------|
| `ai.recommendation.generated` | AI produced suggestion |
| `ai.summary.generated` | AI summary created |
| `ops.job.failed` | Background job failed |
| `ops.notification.queued` | Notification Center accepted a fan-out request (Slice B) |
| `ops.notification.delivered` | Notification Center completed preference-aware delivery (Slice B) |
| `ops.notification.failed` | Channel delivery failed |
| `ops.reminder.scheduled` | Reminder Engine scheduled a reminder (Slice B) |
| `ops.reminder.fired` | Reminder Engine fired a reminder (Slice B) |
| `ops.reminder.canceled` | Reminder canceled on subject terminal state (Slice B) |
| `ops.schedule.run_started` | Scheduler run started for an org-scoped schedule (Slice B) |
| `ops.schedule.run_completed` | Scheduler run completed (Slice B) |
| `ops.schedule.run_failed` | Scheduler run failed (Slice B) |
| `ops.task.created` | Task Engine created a task (Slice C) |
| `ops.task.updated` | Task status/fields updated (Slice C) |
| `ops.task.completed` | Task completed (Slice C) |
| `ops.task.canceled` | Task canceled (Slice C) |
| `ops.workflow.started` | Workflow instance started (Slice C) |
| `ops.workflow.step.entered` | Workflow step entered (Slice C) |
| `ops.workflow.step.exited` | Workflow step exited (Slice C) |
| `ops.workflow.completed` | Workflow instance completed (Slice C) |
| `ai.recommendation.generated` | AI Operations Director created a recommendation (Slice D) |
| `ai.recommendation.applied` | Human-approved recommendation applied (Slice D) |
| `ai.recommendation.rejected` | Recommendation rejected (Slice D) |
| `ops.automation.fired` | Automation rule fired or gated (Slice D) |
| `ops.automation.failed` | Automation rule fire failed (Slice D) |
| `ops.kpi.materialized` | Operational KPI window materialized (Slice D) |
| `ops.quick_action.invoked` | Global Quick Action invoked (Slice E) |
| `ops.inbox.opened` | Unified Inbox opened (Slice E) |
| `ops.search.performed` | Global Search performed (Slice E; secret-free — no query text) |
| `ops.webhook.failed` | Outbound/inbound webhook failed |

---

## Payload sketches (illustrative)

### `maintenance.request.created`

```json
{
  "work_order_id": "…",
  "property_id": "…",
  "unit_id": "…",
  "priority": "normal",
  "category": "plumbing",
  "source": "tenant_portal"
}
```

### `lease.signed`

```json
{
  "lease_id": "…",
  "property_id": "…",
  "unit_id": "…",
  "tenant_ids": ["…"],
  "start_date": "2026-08-01",
  "end_date": "2027-07-31"
}
```

### `billing.payment.failed`

```json
{
  "rail": "resident" | "saas",
  "invoice_id": "…",
  "amount_cents": 0,
  "currency": "usd",
  "failure_code": "card_declined"
}
```

---

## Versioning

- Additive fields: same `event_version` if backward compatible  
- Breaking changes: bump `event_version`; dual-publish window if needed  
- Catalog changes require OPS-001 amend or domain package Approve citing OPS  

---

## Extension rule

New domain features **must** register events here (or a linked domain catalog appendix approved under OPS) before shipping notify/automate behavior.

---

## Acceptance

| ID | Criterion |
|----|-----------|
| EC-01 | Core catalog covers user-listed domains |
| EC-02 | Naming + versioning rules explicit |
| EC-03 | Payloads exclude secrets |
| EC-04 | Extension requires catalog registration |
