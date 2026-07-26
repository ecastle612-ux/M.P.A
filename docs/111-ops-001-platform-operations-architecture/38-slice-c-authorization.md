# 38 — OPS-001 Slice C Authorization

**Package:** OPS-001 — Platform Operations Architecture  
**Slice:** **C — Task Engine + Workflow Orchestration + Priority Engine**  
**Status:** ✅ **AUTHORIZED** · ✅ **IMPLEMENTED** ([39](./39-slice-c-implementation.md)) · ✅ **VALIDATED PASS** ([42](./42-slice-c-validation-rerun.md)) · prior FAIL ([40](./40-slice-c-validation.md)) preserved  
**Authorization date:** 2026-07-26  
**Binding phrase (issued):**

```
AUTHORIZE OPS-001 SLICE C
```

**Validation phrase (to be issued after implementation):**

```
VALIDATE OPS-001 SLICE C
```

**Program record:** [CORE-003 §84](../113-core-003-implementation-master-plan/84-ops-001-slice-c-authorization.md)  
**Prior slice:** [37 — Slice B Validation](./37-slice-b-validation.md) · ✅ **PASS**  
**Slice catalog:** [18 — Implementation slices](./18-implementation-slices.md)  
**Package approval:** [29 — Approval record](./29-approval-record.md) · ✅ APPROVED WITH AMENDMENTS  
**ADR:** [ADR-028](../18-decision-log/adr-028-platform-operations-backbone.md) · [ADR-005](../18-decision-log/adr-005-domain-events.md)  
**Design SoT:** [06 — Task Engine](./06-task-engine.md) · [23 — Operational Priority Engine](./23-operational-priority-engine.md) · [24 — Workflow Orchestration](./24-workflow-orchestration.md) · [02 — Event catalog](./02-event-catalog.md) · [01 — Event architecture](./01-event-architecture.md) · [04 — Activity Timeline](./04-activity-timeline.md) · [18](./18-implementation-slices.md) Slice C  
**OPS foundation:** Slice A ✅ **VALIDATED** · Slice B ✅ **VALIDATED** (reuse; do not fork)  
**UX foundation (any UI):** UX-012 Slice A ✅ **VALIDATED** — `--mpa-*` tokens only  
**Program order:** CORE-003 **M3.3** ([05](../113-core-003-implementation-master-plan/05-master-implementation-order.md)) — **next authorized OPS work item** after OPS-B Validated

> Phrase **`AUTHORIZE OPS-001 SLICE C` issued**. Implementation may begin **only** within the scope below, in a **dedicated implementation session**.  
> OPS-001 Slices D–E · UX-012 Slices C–E · PMX-004 Phases 9–11 · FIN-003 remaining phases · certified partner marketplace UI remain **locked**.  
> Do **not** begin implementation under this authorize phrase in the same session as authorization.  
> Do **not** redesign FAC-002 Facility Operations product surfaces under this phrase.

---

## 1. Prerequisite verification

| Prerequisite | Evidence | Status |
|--------------|----------|--------|
| OPS-001 Approved with Amendments | [29](./29-approval-record.md) · A01–A09 | ✅ |
| ADR-028 Accepted | [ADR-028](../18-decision-log/adr-028-platform-operations-backbone.md) | ✅ |
| ADR-005 Domain Events Accepted | [ADR-005](../18-decision-log/adr-005-domain-events.md) | ✅ |
| Implementation slices finalized | [18](./18-implementation-slices.md) | ✅ |
| Slice C design SoT | [06](./06-task-engine.md) · [23](./23-operational-priority-engine.md) · [24](./24-workflow-orchestration.md) | ✅ |
| M0 = GO | [CORE-003 §36](../113-core-003-implementation-master-plan/36-final-m0-governance-review.md) · **GO** | ✅ |
| OPS-001 Slice A Validated | [34](./34-slice-a-validation-rerun.md) · **PASS** | ✅ |
| OPS-001 Slice B Validated | [37](./37-slice-b-validation.md) · **PASS** · [CORE-003 §58](../113-core-003-implementation-master-plan/58-ops-001-slice-b-validation.md) | ✅ |
| AUTH-001 Slices A–E COMPLETE | [AUTH-001 §49](../109-auth-001-organization-provisioning-authentication/49-slice-e-validation.md) · **PASS** | ✅ |
| COM-001 Slices A–E COMPLETE | [COM-001 §42](../110-com-001-customer-lifecycle-commercial-operations/42-slice-e-validation.md) · **PASS** | ✅ |
| UX-012 Slices A–B PASS | [UX-012 §32](../112-ux-012-platform-experience-design-system/32-slice-a-validation.md) · [UX-012 §35](../112-ux-012-platform-experience-design-system/35-slice-b-validation.md) | ✅ |
| PMX-004 Phases 1–8 PASS | Phase 8 ✅ [PMX-004 §43](../106-pmx-004-native-pwa-parity/43-phase-8-validation.md) · [CORE-003 §83](../113-core-003-implementation-master-plan/83-pmx-004-phase-8-validation.md); Phases 2–7 Validated; Phase 6 R1 closed via re-run #3 | ✅ |
| CORE-003 M3.3 dependency (OPS-B Validated) | [05](../113-core-003-implementation-master-plan/05-master-implementation-order.md) | ✅ |
| Next OPS authorize unit = Slice C | [18](./18-implementation-slices.md) · inventory · M3.3 | ✅ |
| No unfinished Authorized OPS slice blocking this phrase | OPS-B Validated · no open OPS authorize ahead of C | ✅ |
| OPS-001 Slice D–E | Not authorized | ✅ (correct — excluded) |
| UX-012 Slices C–E | Not authorized | ✅ (correct — excluded) |
| PMX-004 Phases 9–11 | Locked | ✅ (excluded) |
| FIN-003 remaining phases | Locked | ✅ (excluded) |
| Certified partner marketplace UI | Locked | ✅ (excluded) |
| Explicit authorize phrase recorded | **This document** | ✅ |

**Governance blockers remaining for Slice C?** ❌ **None.**

**Order note:** CORE-003 places OPS-001 Slice C at **M3.3** (depends on OPS-B Validated). This phrase authorizes **OPS-001 Slice C (M3.3)** only. Peer units (PMX Phase 9, UX-012 C, etc.) remain separately gated and are **not** authorized here. FAC-002 Facility Operations V1.0 is a **separate package** already ✅ **COMPLETE** — not an OPS-C deliverable.

---

## 2. Authorization scope

### Binding Slice C definition ([18](./18-implementation-slices.md))

| Field | Content |
|-------|---------|
| **Scope** | Task Engine · Workflow Orchestration · Priority Engine |
| **Includes** | Tasks model · maintenance workflow template pilot · priority propagation |
| **Depends on** | Slice B Validated |
| **Validation intent** | Tasks ordered by priority; WO workflow advances on events |

### In scope (Slice C)

| Deliverable | Binding source |
|-------------|----------------|
| **Task Engine** — first-class task model (org-scoped): title, description, priority, due, owner, followers, status, dependencies, subject, deep_link, source_event | [06](./06-task-engine.md) |
| **Task creation** — from domain/events (and hooks usable later by Automation); manual create allowed where designed | [06](./06-task-engine.md) |
| **Task completion** — emits secret-free `ops.task.completed` (or catalog equivalent) on Slice A Event Bus | [06](./06-task-engine.md) · [02](./02-event-catalog.md) |
| **Priority Engine** — single operational scale **Critical → High → Medium → Low**; safety/emergency forces Critical; propagates to tasks (+ notify urgency hooks via Slice B) | [23](./23-operational-priority-engine.md) |
| **Task ordering** — tasks queryable/orderable by priority for consumers (inbox/CC later; API/query minimum for Slice C) | [23](./23-operational-priority-engine.md) · [18](./18-implementation-slices.md) |
| **Workflow Orchestration** — versioned templates + instances + steps/transitions; advance on catalog events/approved commands | [24](./24-workflow-orchestration.md) |
| **Maintenance workflow pilot** — `maintenance.standard` (or equivalent) template; create tasks / notify via B / timers via B reminders as designed | [24](./24-workflow-orchestration.md) · [18](./18-implementation-slices.md) |
| **Timeline integration** — step enter/exit and material task/workflow facts via Slice A projector; **no parallel bus** | [01](./01-event-architecture.md) · [04](./04-activity-timeline.md) |
| **Organization-safe** — tasks / workflows / priority resolution are org-scoped | Package-wide |
| **Secret-free OPS events** — ids / status / priority / subject refs only | [01](./01-event-architecture.md) |
| **UX-012 Slice A tokens** on any approved UI (`--mpa-*`) | UX-012 Slice A |
| **Docs + OC-01…OC-10 evidence** | This authorize · implement · validate trail |

### Implementation boundaries

1. Work is limited to **Task Engine + Workflow Orchestration + Priority Engine** — not AI Director, Automation productization, Operational Analytics/KPI materialization, Unified Inbox, Command Center homepage, Global Search, or Quick Actions.  
2. **Preserve OPS-001 Slices A–B** — Event Bus, Timeline, Notification Center, Reminder Engine, Scheduler semantics unchanged; Slice C **consumes** them.  
3. **Maintenance workflow template is a pilot** — do not redesign FAC-002 work-order UI, technician dashboard, inventory, assets, inspections product surfaces, or Vendor Directory under this phrase.  
4. Workflow may **create tasks**, **advance on vendor/WO catalog events**, and **notify/remind via Slice B** — that is integration, not a new Facility product module.  
5. Unified Inbox surfacing of tasks is **Slice E** — Slice C must make tasks available to later consumers, not ship the full inbox product.  
6. Any **UI** must use UX-012 Slice A tokens only — no UX-012 C–E role chrome / Command Center productization.  
7. OPS event payloads remain **secret-free**.  
8. Material scope beyond Slice C requires a new authorize phrase (`AUTHORIZE OPS-001 SLICE …` / other packages).

---

## 3. Facility Operations capability allocation (explicit)

OPS-001 Slice C is the **platform backbone** for tasks, workflow orchestration, and priority — **not** the Facility Operations product package. FAC-002 Facility Operations V1.0 is already ✅ **COMPLETE** ([FAC-002 README](../114-fac-002-facility-operations-v1/README.md)).

| Capability | Slice C | Slice D | Slice E | Notes |
|------------|---------|---------|---------|-------|
| Facility Operations dashboard | ❌ Not OPS-C | ❌ | ❌ (CC home later) | FAC-002 technician / facility hub already shipped |
| Work order operations (product UI) | ❌ Not OPS-C | ❌ | ❌ | FAC-002 / existing maintenance surfaces preserved |
| Work order **workflow orchestration pilot** | ✅ **Included** | — | — | `maintenance.standard` template + event advancement ([24](./24-workflow-orchestration.md)) |
| Asset management | ❌ Not OPS-C | ❌ | ❌ | FAC-002 |
| Preventive maintenance | ❌ Not OPS-C | ❌ | ❌ | FAC-002 |
| Inventory management | ❌ Not OPS-C | ❌ | ❌ | FAC-002 |
| Inspections (product UI) | ❌ Not OPS-C | ❌ | ❌ | FAC-002; additional inspection templates beyond pilot are post-C |
| Vendor Directory (product) | ❌ Not OPS-C | ❌ | ❌ | Internal Directory preserved; Vendor Portal retired |
| Vendor / WO **event → workflow/task hooks** | ✅ **Included** (integration) | — | — | Consume catalog events; do not rebuild Directory |
| Receipts & expenses | ❌ Not OPS-C | ❌ | ❌ | Existing FIN / vendor invoice planes |
| Scheduling (calendar product UI) | ❌ Not OPS-C | ❌ | ❌ | FAC-002 calendar; Slice C may bind **timers** via Slice B |
| Reporting (facility reports UI) | ❌ Not OPS-C | ❌ | ❌ | FAC-002 reports |
| Calendar | ❌ Not OPS-C | ❌ | ❌ | FAC-002 |
| Operational KPIs | ❌ | ✅ **Deferred D** | — | Operational Analytics ([28](./28-operational-analytics.md)) |
| Team workload views | ❌ | ✅ **Deferred D** (signals) | ✅ **Deferred E** (CC composition) | Not Slice C |
| Dispatch product surface | ❌ Not OPS-C | ❌ | ❌ | Assign/dispatch as **workflow steps + tasks** only in C |
| Mobile technician workflow | ❌ Not OPS-C | ❌ | ❌ | FAC-002 technician dashboard + PMX PWA; not OPS-C |

**Summary:** Slice C includes the **maintenance workflow pilot** and **task/priority substrate** that Facility (and all modules) will consume. It does **not** re-open FAC-002 product scope.

---

## 4. Excluded functionality (explicit)

| Excluded | Remains |
|----------|---------|
| OPS-001 Slice D — AI Operations Director · Automation Engine · Operational Analytics / KPIs | Separate authorize |
| OPS-001 Slice E — Unified Inbox · Command Center · Global Search · Quick Actions | Separate authorize |
| UX-012 Slices C–E | Separate authorize |
| PMX-004 Phases 9–11 | Separate authorize |
| FIN-003 remaining phases | Separate authorize |
| Certified partner marketplace UI | Separate authorize |
| FAC-002 redesign / new Facility module work under OPS-C | Forbidden — FAC-002 COMPLETE |
| Parallel domain event buses | Forbidden ([17](./17-acceptance-criteria.md)) |
| Full lease-expiry / overdue-maintenance **automation productization** | Slice D |
| Full inspection / leasing / onboarding workflow catalog beyond maintenance pilot | Later authorize / templates after C Validated |
| Redesign of Slice A bus / timeline or Slice B notify/reminder/scheduler | Preserve; extend consumers only |

---

## 5. Dependencies

| Dependency | Role |
|------------|------|
| OPS-001 Approved with Amendments · ADR-028 | Operational architecture SoT |
| OPS-001 Slice A Validated | Event Bus + Activity Timeline substrate |
| OPS-001 Slice B Validated | Notification Center · Reminder Engine · Scheduler (notify / timers) |
| ADR-005 Domain Events | Outbox / event foundation |
| CORE-003 M0 = GO · M3.3 order | Program unlock / sequence slot |
| UX-012 Slice A Validated | Design-token foundation for any task/workflow UI |
| Existing maintenance / vendor catalog events | Triggers for maintenance workflow pilot |
| Existing Postgres / app runtime | Substrate |

**Does not depend on:** OPS-001 D–E · UX-012 C–E · PMX-004 Phases 9–11 · FIN-003 remaining · marketplace UI · FAC-002 re-authorization.

---

## 6. Acceptance criteria (Slice C) — OC-01 … OC-10

| ID | Criterion |
|----|-----------|
| **OC-01** | **Task model** — org-scoped tasks support status, priority, due, owner, followers, dependencies, subject, and deep_link (or documented equivalent) per [06](./06-task-engine.md). |
| **OC-02** | **Task creation & completion** — tasks can be created from domain/events (and designed manual path); completion emits secret-free task-completed event on Slice A bus. |
| **OC-03** | **Priority scale** — single operational Priority Engine scale Critical → High → Medium → Low; safety/emergency paths force Critical per [23](./23-operational-priority-engine.md). |
| **OC-04** | **Priority propagation** — priority resolves onto tasks (and notify urgency hooks via Slice B where designed). |
| **OC-05** | **Priority ordering** — tasks are queryable/orderable by priority for consumers ([18](./18-implementation-slices.md) validation intent). |
| **OC-06** | **Workflow templates + maintenance pilot** — versioned workflow template + instance model exists; `maintenance.standard` (or equivalent) pilot is expressible per [24](./24-workflow-orchestration.md). |
| **OC-07** | **Workflow advancement** — pilot workflow advances on catalog events / approved commands; creates tasks / notifies / schedules timers via A–B as designed. |
| **OC-08** | **Timeline / bus integration** — material task and workflow step facts appear on Activity Timeline via Slice A; no parallel bus. |
| **OC-09** | **Org-safe · secret-free · UX / regression** — org-scoped execution; secret-free payloads; any UI uses UX-012 A `--mpa-*` only; Slices A–B behaviors remain green. |
| **OC-10** | **Documentation & scope** — implementation summary + validation evidence recorded; no OPS-D/E · UX-C–E · PMX-9–11 · FIN remaining · marketplace · FAC-002 redesign / unauthorized Facility product expansion shipped under this authorize. |

Maps to package Slice C validation intent: tasks ordered by priority; WO workflow advances on events ([18](./18-implementation-slices.md)).

---

## 7. Exit criteria (Validation)

Slice C exits **Validated** only when **all** are true:

1. Acceptance criteria **OC-01–OC-10** PASS.  
2. Tasks ordered/queryable by priority demonstrated.  
3. Maintenance workflow pilot advances on events demonstrated.  
4. Task completion / workflow step facts observable on Activity Timeline (or documented projector path).  
5. No unresolved **critical** defects.  
6. Documentation updated (implementation summary + validation report + board status).  
7. Governance recommendation recorded.  
8. Validation phrase recorded:

```
VALIDATE OPS-001 SLICE C
```

Until Validation is recorded: OPS-001 Slices D–E · UX-012 C–E · PMX-004 Phases 9–11 · FIN-003 remaining · partner marketplace UI remain subject to their own authorize phrases regardless of this authorize.

---

## 8. Remediation process (if Validation FAIL)

If `VALIDATE OPS-001 SLICE C` results in **FAIL**:

1. **Preserve** the FAIL validation report (do not rewrite history).  
2. Document defects with severity and binding criterion IDs (OC-xx / design doc refs).  
3. Produce a **remediation** record limited to fixing authorized Slice C defects — no scope expansion into OPS-D/E · UX-012 C–E · PMX-004 9–11 · FIN remaining · marketplace · FAC-002 redesign.  
4. Re-run validation under phrase **`VALIDATE OPS-001 SLICE C`** (or a clearly labeled re-run document) until **PASS** or gate owners halt.  
5. Other packages stay locked until their own authorize phrases.

---

## 9. Deferred / outside Slice C

| Item | Disposition |
|------|-------------|
| OPS-001 Slice D | Locked until `AUTHORIZE OPS-001 SLICE D` |
| OPS-001 Slice E | Locked until `AUTHORIZE OPS-001 SLICE E` |
| UX-012 Slices C–E | Locked until each `AUTHORIZE UX-012 SLICE …` |
| PMX-004 Phases 9–11 | Locked until each `AUTHORIZE PMX-004 PHASE …` |
| FIN-003 remaining | Separate authorize |
| Certified partner marketplace UI | Separate authorize |
| AI Director / Automation / KPI analytics | Slice D |
| Unified Inbox / Command Center / Search / Quick Actions | Slice E |
| FAC-002 product expansion | Separate package (already COMPLETE for V1.0) |

---

## 10. Recommendation

| Field | Result |
|-------|--------|
| **Authorize Slice C?** | ✅ **YES — AUTHORIZED** |
| **Begin implementation?** | ✅ **Eligible** in a **dedicated implement session** within this scope |
| **Begin implementation in this authorize session?** | ❌ **NO** |
| **Validation?** | 🔒 Until `VALIDATE OPS-001 SLICE C` |
| **Authorize D–E / UX-C–E / PMX-9–11 / FIN remaining / marketplace?** | ❌ **NO** |

**Next:** Slice C **Validated**. Recommend separate session → **`AUTHORIZE OPS-001 SLICE D`**. Do **not** authorize D in this document.

---

## Sign-off

| Role | Decision | Date |
|------|----------|------|
| Governance / Product Owner authority | ✅ **AUTHORIZE OPS-001 SLICE C** | 2026-07-26 |
| Implementation | ✅ **IMPLEMENTED** ([39](./39-slice-c-implementation.md)) | 2026-07-26 |
| Validation | ❌ FAIL ([40](./40-slice-c-validation.md)) → ✅ **PASS** re-run ([42](./42-slice-c-validation-rerun.md)) | 2026-07-26 |
