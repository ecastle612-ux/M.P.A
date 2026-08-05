# 09 — Phase 1 Authorization

**Package:** CORE-004  
**Phase:** 1 — Property Lifecycle  
**Date:** 2026-08-05  
**Status:** ✅ **Authorized**

---

## Authorize phrase

```
AUTHORIZE CORE-004 PHASE 1 – Property Lifecycle
```

---

## Prerequisites verified

| Prerequisite | Status |
|--------------|--------|
| CORE-004 Approved · ADR-035 | ✅ |
| Identity Foundation | ✅ |
| UX-016 Certified | ✅ |
| NAV-001 Implemented | ✅ |
| STD-001 Adopted | ✅ |
| ARCH-001 Adopted | ✅ |
| MAC-002 Production Certified | ✅ |
| Mission Control Certified | ✅ |
| SignWell Production Platform | ✅ |

---

## Authorized scope

Implement the Property Lifecycle as a **single operational system** coordinating organizations, occupancy, turnover, disposition, audit, notifications, timeline, Assistant, Waiting, dashboards, search, and automation.

**Lifecycle states (enforced):**

```
Property Prospect → Acquisition → Onboarding → Organization Assignment
  → Configuration → Activation → Operational → Occupancy → Turnover
  → Disposition → Archived
```

(Operational ↔ Occupancy ↔ Turnover loops allowed; Disposition → Archived terminal.)

**Surfaces:** Property Command Center (UDF Overview) · Property Workspace contextual nav (reuse framework) · universal search participation.

---

## Explicit non-goals

- Phase 2+ Maintenance / Leasing / etc. workflows  
- New identity / auth plane / MAC-002 changes  
- Parallel navigation or new dashboard anatomy  
- Isolated CRUD without lifecycle transitions  

---

## Gate

| Stage | Status |
|-------|--------|
| Design | ✅ |
| Document | ✅ |
| Approve (program) | ✅ |
| Authorize (phase) | ✅ **Issued** |
| Implement | 🔓 Unlocked for this phase |
| Verify / Certify | Required before Phase 2 |
