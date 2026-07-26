# 18 — Implementation Slices

**Package:** OPS-001  
**Amendment:** A09 (finalized slice board)  
**Status:** Binding (Approved with Amendments)  
**Implementation:** Slice A ✅ **VALIDATED** ([34](./34-slice-a-validation-rerun.md)) · Slice B ✅ **VALIDATED** ([37](./37-slice-b-validation.md)) · Slice C ✅ **VALIDATED** ([42](./42-slice-c-validation-rerun.md)) · Slice D ✅ **AUTHORIZED** ([43](./43-slice-d-authorization.md)) · Implement/Validate 🔒 · E 🔒 until explicitly authorized  
**Methodology:** Same gated pattern as AUTH-001 / COM-001 / PMX-004

---

## Gate per slice

```
Design → Authorize → Implementation → Validation
```

**No slice may begin until the prior slice is Validated** (default).

Phrases:

```
AUTHORIZE OPS-001 SLICE A
VALIDATE OPS-001 SLICE A
AUTHORIZE OPS-001 SLICE B
VALIDATE OPS-001 SLICE B
AUTHORIZE OPS-001 SLICE C
VALIDATE OPS-001 SLICE C
AUTHORIZE OPS-001 SLICE D
VALIDATE OPS-001 SLICE D
```

No OPS slice implementation is authorized until its explicit `AUTHORIZE OPS-001 SLICE …` phrase is recorded.

---

## Slice catalog (binding)

### Slice A — Event Bus + Activity Timeline

| Field | Content |
|-------|---------|
| **Scope** | Event Bus · Activity Timeline |
| **Includes** | Envelope, outbox, dispatcher, core catalog, timeline projector |
| **Depends on** | OPS-001 Approved with Amendments |
| **Validation** | Events dispatch; maintenance chain on timeline; lag metrics |

### Slice B — Notification Center + Reminder Engine + Scheduler

| Field | Content |
|-------|---------|
| **Scope** | Notification Center · Reminder Engine · Scheduler |
| **Includes** | Preferences, channel adapters hooks, smart reminder consolidation hooks, cron leader |
| **Depends on** | Slice A Validated |
| **Validation** | Preference-aware fan-out; reminders idempotent; scheduler single-leader |

### Slice C — Task Engine + Workflow Orchestration + Priority Engine

| Field | Content |
|-------|---------|
| **Scope** | Task Engine · Workflow Orchestration · Priority Engine |
| **Includes** | Tasks model, maintenance workflow template pilot, priority propagation |
| **Depends on** | Slice B Validated |
| **Validation** | Tasks ordered by priority; WO workflow advances on events |

### Slice D — AI Operations Director + Automation Engine + Operational Analytics

| Field | Content |
|-------|---------|
| **Scope** | AI Operations Director · Automation Engine · Operational Analytics |
| **Includes** | Director boundaries/gates, rule playbooks, KPI materialization |
| **Depends on** | Slice C Validated |
| **Validation** | Human gates enforced; lease/overdue automations; KPIs compute |

### Slice E — Unified Inbox + Universal Command Center + Global Search + Quick Actions

| Field | Content |
|-------|---------|
| **Scope** | Unified Inbox · Universal Command Center · Global Search · Quick Actions |
| **Includes** | Homepage composition per role, permission-aware search, context actions |
| **Depends on** | Slice D Validated |
| **Validation** | Role homes work; search fail-closed; inbox aggregates streams |

---

## Slice status board

| Slice | Design | Authorize | Implement | Validate |
|-------|--------|-----------|-----------|----------|
| A | ✔ | ✅ | ✅ ([31](./31-slice-a-implementation.md)) · remediations ✅ ([33](./33-slice-a-remediation.md)) | ✅ **PASS** ([34](./34-slice-a-validation-rerun.md)) · prior FAIL ([32](./32-slice-a-validation.md)) |
| B | ✔ | ✅ ([35](./35-slice-b-authorization.md)) | ✅ ([36](./36-slice-b-implementation.md)) | ✅ **PASS** ([37](./37-slice-b-validation.md)) |
| C | ✔ | ✅ ([38](./38-slice-c-authorization.md)) | ✅ ([39](./39-slice-c-implementation.md)) | ✅ **PASS** ([42](./42-slice-c-validation-rerun.md)) · prior FAIL ([40](./40-slice-c-validation.md)) |
| D | ✔ | ✅ ([43](./43-slice-d-authorization.md)) | 🔒 | 🔒 |
| E | ✔ | 🔒 | 🔒 | 🔒 |

---

## Acceptance (A09)

| ID | Criterion |
|----|-----------|
| SL-01 | Slices A–E match approved amendment structure |
| SL-02 | Design → Approval → Implementation → Validation per slice |
| SL-03 | No code without `AUTHORIZE OPS-001 SLICE …` |
