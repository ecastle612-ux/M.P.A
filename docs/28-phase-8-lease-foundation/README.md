# Phase 8 — Lease Management Foundation

**Status:** Approved · Implemented  
**Gate:** Design → Document → Approve → Implement (complete)

## Scope

Org-scoped lease management connecting property, unit, and tenant:

- Lease profiles with full lifecycle (draft → signed → active → expired/terminated)
- Permanent lease event history
- Document placeholders (PDF, signed lease, amendments, addendums, OCR-ready)
- Lease-driven occupancy metrics on Operations Center
- Command Center lease search

## Out of scope (deferred)

- Financials, rent ledger, payment processing (Phase 8 accounting in roadmap)
- Resident communications, AI operations
- Co-tenant parties table (`lease_parties` deferred)
- Actual document upload and OCR processing

## Product requirement IDs

| ID | Requirement |
|----|-------------|
| FEH-501 | Lease record CRUD with status lifecycle |
| FEH-502 | Lease ↔ tenant ↔ unit linkage |
| FEH-503 | Lease document attachment metadata (placeholders) |
| FEH-504 | Lease renewal workflow rail |
| MHF-002, MHF-003, MHF-005 | PM-first, workflow-first, enterprise scalability |
| MHF-011, MHF-012 | Operational dashboard + property operating graph |
| CA-005, CA-006, CA-010 | Connected platform + command surfaces |
| PMX-001, PMX-002, PMX-003 | Property graph + Operations Center + Command Center |

## Database

- `leases`
- `lease_documents`
- `lease_events`
- Capabilities: `lease:create|read|update|archive|delete`

Migration: `supabase/migrations/20260714220000_phase8_lease_foundation.sql`

## Definition of Done

All criteria in [`docs/00-governance/definition-of-done.md`](../00-governance/definition-of-done.md) apply.
