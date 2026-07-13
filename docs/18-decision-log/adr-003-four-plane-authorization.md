# ADR-003: Four-Plane Authorization Model

## Status
Accepted

## Date
2026-07-11

## Context
The initial proposal used a single `organization_members` model with roles for all user types. M.P.A. serves four distinct actor types (PM staff, property owners, tenants, marketplace vendors) with fundamentally different access patterns. Owners are property-scoped, tenants are lease-scoped, vendors are marketplace-global.

## Decision
Implement **four separate authorization planes**, each with dedicated access tables and RLS policy suites:

1. PM organization (`org_members`)
2. Property owners (`owner_property_access`)
3. Tenants (`tenant_lease_access`)
4. Marketplace vendors (`marketplace_vendor_users`)

## Consequences
**Easier:** Correct security boundaries, clear portal separation, no role confusion.

**More difficult:** Four policy suites to maintain and test. Edge Functions must check the correct plane.

## Alternatives Considered
- **Single org_members with roles:** Rejected — owners and tenants are not org members; security risk.
- **Custom JWT claims for scoping:** Rejected as primary — RLS with access tables is auditable and testable.
