# 20 — Phase 4 Authorization

**Package:** CORE-004  
**Phase:** 4 — Resident Operations  
**Date:** 2026-08-06  
**Status:** ✅ **Authorized**

---

## Authorize phrase

```
AUTHORIZE CORE-004 PHASE 4 – Resident Operations
```

---

## Prerequisites

| Prerequisite | Status |
|--------------|--------|
| CORE-004 Approved · ADR-035 | ✅ |
| Phase 1 Accepted | ✅ |
| Phase 2 Accepted | ✅ |
| Phase 3 Accepted | ✅ ([19](./19-phase-3-acceptance.md)) |
| UX-016 · STD-001 · NAV-001 · ARCH-001 | ✅ |
| MAC-002 · SignWell production certified | ✅ |

---

## Mission

Build the **complete Resident Operations System** — one canonical operational resident experience from lease execution through move-out and archive.

**Do not** build isolated resident pages or isolated CRUD.  
**Do** build the authoritative resident lifecycle that every module references as one resident identity.

---

## Permanent rules

1. Exactly **one** resident lifecycle (no alternate workflows).  
2. Exactly **one** resident record — every domain references the same tenant entity.  
3. Inherit STD-001 / UX-016 / NAV-001 / ARCH-001 — no parallel portal or dashboard systems.  
4. Reuse Maintenance, Leasing, Financial, Document, and Communications foundations — do not duplicate them.

---

## Canonical lifecycle (binding)

Applicant → Approved → Lease Signed → Move-In Scheduled → Move-In Complete → Active Resident → Community Participation → Maintenance → Payments → Renewal → Move-Out Scheduled → Former Resident → Archive

---

## Scope unlocked

| Area | In scope |
|------|----------|
| State machine | `tenants.workflow_stage` + audit + ops/notify |
| Portal | `/portal/tenant` on STD-001 UDF (calm resident experience) |
| Staff home | Resident Command Center on STD-001 (`/tenants`) |
| Automation | Lease signed → activate · portal · checklist · welcome · timeline · audit · property |
| Integrations | Property · Leasing · Maintenance · Financial · Documents · Communications · Search · Assistant |
| Mobile | Maintenance · Payments · Messages · Documents · Notifications · Lease · Community |

---

## Out of scope

- New accounting system (Financial Operations later)  
- New maintenance workflow (Phase 2 is authoritative)  
- New leasing workflow (Phase 3 is authoritative)  
- Parallel inboxes or duplicate resident CRM
