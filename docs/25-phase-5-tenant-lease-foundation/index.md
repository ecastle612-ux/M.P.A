# 25 — Phase 5 Tenant & Lease Foundation

## Status

**Proposed**

## Purpose

Define the next implementation phase after Phase 4 to establish the first
tenant and lease operating baseline for M.P.A.

This phase introduces the canonical relationship between organizations,
properties, units, tenants, and leases while preserving all Phase 4 behavior
and contracts.

## Scope

1. Tenant domain foundation (create/read/update/archive lifecycle)
2. Lease domain foundation (draft/upcoming/active/expired/terminated lifecycle)
3. Database architecture for tenants and leases with organization isolation
4. API architecture for tenant and lease operations
5. UX standards for tenant and lease management surfaces
6. Dashboard metric extensions for occupancy and lease visibility
7. Verification gate and implementation sequencing for safe delivery

## Explicitly Out of Scope

- Accounting and payment processing
- Maintenance workflow implementation
- Vendor marketplace workflows
- Resident communications workflows
- Lease signing/eSignature integrations
- Co-tenant/roommate workflow implementation (extension point only)

## Documents

| Document | Purpose |
|----------|---------|
| [Architecture](./architecture.md) | Service and boundary design for tenant/lease foundation |
| [Domain Model](./domain-model.md) | Canonical tenant and lease lifecycle contracts |
| [Database Design](./database-design.md) | Table, index, FK, and RLS architecture |
| [API Design](./api-design.md) | Endpoint surface and request/response contract strategy |
| [UX Standards](./ux-standards.md) | Interaction and composition standards for new surfaces |
| [Phase 5 Verification Gate](./phase-5-verification-gate.md) | Mandatory quality and security checks |
| [Implementation Plan](./implementation-plan.md) | Incremental execution plan for approved scope |

## Gate Condition

Implementation remains blocked until:

1. This package is approved,
2. ADR-016 is accepted, and
3. The implementation gate status is moved to approved for this phase.
