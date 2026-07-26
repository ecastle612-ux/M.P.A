# 24 — Workflow Orchestration

**Package:** OPS-001  
**Amendment:** A04  
**Status:** Binding (Approved with Amendments)

---

## Purpose

Reusable **workflow templates** orchestrate multi-step processes across modules. The same orchestration engine powers Maintenance, Leasing, Inspections, Onboarding, and future domains — on top of the event bus (not instead of it).

---

## Example — Maintenance Request

```
Maintenance Request
  → Assign Vendor
  → Vendor Accepts
  → Schedule Visit
  → Technician Arrives
  → Repair Complete
  → Tenant Confirms
  → Invoice Generated
  → Owner Notified
```

Each arrow is an event-backed step with optional tasks, notifications, timers, and AI assists.

---

## Concepts

| Concept | Meaning |
|---------|---------|
| **WorkflowTemplate** | Versioned definition of steps + transitions |
| **WorkflowInstance** | Running case for one subject (e.g. one WO) |
| **Step** | Named state with entry/exit actions |
| **Transition** | Event or command that moves step → step |
| **Timer** | SLA / reminder bound to step |
| **Compensation** | Cancel/skip paths |

---

## Template sketch

```yaml
id: maintenance.standard.v1
trigger: maintenance.request.created
steps:
  - id: assign_vendor
  - id: vendor_accepted
  - id: schedule_visit
  - id: technician_arrived
  - id: repair_complete
  - id: tenant_confirmed
  - id: invoice_generated
  - id: owner_notified
transitions:
  - from: assign_vendor
    on: maintenance.vendor.assigned
    to: vendor_accepted  # wait accept...
```

(Exact DSL at Implement; semantics binding now.)

---

## Engine responsibilities

| Responsibility | Behavior |
|----------------|----------|
| Start instance | On trigger event |
| Advance | On catalog events / approved commands |
| Emit | Step entered/exited events for timeline |
| Create tasks | For human steps |
| Notify | Via Notification Center |
| Timers | Via Reminder/Scheduler |
| Priority | Via Priority Engine |
| AI | Optional step assist via Operations Director |

---

## Relationship to Automation Engine

| Layer | Role |
|-------|------|
| **Orchestration** | Long-running case state machine per subject |
| **Automation** | Stateless/reactive rules across many subjects |

Orchestration **uses** automation actions; automation must not fork a second lifecycle for the same WO.

---

## Module rule

Every future module that has a multi-step business process should register a workflow template rather than hardcoding a private state machine that bypasses OPS.

---

## Acceptance (A04)

| ID | Criterion |
|----|-----------|
| WO-01 | Reusable workflow templates defined |
| WO-02 | Maintenance example expressible end-to-end |
| WO-03 | Same engine usable by every module |
| WO-04 | Advances via events/commands; timeline-visible |
