# 13 — Phase 2 Design: Maintenance Operations

**Package:** CORE-004  
**Phase:** 2  
**Status:** ✅ Authorized · Implemented  
**Date:** 2026-08-05  
**Authorize:** [12](./12-phase-2-authorization.md)

---

## Permanent rule

**Every operational workflow has exactly one canonical state machine.**

All maintenance entry points (resident, manager, inspection, PM automation, vendor) converge into:

```
Request → Intake → Triage → Priority Classification → Assignment
  → Scheduling → Dispatch → Field Execution → Vendor Escalation?
  → Quality Review → Resident Confirmation? → Completion → Analytics
```

Legacy `status` remains synced for existing UI; `workflow_stage` is authoritative.

---

## Reuse (ARCH-001)

Extend `maintenance_work_orders` · `createWorkOrder` · vendor token chain · facility tech hub · OPS bus.  
Do **not** create a second work-order system.

---

## Stage contract

Every stage defines: entry · exit · required role · approvals · notifications · audit · timeline · Assistant · Waiting on Me · Waiting on Others.  
Authoritative definitions: `apps/web/src/lib/maintenance/workflow.ts` (`MAINTENANCE_WORKFLOW_DEFINITIONS`).

---

## Surfaces

| Audience | Surface | Pattern |
|----------|---------|---------|
| Manager / Coordinator | `/maintenance` Maintenance Command Center | STD-001 UDF |
| Work order | `/maintenance/[id]` + workflow panel | Canonical advances |
| Property | Property Command Center open-maintenance signal | No duplicate tracking |
| Resident | Portal submit → track → confirm → feedback | No internal ops |
| Technician | `/facility` day view | Mobile-first route + emergency + parts |
| Vendor | Existing tokenized job + vendor assignment | Deepen in Phase 5 |

---

## Automation (example)

Emergency request → intake/triage/priority (force) → notify · ops event · timeline/audit · Waiting on Me · dispatch recommendation.

---

## Search

Corpus fields: property · resident · work order · technician · vendor · status · priority · category · workflow_stage · asset (via facility links).
