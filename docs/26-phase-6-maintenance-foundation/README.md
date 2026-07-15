# Phase 6 — Maintenance Operations Foundation

**Status:** Approved · Implemented  
**Gate:** Design → Document → Approve → Implement (complete)

## Scope

First major operational module for property managers:

- Maintenance work orders (requests → assignment → completion)
- Priority, status, category, due dates
- Internal staff assignment (vendor placeholder only)
- Internal / tenant notes
- Photo, document, recurring, and preventive placeholders
- Activity timeline and maintenance history
- Operations Center and Universal Command Center integration

## Out of scope (deferred)

- Vendor management (Phase 7)
- Leases, financials, resident communications, AI operations

## Product requirement IDs

| ID | Requirement |
|----|-------------|
| MHF-002 | Property Manager First |
| MHF-003 | Workflow-first operations |
| MHF-005 | Enterprise scalability (org isolation, RLS) |
| FEH-601–606 | Maintenance foundation enhancements (partial) |
| CA-005, CA-006, CA-010 | Competitive advantages (connected platform, command surfaces) |
| PMX-002 | Operations Center integration |
| PMX-003 | Universal Command Center integration |

## Database

- `maintenance_work_orders`
- `maintenance_activity_events`
- Capabilities: `maintenance:create|read|update|assign|archive|delete`

Migration: `supabase/migrations/20260714200000_phase6_maintenance_foundation.sql`

## Definition of Done

All criteria in [`docs/00-governance/definition-of-done.md`](../00-governance/definition-of-done.md) apply to this phase closeout.
