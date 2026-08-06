# 21 — Phase 4 Design: Resident Operations

**Package:** CORE-004  
**Phase:** 4  
**Status:** ✅ Authorized · Implemented  
**Date:** 2026-08-06  
**Authorize:** [20](./20-phase-4-authorization.md)

---

## Permanent rules

**Every operational domain references ONE resident identity (`tenants` row).**  
Resident data is never duplicated across modules.

```
Applicant → Approved → Lease Signed → Move-In Scheduled → Move-In Complete
  → Active Resident → Community Participation → Maintenance → Payments
  → Renewal → Move-Out Scheduled → Former Resident → Archive
```

Legacy `lifecycle_status` / CRM `status` remain synced; **`workflow_stage` is authoritative**.

---

## Reuse (ARCH-001)

| Extend | Do not create |
|--------|---------------|
| `tenants` as sole resident carrier | Second resident/CRM system |
| `/portal/tenant` + STD-001 UDF | Custom portal anatomy |
| Phase 2 maintenance resident-confirm | Parallel maintenance workflow |
| Phase 3 leasing + SignWell advance | Alternate lease/resident activation |
| Billing `getResidentPaymentDashboard` | Duplicate accounting |
| Messaging source-entity threads | Disconnected inbox |
| Existing vault / documents | Parallel document store |

---

## Single carrier

| Stages | Authoritative row |
|--------|-------------------|
| All 13 resident stages | `tenants.workflow_stage` |

Handoff from Leasing: applicant conversion / lease SignWell creates or advances the tenant into `approved` / `lease_signed`. Pre-tenant applicant progression remains on the Leasing machine; Resident Operations owns the resident identity once the tenant row exists.

---

## Concurrent ops domains

`community_participation`, `maintenance`, and `payments` are first-class stages entered from `active_resident` and return to `active_resident`. They represent the resident’s current operational focus for Waiting / Assistant / dashboards — not separate identity records.

---

## Stage contract

Every stage defines entry · exit · roles · approvals · notifications · audit · timeline · Assistant · Waiting on Me · Waiting on Others · dashboard updates.

Authoritative definitions: `apps/web/src/lib/resident/workflow.ts`.

---

## Command centers

| Surface | Pattern |
|---------|---------|
| Resident portal `/portal/tenant` | STD-001 Universal Dashboard (calm) · tools below fold |
| Staff `/tenants` | STD-001 Resident Command Center · directory below Insights |
| Property / Leasing / Maintenance | Inherit existing STD-001 homes; property signals active residents |

---

## Automation (examples)

Lease signed (SignWell) → advance resident → enable portal path → seed move-in checklist → notify → Assistant → timeline → audit → property update.

Move-in acknowledgement complete → `move_in_complete` → `active_resident`.

---

## Communications

Messages remain contextual via existing source-entity threads (maintenance · lease/PM · inspections). Resident Command Center / portal surfaces deep-link into those threads — no disconnected inbox.
