# 12 — Phase 2 Authorization

**Package:** CORE-004  
**Phase:** 2 — Maintenance Operations  
**Date:** 2026-08-05  
**Status:** ✅ **Authorized**

---

## Authorize phrase

```
AUTHORIZE CORE-004 PHASE 2 – Maintenance Operations
```

---

## Prerequisites

| Prerequisite | Status |
|--------------|--------|
| CORE-004 Approved · ADR-035 | ✅ |
| Phase 1 Accepted | ✅ ([11](./11-phase-1-acceptance.md)) |
| STD-001 · MAC-002 · UX-016 · NAV-001 · ARCH-001 | ✅ |

---

## Mission

Build the **complete Maintenance Operations System** — one canonical workflow from request through verification/analytics.

**Permanent rule:** Every work order—resident, manager, inspection, automation, or vendor—enters the **same** lifecycle. Different entry points converge into one authoritative state machine.

---

## Canonical workflow

```
Request → Intake → Triage → Priority Classification → Assignment
  → Scheduling → Dispatch → Field Execution → Vendor Escalation (if needed)
  → Quality Review → Resident Confirmation → Completion → Analytics
```

---

## Non-goals

- Parallel work-order systems  
- Custom dashboards outside STD-001  
- Phase 3+ leasing expansion  
- Changing MAC-002 / identity / auth planes  

---

## Gate

| Stage | Status |
|-------|--------|
| Design | ✅ |
| Document | ✅ |
| Authorize | ✅ **Issued** |
| Implement | ✅ Complete |
| Verify / Certify | ✅ [14](./14-phase-2-certification.md) · Accept before Phase 3 |
