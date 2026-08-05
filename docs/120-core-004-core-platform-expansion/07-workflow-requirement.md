# 07 — Workflow Requirement

**Package:** CORE-004  
**Status:** ✅ Approved — binding for every slice  
**Date:** 2026-08-05

---

## Law

**No partial implementations.**  
**No isolated CRUD features.**

Every implementation slice must finish with a **complete business outcome**.

---

## Mandatory questions

Before a slice may claim Verify / Certify, it must answer all of:

| # | Question | Evidence expected |
|---|----------|-------------------|
| 1 | **Who starts it?** | Role + entry surface |
| 2 | **What triggers it?** | Event, UI action, schedule, or system signal |
| 3 | **Who participates?** | Roles + handoffs |
| 4 | **What automations occur?** | Rules, jobs, derived state |
| 5 | **What notifications occur?** | Channels + Critical/Today/Later grouping |
| 6 | **What audit events occur?** | Immutable / queryable trail |
| 7 | **What dashboard updates?** | UDF Waiting / Insights / Timeline / KPIs |
| 8 | **What does the M.P.A. Assistant recommend?** | Deterministic follow-ups from real signals |
| 9 | **What completes the workflow?** | Terminal state + operator-visible done |

---

## Example (canonical)

```
Resident reports maintenance
  → Manager triages
  → Technician assigned
  → Vendor dispatched if needed
  → Work completed
  → Resident confirms
  → Audit recorded
  → Dashboard updated
  → Assistant recommends follow-up
```

This is the bar for Phase 2 and the pattern for every CORE-004 phase.

---

## Verification bar (every completed slice)

| Check | Required |
|-------|----------|
| Unit tests | ✅ |
| Integration tests | ✅ |
| Accessibility verification | ✅ |
| Performance verification | ✅ |
| Security verification | ✅ (RBAC · tenant · org isolation · audit) |
| Before/after screenshots | ✅ |
| Workflow certification | ✅ (answers table above + happy path) |

---

## Fail bar

A slice **fails** certification if it:

- Ships create/read/update/delete without a finish path  
- Updates UI without audit or notifications where the workflow requires them  
- Leaves Assistant / Waiting / Dashboard stale after completion  
- Invents a parallel home or MA launcher  
- Skips security or tenancy checks  
