# 83 — COM-002 PRODUCTION COMPATIBILITY PACKAGE

**Title:** COM-002 PRODUCTION COMPATIBILITY PACKAGE  
**Status:** Approved  
**Date:** 2026-08-14  
**Approved:** 2026-08-14 — Product Owner + Architect authorization to implement M1 only  
**Gate:** Design → Document → Approve → **Implement** (ADR-012) — M1 only  
**Related:** [docs/80](https://github.com/ecastle612-ux/M.P.A/blob/cursor/tenant-communication-center-b7a1/docs/80-com-002-tenant-communication-center/index.md) (Approved, PR #188) · [ADR-024](https://github.com/ecastle612-ux/M.P.A/blob/cursor/tenant-communication-center-b7a1/docs/18-decision-log/adr-024-com-002-tenant-communication-center.md) (Accepted, PR #188) · [docs/81](https://github.com/ecastle612-ux/M.P.A/blob/cursor/tenant-communication-center-b7a1/docs/81-com-002-implementation-certification/index.md) · [docs/82](../82-com-002-production-release-certification/index.md) (BLOCKED) · [ADR-025](../18-decision-log/adr-025-com-002-production-compatibility.md) (Accepted)  
**Production:** **NO** migration apply · **NO** deploy  
**Billing / Stripe / commercial flow:** Unchanged  

Identifier note: this package is for **COM-002 Tenant Communication Center** (ADR-024 / docs/80), not COM-002 Self-Service Commercial (ADR-018 / docs/37).

---

## Purpose

docs/82 blocked production release because `20260814010000_com_002_tenant_communication_center.sql` is not apply-safe on `mpa-prod`. This record designs the **minimum additive compatibility package** required before that approved migration can run.

M1 implementation is authorized. Production apply and deploy remain **not** authorized.

---

## Root cause

`mpa-prod` (`vahnmcrpnuggxkivynvo`) and the repository do not share the same communications / resident-access lineage.

| Lineage | What it contains | Where it exists |
|---------|------------------|-----------------|
| Production historical | Phase 3–11 foundations, FO enablement A–D, MEDIA-001 (`20260813213805`), older `conversation_*` / `communication_messages` store | `mpa-prod` |
| Repository / preview | LAUNCH-001 promise-remediation notices (`comms_messages`, `comms_notifications`) + FIN-OPS S1 `lease_residents` + `is_lease_resident()` | repo migrations · `mpa-preview` |

COM-002 Tenant Communication Center (ADR-024) correctly adds a **new** thread domain beside notices. Its migration **assumes notices and resident helpers already exist**:

- `alter table public.comms_notifications add column if not exists conversation_id …` fails if `comms_notifications` is absent.
- `can_access_tenant_conversation()` calls `is_lease_resident()`, which fails to create if that function is absent.

Applying the full FIN-OPS S1 or LAUNCH-001 remediations files to production is **out of scope** and **unsafe**:

- FIN-OPS S1 also creates financial tables and **replaces** `is_org_member()` plus `lease_agreements` RLS.
- LAUNCH-001 remediations also create `document_documents` (already on prod) and `alter` `financial_notifications` / `maintenance_notifications` (both **absent** on prod — wholesale apply would fail).

---

## 1. Inventory — production gap

Observed 2026-08-14 against `mpa-prod`. Latest production migration: `20260813232103_fo_prod_enablement_d_events_audit_compat`.

### Repository expected (COM-002 apply)

| Object | Role for COM-002 |
|--------|------------------|
| `comms_messages` | One-way notices store. COM-002 must not reuse it as chat. Notification rows may FK `message_id`. |
| `comms_notifications` | Notification Center. COM-002 adds nullable `conversation_id`. App inserts thread notices here with `message_id = null`. |
| `lease_residents` | Source table for `is_lease_resident()`. |
| `is_lease_resident(uuid)` | Tenant-plane helper used by `can_access_tenant_conversation()`. |
| `is_org_member` / `is_org_manager` | Notices RLS on the expected comms tables. |
| `pm_residents` + `lease_agreements` | COM-002 conversation FKs and app tenant actor. |
| `is_pm_staff` / `can_access_tenant_conversation` | Created by the approved COM-002 migration (not prerequisites). |
| `comms_conversations` and child tables | Created by the approved COM-002 migration (not prerequisites). |

### Current `mpa-prod`

| Object | Production | Notes |
|--------|------------|-------|
| `comms_messages` | **Missing** | |
| `comms_notifications` | **Missing** | |
| `lease_residents` | **Missing** | |
| `is_lease_resident()` | **Missing** | |
| `is_pm_staff()` | **Missing** | Expected until COM-002 migration |
| `can_access_tenant_conversation()` | **Missing** | Expected until COM-002 migration |
| `comms_conversations` (+ participants / messages / reads) | **Missing** | Expected until COM-002 migration |
| `is_org_member()` | Present | Do **not** replace |
| `is_org_manager()` | Present | Admin or property_manager |
| `pm_residents` | Present — **0 rows** | Shape matches J3 |
| `lease_agreements` | Present — **0 rows** | Extra SignWell columns vs FIN-OPS S1; keep as-is |
| `property_properties` / `property_units` / `vendor_vendors` | Present | Safe FK targets for notices |
| `document_documents` | Present | Do **not** recreate |
| `media_attachments` | Present — 6 rows | Check constraint lacks `conversation_message` (COM-002 widens it) |
| `platform.communications:read/write` | **Missing** | Prod has `platform.documents:*` and legacy `communication:*` |
| `financial_notifications` / `maintenance_notifications` | **Missing** | Why wholesale LAUNCH-001 remediations cannot apply |
| `tenants` / `leases` | Present — 35 / 18 rows | **Legacy** resident/lease store. Not COM-002’s model |
| `conversation_threads` | Present — 3 rows | Legacy comms. See §3 |
| `communication_messages` | Present — 2 rows | Legacy comms. See §3 |
| `conversation_participants` | Present — 2 rows | Legacy |
| `message_read_receipts` | Present — 0 rows | Legacy |
| `in_app_notifications` | Present — 19 rows | Legacy notification center |

`lease_agreements` select RLS on production is `is_org_member(organization_id)` only. This package must **not** rewrite that policy (that would be FIN-OPS access expansion).

---

## 2. Compatibility package design

### Decision

Ship **two ordered migrations** after Owner approval — not a rewrite of ADR-024 and not a wholesale replay of FIN-OPS / LAUNCH-001.

| Order | Migration | Purpose |
|-------|-----------|---------|
| **M1** | `com_002_prod_compat_prerequisites` (new) | Create missing notices + resident-access objects, idempotent |
| **M2** | `20260814010000_com_002_tenant_communication_center` (approved, unchanged) | Conversation domain + `conversation_id` + MEDIA type |

M1 must be a **no-op** on `mpa-preview` and any database that already has these objects (`create table if not exists`, `create or replace` only for the missing helper, `on conflict do nothing` for capability rows).

### M1 — required tables

#### `public.lease_residents`

Additive empty table. Exact FIN-OPS S1 shape. No backfill.

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | uuid PK | `gen_random_uuid()` |
| `organization_id` | uuid not null | FK `organizations(id)` on delete cascade |
| `lease_id` | uuid not null | FK `lease_agreements(id)` on delete cascade |
| `user_id` | uuid | FK `auth.users(id)` on delete set null |
| `display_name` | text not null | |
| `email` | text | |
| `is_primary` | boolean not null | default true |
| `financial_status` | text not null | default `current`; check `current \| delinquent \| prepaid \| closed` |
| `created_at` | timestamptz not null | utc now |
| unique | `(lease_id, email)` | |

Index: `lease_residents_user_idx` on `user_id` where `user_id is not null`.

Do **not** create FIN-OPS financial tables. Do **not** map `tenants` / `leases` into this table.

#### `public.comms_messages`

Additive empty one-way notices table. Exact LAUNCH-001 remediations comms shape.

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | uuid PK | |
| `organization_id` | uuid not null | FK `organizations` cascade |
| `audience_type` | text not null | `resident \| owner \| vendor` |
| `subject` / `body` | text not null | |
| `property_id` | uuid | FK `property_properties` set null |
| `resident_id` | uuid | FK `pm_residents` set null |
| `vendor_id` | uuid | FK `vendor_vendors` set null |
| `owner_user_id` / `recipient_user_id` / `created_by` | uuid | FK `auth.users` set null |
| `channel` | text not null | default `in_app`; `in_app \| email \| both` |
| `delivery_status` | text not null | default `delivered` |
| `email_provider_id` | text | |
| `created_at` | timestamptz not null | |

Indexes: `(organization_id, created_at desc)`, `(organization_id, recipient_user_id, created_at desc)`.

#### `public.comms_notifications`

Additive empty Notification Center table. Exact LAUNCH-001 remediations shape **without** `conversation_id` — M2 adds that column.

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | uuid PK | |
| `organization_id` | uuid not null | FK `organizations` cascade |
| `user_id` | uuid not null | FK `auth.users` cascade |
| `message_id` | uuid | FK `comms_messages` cascade; nullable so COM-002 can insert thread notices |
| `notification_key` | text not null | default `comms.message.received` |
| `title` / `body` | text not null | |
| `href` | text | |
| `read_at` | timestamptz | |
| `created_at` | timestamptz not null | |

Index: `(organization_id, user_id, created_at desc)`.

Do **not** create or alter `in_app_notifications`.

### M1 — required helper functions

#### `public.is_lease_resident(target_lease_id uuid) returns boolean`

Create only if missing, or `create or replace` **only** with the FIN-OPS S1 body (no semantic fork):

- `security definer`, `stable`, `search_path = public`
- `exists` on `lease_residents` where `lease_id = target_lease_id` and `user_id = auth.uid()`

Do **not** replace `is_org_member` or `is_org_manager`.  
Do **not** redefine the helper as `pm_residents`-based. COM-002 app tenant actor already uses `pm_residents.user_id`; RLS additionally requires this helper. After M1, a tenant passes RLS when a `lease_residents` row exists for that user + lease. Existing `lease-service` writes that row when a **new-model** lease is activated. Production currently has zero `lease_agreements` / `pm_residents` rows, so no backfill is required for safety.

`is_pm_staff` and `can_access_tenant_conversation` remain **M2** (approved COM-002 file).

### M1 — required indexes

Listed with the tables above. All `create index if not exists`.

### M1 — required RLS

Enable RLS on the three new tables. Policies match repo notices / FIN-OPS resident-link policies. All `drop policy if exists` then create.

| Table | Policy | Command | Using / check |
|-------|--------|---------|----------------|
| `lease_residents` | `lease_residents_select` | select | `is_org_member(organization_id) or user_id = auth.uid()` |
| `lease_residents` | `lease_residents_manage_manager` | all | `is_org_manager(organization_id)` |
| `comms_messages` | `comms_messages_select_member` | select | `is_org_member(organization_id) or recipient_user_id = auth.uid() or owner_user_id = auth.uid()` |
| `comms_messages` | `comms_messages_insert_manager` | insert | `is_org_manager(organization_id) or is_org_member(organization_id)` |
| `comms_notifications` | `comms_notifications_select_own` | select | `user_id = auth.uid() or is_org_manager(organization_id)` |
| `comms_notifications` | `comms_notifications_insert_member` | insert | `is_org_member(organization_id)` |
| `comms_notifications` | `comms_notifications_update_own` | update | `user_id = auth.uid() or is_org_manager(organization_id)` |

Do **not** change policies on `conversation_threads`, `communication_messages`, `in_app_notifications`, `lease_agreements`, `pm_residents`, or `media_attachments` in M1. MEDIA select tightening is M2 only.

### M1 — required relationships

```
organizations
  └── lease_agreements ── property_properties
        └── lease_residents ── auth.users

organizations
  └── comms_messages ── property_properties
                     ── pm_residents
                     ── vendor_vendors
                     ── auth.users
        └── comms_notifications ── auth.users
```

M2 then adds:

```
comms_conversations ── organizations / property_properties / lease_agreements / pm_residents
  └── comms_conversation_participants
  └── comms_conversation_messages ── comms_message_reads
comms_notifications.conversation_id ── comms_conversations
media_attachments.related_entity_type += conversation_message
```

### M1 — capability rows (additive)

Insert if missing (`on conflict do nothing`):

- `platform.communications:read`
- `platform.communications:write`

Grant to the same roles as the repo remediations file (`organization_admin`, `property_manager`, `leasing_agent`, `maintenance_technician` read, `property_owner` / `tenant` / `vendor` read as in that file). This does **not** change SKU entitlements (`platform.communications` + `pm.portal_tenant` remain application-layer).

Do **not** insert document capabilities (already present). Do **not** invent `pm.portal_tenant` as a database capability.

### Explicitly excluded from M1

- Any `drop table` / `drop column` / data rewrite
- FIN-OPS charge, payment, ledger, receipt, or webhook tables
- Replacing `is_org_member`
- Changing `lease_agreements` RLS
- `document_documents` create or policy rewrite
- Alters to `financial_notifications` / `maintenance_notifications`
- Mapping or deleting `conversation_threads` / `communication_messages` / `in_app_notifications`
- Mapping `tenants` / `leases` → `pm_residents` / `lease_agreements` / `lease_residents`
- Billing, Stripe, SKU, or commercial-flow objects
- Facility Operations tenant inbox objects
- Feature changes to COM-002 v1

### Apply sequence (after Approve — not authorized now)

1. Merge PR #188 (or equivalent) so M2 exists on `main`.
2. Add M1 to the repo and apply to `mpa-prod`, then apply M2.
3. Verify: four conversation tables exist; `comms_notifications.conversation_id` exists; legacy `conversation_*` row counts unchanged; `tenants` / `leases` counts unchanged; `media_attachments` still 6 rows unless new uploads occur.
4. Deploy and UAT remain a later production-release authorization (docs/82 unblock list).

---

## 3. Communication data safety

### Existing production records

| Store | Rows | Meaning |
|-------|------|---------|
| `conversation_threads` | 3 | `resident_maintenance` ×2 (maintenance), `resident_pm` ×1 (resident) |
| `communication_messages` | 2 | Bodies on those threads |
| `conversation_participants` | 2 | Legacy participants |
| `message_read_receipts` | 0 | Empty |
| `in_app_notifications` | 19 | Legacy inbox |

These tables are a **different model** (thread_type / source_entity / visibility / metadata JSON). ADR-024 rejected reusing a notices or generic thread store as the Tenant Communication Center.

### Determination

| Question | Answer |
|----------|--------|
| Is mapping required for COM-002 v1? | **No.** New conversations start empty in `comms_conversations`. |
| Remain untouched? | **Yes.** M1 and M2 must not select, update, or delete these rows. |
| Future migration needed? | **Optional, separate design.** Only if Product Owner later wants historical resident_pm / resident_maintenance threads in the new inbox. That is not this package. |

Preserved tenant/property relationships:

- Legacy `tenants` (35) and `leases` (18) stay authoritative for the old store.
- New-model `pm_residents` / `lease_agreements` stay empty until operators create residents/leases through existing product flows.
- This package does not invent a bridge. COM-002 v1 messages only tenants that exist as `pm_residents` with a `lease_id`.

---

## 4. Safety review

| Check | Result |
|-------|--------|
| Additive only | **Yes** — create-if-not-exists tables, one helper, capability inserts |
| Destructive migrations | **None** |
| Existing `conversation_*` / `communication_messages` | Untouched |
| Existing `tenants` / `leases` / `pm_residents` / `lease_agreements` | Untouched |
| Existing `media_attachments` rows | Untouched in M1; M2 only widens a check constraint |
| `is_org_member` / `is_org_manager` | Unchanged |
| Preview / repo databases that already have M1 objects | Idempotent no-op |
| Billing / Stripe | Unchanged |
| Facility Operations tenant messaging | Not introduced |

Residual product fact (not a schema defect): production has **zero** `pm_residents` and **zero** `lease_agreements`. Authenticated tenant UAT still needs controlled new-model test accounts after deploy. That is data setup, not this compatibility package.

---

## 5. Rollback considerations

Rollback is only meaningful after a future approved apply. Design it now.

**If only M1 has been applied and the three new tables are empty:**

1. Drop policies on `comms_notifications`, `comms_messages`, `lease_residents`.
2. Drop those three tables.
3. Drop `is_lease_resident()` only if no other production object depends on it (none do today).
4. Leave capability rows in place (harmless) or delete the two keys if unused.

**If M2 has also been applied:**

1. Confirm `comms_conversations` (and children) have no rows you must keep, or accept that rollback deletes new COM-002 threads only.
2. Drop COM-002 conversation tables (children first) and `can_access_tenant_conversation` / `is_pm_staff`.
3. Drop `comms_notifications.conversation_id`.
4. Restore `media_attachments_related_entity_type_check` without `conversation_message` only if no row uses that type.
5. Then follow the M1 rollback.

**Never** drop or truncate `conversation_threads`, `communication_messages`, `conversation_participants`, `message_read_receipts`, `in_app_notifications`, `tenants`, or `leases` as part of rollback.

---

## 6. Proposed migration text (specification only)

The following is the approved *shape*. Implementation lives at `supabase/migrations/20260814005000_com_002_prod_compat_prerequisites.sql`.

```sql
-- M1 com_002_prod_compat_prerequisites
-- Additive. Idempotent. No FIN-OPS financial tables. No LAUNCH-001 documents.
-- Do not apply until docs/83 is Approved.

create table if not exists public.lease_residents ( /* columns in §2 */ );
create index if not exists lease_residents_user_idx on public.lease_residents (user_id) where user_id is not null;

create or replace function public.is_lease_resident(target_lease_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.lease_residents residents
    where residents.lease_id = target_lease_id
      and residents.user_id = auth.uid()
  );
$$;

create table if not exists public.comms_messages ( /* columns in §2 */ );
create table if not exists public.comms_notifications ( /* columns in §2; no conversation_id */ );
-- indexes + enable RLS + policies in §2
-- capability inserts on conflict do nothing
```

Then apply unchanged `20260814010000_com_002_tenant_communication_center.sql`.

---

## Constitution

| Rule | Status |
|------|--------|
| Three products only | Compatibility for a Shared Platform / PM capability |
| Facility Operations | No tenant messaging objects |
| Enterprise | Not a product or SKU |
| Commercial flow | Unchanged |
| Billing / Stripe | Unchanged |
| Implementation Gate | Approved — M1 implement only; no production apply |

---

## Stop

Design is **Approved**. M1 may be written to `supabase/migrations/`. **Do not apply M1 to `mpa-prod` and do not deploy** until a later production-release authorization.
