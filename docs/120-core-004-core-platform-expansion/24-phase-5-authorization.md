# 24 — Phase 5 Authorization

**Package:** CORE-004  
**Phase:** 5 — Vendor Operations  
**Date:** 2026-08-06  
**Status:** ✅ **Authorized**

---

## Authorize phrase

```
AUTHORIZE CORE-004 PHASE 5 – Vendor Operations
```

---

## Prerequisites

| Prerequisite | Status |
|--------------|--------|
| CORE-004 Approved · ADR-035 | ✅ |
| Phases 1–4 Accepted | ✅ ([23](./23-phase-4-acceptance.md)) |
| UX-016 · STD-001 · NAV-001 · ARCH-001 | ✅ |
| MAC-002 · SignWell production certified | ✅ |

---

## Mission

Build the **complete Vendor Operations System** — one canonical operational vendor lifecycle from onboarding through long-term performance management.

**Do not** build isolated vendor CRUD or a standalone vendor module.  
**Do** integrate with Property · Maintenance · Financial · Documents · Communications · Audit · Notifications · Assistant.

---

## Permanent rules

1. Exactly **one** Vendor Operations workflow.  
2. Exactly **one** vendor identity (`vendors` row) for assignments, invoices, insurance, docs, performance.  
3. External work continues through canonical Maintenance Operations (Phase 2) — vendor assignment is a stage within that machine.  
4. Invoices feed Financial Operations — no duplicate accounting.  
5. Inherit STD-001 — no custom dashboard.

---

## Canonical lifecycle (binding)

Prospective Vendor → Invited → Application Submitted → Compliance Review → Insurance Verification → Approved → Available → Assigned → Work In Progress → Invoice Submitted → Payment Pending → Paid → Performance Review → Preferred Vendor (optional) → Suspended (optional) → Inactive → Archived

`workflow_stage` is authoritative.
