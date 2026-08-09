# Phase 5 · Sprint 1 — Regression Report

## Intent

Prove Sprint 1 **extends** leasing without regressing certified journeys.

| Surface | Expectation | Result |
| --- | --- | --- |
| `/pm/leasing` lease create + SignWell / offline | Still works; pending residents include approved | Extended, not replaced |
| `/pm/leasing/[leaseId]` command center | Unchanged controls | No redesign |
| `/pm/residents` J3 create | Still creates `pending_lease` for launch path | Preserved |
| Mission Control layout | Same chrome; more attention items | Extended daily-ops only |
| `/shared/documents` | Existing entity filters; new `application` optional | Additive |
| `/shared/reports` | Existing insights; applications when table present | Additive facts |
| Commercial / Stripe / auth / nav | Untouched | No files changed for these |
| SignWell webhook | Untouched route | Natural handoff only |

## Compatibility notes

- `RESIDENT_STATUS_LABELS.pending_lease` display text is now **Lease Pending** (same key).  
- `active` label is now **Resident** (was “Active Resident”) — status key unchanged.  
- Lease create accepts `approved` | `pending_lease` | `prospect` (superset of prior).  
- On lease create, person status is `pending_lease` (was `pending_move_in`); send-for-signature sets `pending_move_in`.

## Test coverage added

- `packages/shared/src/leasing/leasing-lifecycle.test.ts`
- Resident status label expectations updated
- PDF template registration assertions extended

## STOP reminder

After Production LIVE + Owner LIVE acceptance: **no Sprint 2 work** until re-authorized.
