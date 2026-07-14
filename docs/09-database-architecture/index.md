# 09 — Database Architecture

## Overview

PostgreSQL (via Supabase) is the **system of record**. All operational data, authorization, audit trails, and event history live here. Clients are thin; the database is authoritative.

---

## Phase 3 Implemented Identity Schema

Implemented foundation tables (Supabase migrations `2026071401*`-`2026071404*`):

- `organizations`
- `organization_memberships`
- `organization_invitations`
- `permission_capabilities`
- `role_permission_grants`
- `organization_permission_overrides`
- `user_profiles`
- `user_preferences`

Implemented security functions:

- `is_org_manager(target_org_id)` for compatibility
- `has_org_capability(target_org_id, required_capability)` for capability-based
  RLS checks across organization resources

---

## Schema Strategy

### Decision: Single Schema with Table Prefix Namespacing

**Rejected for v1:** Multi-schema separation (`property.*`, `leasing.*`, etc.)

**Adopted:** Single `public` schema with domain-prefixed table names.

| Prefix | Domain |
|--------|--------|
| `org_` | Organizations, members, invitations, settings |
| `profile_` | User profiles (extends auth.users) |
| `property_` | Properties, units, amenities |
| `owner_` | Owner accounts, property access, preferences |
| `lease_` | Leases, applications, screenings |
| `tenant_` | Tenant accounts, lease access |
| `work_order_` | Maintenance requests, assignments, evidence |
| `marketplace_` | Vendors, profiles, compliance, ratings, bids |
| `financial_` | Charges, payments, invoices, ledger entries |
| `document_` | Document metadata (files in Storage) |
| `comms_` | Message threads, notifications |
| `report_` | Owner reports, periods, approvals |
| `ai_` | Suggestions, embeddings, feedback |
| `integration_` | Webhook events, external IDs, sync state |
| `event_` | Domain events, outbox |
| `audit_` | Change logs (append-only) |

**Exception:** `audit_` tables may move to dedicated `audit` schema if Postgres permissions warrant it.

---

## Multi-Sided Access Model

Four authorization planes — never conflated:

### Plane 1: PM Organization

```sql
org_organizations
org_members          -- user_id, organization_id, role
org_invitations
```

Roles: `owner`, `admin`, `manager`, `member`, `viewer`

### Plane 2: Property Owner (External)

```sql
owner_accounts             -- links to auth.users
owner_property_access      -- owner_id, property_id, permissions
```

Owners see only their properties. Never org_members.

### Plane 3: Tenant (External)

```sql
tenant_accounts            -- links to auth.users
tenant_lease_access        -- tenant_id, lease_id, permissions
```

Tenants see only their active lease context.

### Plane 4: Vendor (Marketplace)

```sql
marketplace_vendors            -- global vendor identity
marketplace_vendor_users       -- user_id, vendor_id, role
marketplace_vendor_compliance  -- insurance, licenses
marketplace_vendor_ratings       -- cross-org reputation
marketplace_org_vendor_links     -- PM org ↔ vendor relationship
```

Vendors are **global marketplace entities**. PM organizations link to vendors via `marketplace_org_vendor_links`.

---

## Core Entity Graph

```
org_organizations
        │
        ├── property_properties
        │         ├── property_units
        │         ├── owner_property_access → owner_accounts
        │         └── document_documents
        │
        ├── lease_applications
        │         └── lease_agreements
        │                   └── tenant_lease_access → tenant_accounts
        │
        ├── work_order_requests
        │         └── marketplace_vendor_assignments
        │
        ├── financial_charges / financial_payments
        │
        └── report_owner_reports
```

---

## Standard Column Conventions

Every tenant-scoped table includes:

```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
organization_id UUID NOT NULL REFERENCES org_organizations(id)
created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
created_by      UUID REFERENCES auth.users(id)
deleted_at      TIMESTAMPTZ          -- soft delete where applicable
```

Marketplace-global tables omit `organization_id` but include `created_at`, `updated_at`.

---

## Row Level Security (RLS)

### Policy Principles

1. **Default deny** — no policy = no access
2. **Plane-specific** — PM, owner, tenant, vendor policies separated
3. **Helper functions** — `is_org_member()`, `has_org_role()`, `can_access_property()`, `can_access_lease()`
4. **Service role bypass** — Edge Functions only, never client
5. **Test every policy** — mandatory CI integration tests

### Example Policy Pattern (PM Org)

```sql
-- PM members read properties in their org
CREATE POLICY "org_members_read_properties"
ON property_properties FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM org_members
    WHERE user_id = auth.uid()
  )
);
```

### Marketplace Cross-Org Access

Vendor job visibility: vendor sees work orders where `marketplace_vendor_assignments.vendor_id` matches their vendor identity. PM org sees work orders where `organization_id` matches. Policies are **different SQL**, not one generic policy.

---

## Domain Events

```sql
event_domain_events
  id              UUID PRIMARY KEY
  event_type      TEXT NOT NULL
  aggregate_type  TEXT NOT NULL
  aggregate_id    UUID NOT NULL
  organization_id UUID
  actor_id        UUID
  payload           JSONB NOT NULL DEFAULT '{}'
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
  processed_at    TIMESTAMPTZ
  error             TEXT
```

Index: `(event_type, created_at)`, `(processed_at) WHERE processed_at IS NULL`

---

## Financial Data Integrity

| Rule | Implementation |
|------|----------------|
| No hard deletes on financial records | Soft delete + audit |
| Idempotent payment processing | `integration_idempotency_keys` |
| Stripe ID mirror | `integration_stripe_objects` |
| Ledger append-only | `financial_ledger_entries` INSERT only |

---

## Document Storage

| DB Table | Storage Bucket |
|----------|----------------|
| `document_documents` | `org-{organization_id}` path prefix |

Storage RLS mirrors database RLS. Signed URLs: 15-minute TTL default.

---

## Search & AI

```sql
ai_embeddings
  id              UUID PRIMARY KEY
  entity_type     TEXT NOT NULL
  entity_id       UUID NOT NULL
  organization_id UUID
  embedding       vector(1536)
  content_hash    TEXT
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
```

Index: HNSW on `embedding` using `pgvector`.

---

## Migrations

```
supabase/migrations/
  20260711000001_org_foundation.sql
  20260711000002_property_tables.sql
  20260711000003_rls_org_members.sql
  ...
```

| Rule | Detail |
|------|--------|
| One concern per migration | Easier rollback reasoning |
| Never edit applied migrations | Forward-only fixes |
| RLS in same or following migration | Never deploy tables without RLS |
| Generate types after migration | `supabase gen types typescript` |

---

## Performance at Scale

| Technique | When |
|-----------|------|
| Composite indexes on `(organization_id, status, created_at)` | List queries |
| Partial indexes on active records | `WHERE deleted_at IS NULL` |
| Materialized views for owner reports | 100+ properties per org |
| Connection pooling (Supavisor) | Production default |
| Query explain in CI for critical paths | Before scale milestones |

---

## Related Documents

- **05** Business Workflows — entities per workflow stage
- **10** API Standards — Edge Function data access
- **13** AI Strategy — AI tables
- **14** Security Standards — RLS enforcement
- **16** Testing Standards — RLS test requirements
