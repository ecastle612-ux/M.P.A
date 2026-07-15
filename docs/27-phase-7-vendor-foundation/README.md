# Phase 7 — Vendor Management Foundation

**Status:** Approved · Implemented  
**Gate:** Design → Document → Approve → Implement (complete)

## Scope

Org-scoped vendor management integrated with Phase 6 maintenance:

- Vendor profiles (business, contact, compliance placeholders, services, rating)
- Vendor contacts and service areas
- Vendor assignment to work orders with full status lifecycle
- Assignment history and activity timeline
- Vendor dashboard, Operations Center, and Command Center integration

## Out of scope (deferred)

- Global marketplace identity (ADR-004 full marketplace — Phase 7 foundation uses org-scoped `vendors`)
- Vendor portal job inbox (roadmap deliverable — UI placeholder via `/portal/vendor` only)
- Leases, financials, resident communications, AI

## Product requirement IDs

| ID | Requirement |
|----|-------------|
| FEH-602 | Vendor assignment and status tracking |
| FEH-701 | Vendor onboarding baseline (org-scoped profiles) |
| MHF-002 | Property Manager First |
| MHF-003 | Workflow-first operations |
| MHF-005 | Enterprise scalability (org isolation, RLS) |
| CA-005, CA-006, CA-010 | Connected platform + command surfaces |
| PMX-002 | Operations Center vendor metrics |
| PMX-003 | Command Center vendor search |

## Database

- `vendors`
- `vendor_contacts`
- `vendor_service_areas`
- `maintenance_vendor_assignments`
- Extended `maintenance_work_orders` (`vendor_id`, `current_vendor_assignment_id`)
- Extended `maintenance_activity_events` (vendor lifecycle event types)

Migration: `supabase/migrations/20260714210000_phase7_vendor_foundation.sql`

## Definition of Done

All criteria in [`docs/00-governance/definition-of-done.md`](../00-governance/definition-of-done.md) apply.
