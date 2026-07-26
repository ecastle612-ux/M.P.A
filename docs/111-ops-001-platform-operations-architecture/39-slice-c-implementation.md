# 39 — OPS-001 Slice C Implementation Summary

**Package:** OPS-001  
**Slice:** C — Task Engine + Workflow Orchestration + Priority Engine  
**Authorization:** [38](./38-slice-c-authorization.md) · [CORE-003 §84](../113-core-003-implementation-master-plan/84-ops-001-slice-c-authorization.md)  
**Status:** ✅ **IMPLEMENTED** · ✅ **VALIDATED PASS** ([42](./42-slice-c-validation-rerun.md)) · prior FAIL ([40](./40-slice-c-validation.md)) preserved  
**Date:** 2026-07-26  
**Migration:** `ops001_slice_c_tasks_workflows_priority` · prod `20260726201214` ([41](./41-slice-c-remediation.md))

> Slices D–E **not** implemented. No AI Director, Automation productization, Operational Analytics, Unified Inbox, Command Center homepage, Global Search, or Quick Actions.  
> UX-012 Slices C–E · PMX-004 Phases 9–11 · FIN remaining · partner marketplace UI **not** touched.  
> FAC-002 product surfaces **not** redesigned — maintenance workflow pilot only.  
> AUTH-001 · COM-001 · OPS-001 Slices A–B behaviors preserved.

---

## 1. Deliverables completed

| Area | Result |
|------|--------|
| Task Engine | `ops_tasks` + create (idempotent) / transition / list-by-priority; emits `ops.task.*` |
| Priority Engine | Critical → High → Medium → Low; safety → Critical; WO map; inheritance `max`; notify urgency hooks |
| Workflow Orchestration | Templates + instances + step events; dispatcher consumer `workflow_orchestrator` |
| Maintenance pilot | `maintenance.standard.v1` — assign → accept → on_site → complete |
| Vendor / WO hooks | Catalog map + `recordMaintenanceActivityWithOutbox`; vendor-jobs accept/decline/start/complete on bus |
| Org isolation | RLS + org-scoped queries / idempotency keys |
| Retry-safe | `(organization_id, idempotency_key)` on tasks; consumer receipts; step-event upsert |
| API (no UI) | `GET/POST/PATCH /api/ops/tasks` — priority-ordered list + create + transition |
| Tests | `priority-engine` · `workflow-engine` · catalog vendor_job_* maps |

---

## 2. Files changed

### Schema

| Path | Change |
|------|--------|
| `supabase/migrations/20260726190000_ops001_slice_c_tasks_workflows_priority.sql` | **Added** — `ops_tasks`, `ops_workflow_templates`, `ops_workflow_instances`, `ops_workflow_step_events`, RLS, seed `maintenance.standard.v1` |

### Lib (OPS)

| Path | Change |
|------|--------|
| `apps/web/src/lib/ops/priority-engine.ts` | **Added** — scale, safety, WO map, resolve, ordering |
| `apps/web/src/lib/ops/priority-engine.test.ts` | **Added** |
| `apps/web/src/lib/ops/task-engine.ts` | **Added** — lifecycle + transitions + list by priority |
| `apps/web/src/lib/ops/workflows/maintenance-standard.ts` | **Added** — pilot definition |
| `apps/web/src/lib/ops/workflow-engine.ts` | **Added** — start/advance + Slice B reminder hooks |
| `apps/web/src/lib/ops/workflow-engine.test.ts` | **Added** |
| `apps/web/src/lib/ops/catalog.ts` | Slice C `ops.task.*` / `ops.workflow.*`; vendor_job_accepted/declined maps |
| `apps/web/src/lib/ops/catalog.test.ts` | Vendor job catalog maps |
| `apps/web/src/lib/ops/dispatcher.ts` | Registers workflow orchestrator consumer |
| `apps/web/src/lib/ops/index.ts` | Barrel exports |

### Integrations / API

| Path | Change |
|------|--------|
| `apps/web/src/lib/vendor-jobs/server.ts` | Activity → outbox when catalog-mapped (workflow advance) |
| `apps/web/src/app/api/ops/tasks/route.ts` | **Added** — list / create / transition (no Command Center UI) |

### Docs

| Path | Change |
|------|--------|
| `docs/111-ops-001-…/39-slice-c-implementation.md` | **Added** — this summary |
| `docs/111-ops-001-…/02-event-catalog.md` | Slice C event types |
| `docs/111-ops-001-…/18-implementation-slices.md` | Slice C Implement ✅ |
| `docs/111-ops-001-…/38-slice-c-authorization.md` | Implementation status |
| `docs/111-ops-001-…/README.md` | Board status |
| `docs/113-core-003-…/84-ops-001-slice-c-authorization.md` | Implementation status |
| `docs/113-core-003-…/README.md` · `05-…` | Next action → validate |

---

## 3. Task Engine architecture

```
createOpsTask (idempotency_key)
  → resolveOpsPriority (domain + safety + inheritance)
  → insert ops_tasks (org-scoped)
  → emit ops.task.created (Slice A bus)

transitionOpsTask (status machine)
  → update ops_tasks
  → emit ops.task.updated | ops.task.completed | ops.task.canceled

listOpsTasksByPriority
  → Critical > High > Medium > Low, then due_at
```

Statuses: `open` → `in_progress` → `blocked` | `done` | `canceled` (approved transitions only).

---

## 4. Workflow orchestration

```
maintenance.request.created
  → start maintenance.standard.v1 instance
  → create start task + ops.workflow.started / step.entered
  → optional Slice B reminder

maintenance.vendor.assigned | accepted | declined | technician.arrived | work.completed
  → advance instance (consumer receipt = retry-safe)
  → step exit/enter + tasks + ops.workflow.* facts
  → terminal → ops.workflow.completed; cancel subject reminders
```

Pilot steps: `assign_vendor` → `vendor_accepted` → `on_site` → `repair_complete`.

---

## 5. Priority Engine

| Rule | Behavior |
|------|----------|
| Scale | `critical` · `high` · `medium` · `low` |
| Safety text / emergency | Forces `critical` |
| WO domain | `emergency`→critical · `high`→high · `medium`→medium · `low`→low |
| Inheritance | `max(resolved, inherited)` |
| Notify (Slice B) | critical→emergency · high→high · medium→normal · low→low |

---

## 6. Event hook integration

| Source | Path |
|--------|------|
| Maintenance server | Existing `recordMaintenanceActivityWithOutbox` (WO create / staff activity) |
| Vendor secure link | `vendor-jobs` → catalog map → same-TX outbox → dispatcher → workflow |
| Task / workflow facts | Nested `emitOpsDomainEvent` → TimelineProjector + Notification Center + workflow (skips non-WO subjects) |

No parallel bus. No FAC schema redesign.

---

## 7. Event catalog additions (Slice C)

| Event | When |
|-------|------|
| `ops.task.created` | Task created |
| `ops.task.updated` | Non-terminal status change |
| `ops.task.completed` | Status `done` |
| `ops.task.canceled` | Status `canceled` |
| `ops.workflow.started` | Instance started |
| `ops.workflow.step.entered` | Step entered |
| `ops.workflow.step.exited` | Step exited |
| `ops.workflow.completed` | Terminal pilot step |

Payloads: ids · status · priority · subject refs · step ids only.

---

## 8. Remaining OPS work (locked)

| Slice | Scope | Status |
|-------|-------|--------|
| **D** | AI Operations Director · Automation · Operational Analytics | 🔒 until `AUTHORIZE OPS-001 SLICE D` |
| **E** | Unified Inbox · Command Center · Global Search · Quick Actions | 🔒 until `AUTHORIZE OPS-001 SLICE E` |

---

## 9. Acceptance mapping (implementation intent)

| ID | Implementation note |
|----|---------------------|
| OC-01 | `ops_tasks` columns match Task Engine model |
| OC-02 | create + complete emit `ops.task.*` on Slice A bus; API manual create |
| OC-03 | `resolveOpsPriority` + safety → critical |
| OC-04 | Priority on tasks; `opsPriorityToNotifyPriority` + workflow reminders |
| OC-05 | `listOpsTasksByPriority` + `GET /api/ops/tasks` |
| OC-06 | `maintenance.standard.v1` template + instances |
| OC-07 | Dispatcher consumer advances on catalog WO events |
| OC-08 | Timeline via same projector; no parallel bus |
| OC-09 | Org RLS + org filters; secret-free payloads |
| OC-10 | This summary; D–E / UX-C–E / PMX-9–11 / FIN / marketplace / FAC redesign not shipped |

---

## 10. Recommendation

| Field | Result |
|-------|--------|
| **Implementation complete?** | ✅ **YES** (code + migration file) |
| **Validation?** | ✅ **PASS** · [42](./42-slice-c-validation-rerun.md) |
| **Begin Slice D?** | ❌ **NO** · recommend `AUTHORIZE OPS-001 SLICE D` separately |

```
VALIDATE OPS-001 SLICE C   ← re-run PASS ([42](./42-slice-c-validation-rerun.md))
AUTHORIZE OPS-001 SLICE D  ← eligible · not issued
```
