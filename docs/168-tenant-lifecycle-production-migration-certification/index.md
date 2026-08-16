# 168 — Tenant Lifecycle Production Migration Certification

**Title:** TENANT LIFECYCLE PRODUCTION MIGRATION CERTIFICATION  
**Status:** **READY FOR TENANT LIFECYCLE PRODUCTION MIGRATION APPLICATION**  
**Date:** 2026-08-16  
**Program:** Customer-facing tenant lifecycle — read-only Production migration certification  
**Authority:** [docs/165](../165-phase-4-pwa-install-device-experience/index.md) **Approved** · [docs/166](../166-tenant-lifecycle-onboarding-portal-move-out/index.md) **Approved** · [docs/167](../167-tenant-lifecycle-implementation-certification/index.md) **READY FOR TENANT LIFECYCLE PRODUCTION MIGRATION CERTIFICATION** · docs/135 · ADR-012 · ADR-019 · ADR-026 · ADR-032 · ADR-033 · ADR-034  
**Target:** `mpa-prod` / `vahnmcrpnuggxkivynvo` (us-west-2, Postgres 17.6.1.141, `ACTIVE_HEALTHY`)  
**Certified migration:** `supabase/migrations/20260816120000_docs_166_tenant_lifecycle.sql`  
**This package:** Read-only Production certification only. **No apply. No deploy. No tenant invitation. No move-out. No lease/resident mutation. No FIN-OPS money mutation. No July reopen. No Stripe payment execution. No M5. No SKU/subscription/pricing change. No native apps. No Web Push. No substitute SQL.**

Identifier collision: **COM-002** means Tenant Communication Center (ADR-024 / docs/80), not Self-Service Commercial.

---

## Verdict

**READY FOR TENANT LIFECYCLE PRODUCTION MIGRATION APPLICATION**

Live Production matches the docs/166 / docs/167 assumptions. Stamp `20260816120000` is absent. Occupancy columns, helpers, and `organization_invitation_tenant_bindings` are absent. Every current `lease_residents` row joins deterministically to `pm_residents` by organization + email. The one portal-capable tenant backfills to **occupying** on an active lease and keeps current-unit access under the new helpers. The live Production application (`867c579b`) does not read occupancy columns, so schema-first is safe. Staff invitation semantics, FIN-OPS money, July freeze, Stripe execution, M5, SKUs, and PLAT-005 / ADR-033 staff paths are unchanged by this SQL.

This record authorizes a later separate Owner-authorized **apply of `20260816120000` only**. It does **not** apply that stamp, deploy the tenant-lifecycle application, or run authenticated UAT mutations.

---

## What this package did not do

- Did not apply `20260816120000`
- Did not create substitute SQL
- Did not deploy the tenant-lifecycle application
- Did not create or send a live tenant invitation
- Did not move out a resident or mutate occupancy
- Did not modify lease/resident relationships
- Did not mutate FIN-OPS money, reopen July, or enable Stripe payment execution
- Did not implement M5
- Did not modify SKUs, subscriptions, or pricing
- Did not implement native iOS/Android apps or Web Push

---

## 1. Live Production baseline

Read-only 2026-08-16 against `mpa-prod` / `vahnmcrpnuggxkivynvo` as `postgres`. Compared to docs/166, docs/167, and the live M4 ledger.

| Item | Live | Gate |
|------|------|------|
| Project | `mpa-prod` / `vahnmcrpnuggxkivynvo` | match |
| Health | `ACTIVE_HEALTHY` | match |
| Region / Postgres | us-west-2 / 17.6.1.141 (`PostgreSQL 17.6`) | match |
| Database / role | `postgres` / `postgres` | match |
| Production application SHA | `867c579bad30a5417c4cc682e90790627a55052d` (GitHub Production 2026-08-16T07:42:07Z; `origin/main` tip) | M4 app; **no** tenant-lifecycle deploy |
| Ledger tip | `20260816074525` / `docs_161_fin_ops_reconciliation_m4_write_rls` | expected M4 tip |
| `20260816120000` | **absent** | match — not registered |
| Unused FIN-OPS stamps `20260816070000` / `20260816070100` / `20260816080000` | **absent** | match — do not replay |
| Occupancy successor objects | all null (see §1.1) | match — docs/166 not live |
| FIN-OPS writes | `finance_ops_writes_enabled() = true` via `finance_ops_cutover_state.writes_enabled` | unchanged; this SQL does not touch the guard |
| July | `july_freeze_enabled = true` (updated 2026-08-16 07:52:09+00) | frozen; this SQL does not reopen |
| Stripe execution | all inspected `financial_module_settings.stripe_payment_execution_enabled = false`; `late_fees_enabled = false` | off |
| M5 | not present in this migration or live occupancy schema | remains disabled |

No unexplained lineage or schema drift. Baseline gate: **PASS**.

### 1.1 Docs/166 objects currently absent

| Object | Live `to_regclass` / `to_regprocedure` |
|--------|----------------------------------------|
| `public.organization_invitation_tenant_bindings` | null |
| `public.tenant_occupancy_events` | null |
| `public.utc_today()` | null |
| `public.member_is_tenant_only(uuid)` | null |
| `public.tenant_occupies_lease(uuid)` | null |
| `public.tenant_occupied_lease(uuid)` | null |
| `public.tenant_can_select_document(uuid)` | null |
| `public.tenant_can_write_conversation(uuid)` | null |
| `public.finance_resident_can_select_charge(uuid)` | null |

`lease_residents` live columns: `id`, `organization_id`, `lease_id`, `user_id`, `display_name`, `email`, `is_primary`, `financial_status`, `created_at`. **No** `pm_resident_id`, `occupancy_status`, `occupy_from`, `occupy_to`.

### 1.2 Current counts

| Table | n |
|-------|--:|
| `organizations` | 21 |
| `organization_memberships` | 36 |
| `organization_invitations` | 14 |
| `lease_agreements` | 15 |
| `lease_residents` | 15 |
| `pm_residents` | 15 |
| `property_units` | 22 |
| `financial_charges` | 18 |
| `financial_payments` | 11 |
| `financial_receipts` | 1 |
| `financial_payment_allocations` | 11 |
| `comms_conversations` | 2 |
| `comms_conversation_messages` | 8 |
| `comms_messages` | 0 |
| `conversation_threads` (legacy) | 3 |
| `maintenance_work_orders` | 33 |
| `document_documents` | 1 |
| `saas_subscriptions` | 4 |
| `organization_subscriptions` | 6 |

`financial_charges` is 18 versus the M3-era 17. The additional row is Property Demo lease `a11ce002-0001-4000-8000-000000000401`, amount `17.16`, status `open`, `due_at` 2026-08-16. That is post-M4 operational data, not a ledger-stamp successor. Payment IDs still hash to the M3 payment identity hash `2e0152700616760386f3dfae332312a1`.

### 1.3 Safety hashes (before apply)

ID method: `md5(string_agg(id::text, ',' order by id::text))`.

| Table | n | ID hash |
|-------|--:|---------|
| `organizations` | 21 | `58621de89e48a4bcd3b0514f654be1ba` |
| `organization_memberships` | 36 | `606d49c2dc34bf6cab12b10dd74cc8bc` |
| `organization_invitations` | 14 | `f697f696f1abb3bfb8414446f2913e63` |
| `lease_agreements` | 15 | `bb5e82194aaf26237737b35289d1a93b` |
| `lease_residents` | 15 | `df7ee4bfb2dd96f45be9dc4358b89f5b` |
| `pm_residents` | 15 | `a3935a800b50525690edeb25e0b812ee` |
| `property_units` | 22 | `38aeed10d772980d2525f8d66d52ecd7` |
| `financial_charges` | 18 | `a5a2e3ad6d56fd23d8fa0413f7362d02` |
| `financial_payments` | 11 | `2e0152700616760386f3dfae332312a1` |
| `financial_receipts` | 1 | `c1a92f1f39a2c544c6385e411b8e0e2a` |
| `financial_payment_allocations` | 11 | `a0a83f939a56bb185570430d12981a01` |
| `comms_conversations` | 2 | `aa96e90236d5b898992850dbfe022ece` |
| `comms_conversation_messages` | 8 | `b92903b2f6a90ebe6b63c0e702f9f4ff` |
| `conversation_threads` | 3 | `a5fd4dba0acac939436bc2188ae89dd1` |
| `maintenance_work_orders` | 33 | `ebaeae04c257973913db8b67aa89448c` (id+status) |
| `document_documents` | 1 | `5ac5efc787017318707479f64b188ba9` |
| `saas_subscriptions` | 4 | `ac31d51669142b22e3433031b1c67ad2` |

Money-column hashes (must be unchanged after apply):

| Table | Method | Hash |
|-------|--------|------|
| `financial_charges` | id + amount + status + lease_id | `e86487062cba4aeacef245b49c720335` |
| `financial_payments` | id + amount + status | `1427d3aace128cd565802ee21a0da698` |
| `financial_receipts` | id + amount | `27e1b44a8d042d3c428737ae15c796c3` |
| `financial_payment_allocations` | id + amount | `f4b217d66fb431497125aed8bf048b3c` |

Expected after apply: same identity counts and money hashes. `lease_residents` gains four columns; row count stays 15. New table `organization_invitation_tenant_bindings` starts at **0** rows.

---

## 2. Exact migration

| Field | Value |
|-------|--------|
| File | `supabase/migrations/20260816120000_docs_166_tenant_lifecycle.sql` |
| SHA-256 | `4b1edb1f6150f70160577e2e1fba759bf4e15f92d7d6f6f3ca64bfd06f09a0c2` |
| Size | 19,132 bytes / 599 lines |
| Matches docs/167 | yes |

Statement classes (function-body internals excluded):

| Class | Count |
|-------|------:|
| `ALTER` | 11 |
| `UPDATE` (occupancy backfill / null repair) | 4 |
| `CREATE TABLE` | 1 |
| `CREATE OR REPLACE FUNCTION` | 13 |
| `DROP POLICY` / `CREATE POLICY` | 14 / 14 |
| `CREATE INDEX` | 3 |
| `REVOKE` | 10 |
| `GRANT` | 13 |

No `DROP TABLE`. No `DELETE FROM`. No `TRUNCATE`. July / Stripe / M5 / SKU / push / native strings appear only as comments or are absent.

### 2.1 Objects created or altered

**Altered**

- `lease_residents.pm_resident_id uuid REFERENCES pm_residents(id) ON DELETE SET NULL`
- `lease_residents.occupancy_status text NOT NULL DEFAULT 'occupying'` with check `scheduled|occupying|moved_out`
- `lease_residents.occupy_from date NOT NULL DEFAULT (timezone('utc', now()))::date`
- `lease_residents.occupy_to date` nullable

**Created**

- `organization_invitation_tenant_bindings` (PK `invitation_id`)
- indexes `lease_residents_pm_resident_idx`, `lease_residents_occupancy_user_idx`, `organization_invitation_tenant_bindings_org_idx`

**Helpers created**

- `utc_today()`
- `member_is_tenant_only(uuid)`
- `tenant_occupancy_is_current(date, date, text)`
- `tenant_occupancy_is_historical(date, date)`
- `tenant_occupies_lease(uuid, uuid)`
- `tenant_occupied_lease(uuid, uuid)`
- `tenant_finance_charge_date(date, date, timestamptz)`
- `finance_resident_can_select_charge(uuid, uuid, date, date, timestamptz)`
- `tenant_can_write_conversation(uuid, uuid, uuid)`
- `tenant_can_select_document(uuid, text, uuid, timestamptz)`

**Helpers replaced (same signatures)**

- `finance_resident_owns_lease(uuid, uuid)` → current occupancy only
- `is_lease_resident(uuid)` → current occupancy only
- `can_access_tenant_conversation(uuid, uuid, uuid)` → own person + occupy **or** occupied (staff path unchanged)

**RLS replaced (resident / tenant-leak paths only)**

- `pm_residents_select_member`
- `lease_agreements_select_member`
- `lease_residents_select`
- `document_documents_select_member`
- `financial_charges_select_resident` and sibling resident SELECT on payments, receipts, allocations, ledger, charge schedules
- `comms_thread_messages_insert`
- `maintenance_work_orders_insert_resident`
- binding table SELECT/ALL for `is_resident_writer`

Staff FIN-OPS SELECT/INSERT/UPDATE policies, `document_documents_write_manager`, invitation docs/135 policies, and `can_select_work_order` are **not** dropped.

### 2.2 Scope confirmation

Implements only docs/166:

- occupancy fields on the existing household table
- server-owned invitation binding
- occupancy authorization helpers
- approved RLS tighten
- no new person domain

Does **not**:

- create another resident/person table
- delete residents, leases, finance, communications, maintenance, or documents
- rewrite FIN-OPS amounts/status
- reopen July or touch `finance_ops_cutover_state`
- alter Stripe execution
- implement M5
- change SKUs / subscriptions / pricing
- create native-app or Web Push schema
- weaken PLAT-005 (no new privileged mutation RPC; accept remains service-role after server checks)
- weaken ADR-033 (`member_has_finance_capability` unchanged)
- add broad authenticated or org-member tenant access (tenant-only members **lose** org-wide dumps)

---

## 3. `lease_residents` compatibility

Unmatched org+email joins: **0**. Every row can be classified from existing lease/resident facts. No invented occupancy dates.

| Live fact | Backfill |
|-----------|----------|
| `pm_resident_id` | `pm_residents.id` where same `organization_id` and `lower(email)` |
| `occupancy_status` | `moved_out` if `lease_agreements.status = 'ended'`, else `occupying` |
| `occupy_from` | `lease_agreements.start_date` (`date`) |
| `occupy_to` | `lease_agreements.end_date` only when lease `ended`; otherwise null |

The later `occupy_from = utc today` repair runs only if `occupy_from` is still null. **Zero** current rows would hit it: all 15 leases have `start_date`.

### 3.1 Expected row outcomes

| lease_residents email | lease status | start | end | expected status | occupy_from | occupy_to | `user_id` |
|-----------------------|--------------|-------|-----|-----------------|-------------|-----------|-----------|
| 13 × `*@dev.mpa.local` | active | 2025-01-01 | 2025-12-31 | occupying | 2025-01-01 | null | null |
| `ep016.resident+…@example.com` | active | 2026-07-01 | 2027-06-30 | occupying | 2026-07-01 | null | null |
| `uat.tenant.property.demo@…` | active | 2026-08-14 | 2027-08-14 | occupying | 2026-08-14 | null | `6cde6423-…` |
| `maya.lopez@example.com` | ended | 2026-08-01 | 2027-07-31 | moved_out | 2026-08-01 | 2027-07-31 | null |

Maya’s lease is already `ended` while `end_date` is still in the future. Classification uses **lease status** (existing fact) and stores **lease.end_date** (existing fact). Helpers then treat `moved_out` as not current. She has no `user_id`, so no portal session is affected. Historical SELECT requires `occupy_to < utc_today()`; until 2027-07-31 that window is not historical either. That is fail-closed, not a guess.

Existing active tenants do not lose access merely because the stamp lands: the one linked occupant backfills to occupying with `occupy_to` null.

Existing historical/legacy rows remain valid: Maya’s row is kept; no delete.

---

## 4. Canonical identity compatibility

Live model already matches docs/166. The migration adds a pointer; it does not add a third person domain.

```
auth.users
  → organization_memberships (role may include tenant; may outlive occupancy)
  → pm_residents (person; UNIQUE (organization_id, email); current property/unit/lease pointers)
  → lease_agreements.resident_id → pm_residents
  → lease_residents (household + FIN-OPS + future occupancy grant)
  → lease → unit → property → organization
```

| FK / type check | Live | Migration |
|-----------------|------|-----------|
| `pm_residents.id` | uuid PK | `lease_residents.pm_resident_id` uuid |
| `organization_invitations.id` | uuid PK | binding `invitation_id` uuid PK |
| `organizations.id` | uuid | binding `organization_id` uuid |
| `property_properties.id` | uuid | binding `property_id` uuid |
| `property_units.id` | uuid | binding `unit_id` uuid NOT NULL |
| `lease_agreements.id` | uuid | binding `lease_id` uuid |
| `pm_residents.id` | uuid | binding `resident_id` uuid |
| `lease_residents.id` | uuid | binding `lease_resident_id` uuid |
| lease dates | `date` | occupancy dates `date` |
| charge `period_start` / `due_at` | `date` | helper dates `date` |

All 15 leases have `unit_id` and `resident_id` (0 nulls). Binding `unit_id NOT NULL` is compatible with current rows.

`pm_residents.user_id` and `lease_residents.user_id` already reference `auth.users(id)`. No type drift.

---

## 5. Invitation binding compatibility

Live `organization_invitations` is the docs/135 table: token uuid, roles, status, `operating_scope`, `property_ids`, no resident/lease/unit FKs.

RLS live:

- SELECT: `invitation:read` **or** invitee email match
- INSERT: `invitation:create`
- UPDATE: authorized staff path (unchanged by this SQL)

`organization_invitation_tenant_bindings` references the live invitation / org / property / unit / lease / resident / lease_resident PKs without ambiguity (1:1 on `invitation_id`).

Existing invitations:

| Class | n | After apply |
|-------|--:|-------------|
| Staff / PM / admin (accepted, pending, expired, revoked) | 12 | remain valid; **no** binding row required |
| Tenant role revoked (AUTH001C) | 1 | remains revoked; no binding |
| Tenant role pending (`ep016.resident+…`, org `f88ee244-…`) | 1 | remains pending; binding table empty |

Staff Complete invitations (Sarah / Mike / Erick class and docs/135 fixtures) do not gain occupancy FKs. Browser still cannot assign org/property/unit/lease/resident: binding writes are `is_resident_writer` only; invitees have no insert policy; acceptance mutations stay on trusted service-role after server checks (docs/167).

The pending tenant invitation has empty `property_ids` and no occupancy FKs today. The **current** Production app can still accept it the old way after schema apply (no binding read). The **later** tenant-lifecycle app fail-closes accept without a binding (409). That is approved, not a staff-invitation break. Do not send or accept that invite during apply.

`is_resident_writer(uuid)` exists in Production.

---

## 6. Occupancy authorization analysis

Core rule holds in the proposed SQL: **authentication ≠ current occupancy**. `member_is_tenant_only` plus occupying helpers replace org-member dumps.

| Persona | Current unit tenant access after apply | Notes |
|---------|----------------------------------------|-------|
| Active Tenant (UAT Property Demo) | allow own occupying lease | backfill occupying; `user_id` set |
| Former Tenant | deny current; historical only when `occupy_to < utc_today()` | Maya has no auth link |
| Future Tenant (`scheduled` and `occupy_from > utc_today()`) | deny current | no such live row |
| Tenant on another unit | deny | helpers key `lease_id` + `user_id` |
| Tenant in another org | deny | org scoped |
| Property staff | unchanged staff policies / capabilities | not tenant-only |
| Facility-only staff | ADR-033 `member_has_finance_capability` unchanged | residential SKU ∩ scope still required |
| Vendor | `can_select_work_order` vendor path unchanged | no tenant dump |
| Anonymous | `anon` execute on new helpers revoked; existing `anon` execute on live helpers already false | fail closed |

Old sessions re-evaluate at API/RLS time. Helpers read `utc_today()` and occupancy columns. Logout is not required for offboarding.

Live today (for contrast): `finance_resident_owns_lease` is occupancy-blind (lease_residents.user_id **or** email match to `pm_residents.user_id`). `is_lease_resident` is any `lease_residents.user_id` match. Documents SELECT is `is_org_member` (tenant leak). The migration closes those.

---

## 7. Current tenant compatibility and split-state

Portal-capable auth linkages:

| user_id | org | membership | pm_residents | lease_residents.user_id |
|---------|-----|------------|--------------|-------------------------|
| `6cde6423-ad9b-49fb-aadd-3ea93ec8b040` | M.P.A. UAT Property Demo `a11ce002-…00c2` | active `['tenant']` | portal `active`, lease `…0401` | **yes** |
| `ae535843-c615-4b52-bf9d-efd108c464e1` | MPA QA Certification | active `['tenant']` | **none** | **none** |
| `a7ec967f-eaf5-4375-a72b-ae8f1d90e0f4` | AUTH001C Validate Org | **inactive** `['tenant']` | none | none |

Only the Property Demo user is a live Tenant Portal occupant.

Production app `867c579b` Tenant Portal layout gates on membership role `tenant` only. `git grep` on `origin/main` finds **zero** references to `occupancy_status`, `occupy_from`, `tenant_occupies_lease`, or `organization_invitation_tenant_bindings`.

Immediately after schema apply and **before** app deploy:

| Surface | Old app + new schema |
|---------|----------------------|
| Portal chrome | still membership-gated; UAT tenant still enters |
| Own lease / lease_residents / pm_residents SELECT | occupying + `user_id = auth.uid()` still true |
| FIN-OPS resident SELECT | `finance_resident_owns_lease` becomes occupying; UAT tenant still occupying; charge `17.16` remains visible |
| COM-002 read | `can_access_tenant_conversation` still true for the two Property Demo threads (`tenant_account_id` `…0301`, lease `…0401`) |
| COM-002 insert | occupying write helper; UAT tenant still occupying |
| Maintenance insert | occupying + matching unit/property; UAT tenant `portal_status=active` and occupying |
| Documents | tenant-only loses org-wide SELECT; Property Demo has **0** documents; the one live document is Clinic Complete `entity_type=organization` |
| QA Certification leftover tenant | loses org-wide lease/document dump; already has no resident/lease — chrome may still open, data stays empty. Intended tighten, not a customer occupant |

Schema-first does **not** break the existing Tenant Portal. Coordinated deploy is not required for safety. Deploying the occupancy-required app **before** this stamp **would** break (columns/helpers missing).

---

## 8. FIN-OPS resident policy compatibility

Staff policies remain. Resident SELECT policies switch from occupancy-blind `finance_resident_owns_lease` to `finance_resident_can_select_charge` (occupying **or** historical date window). Charge schedules become occupying-only.

| Rule | Proof |
|------|--------|
| Active tenant sees only own authorized charges/payments/allocations/receipts | helper requires `user_id = auth.uid()` and current occupancy on that `lease_id` |
| Former tenant sees only own historical records | charge date `between occupy_from and occupy_to` and `occupy_to < utc_today()` |
| Future / new occupant cannot see former history unless same authorized resident identity | new occupancy is a new row; date window is that row’s; person reuse still requires the **same** `user_id` |
| Tenant B cannot see Tenant A | `user_id` match; no org-member resident finance |
| No tenant staff-finance capability | `member_has_finance_capability` unchanged |
| Move Out does not modify money | this SQL has no `UPDATE` on `financial_*` money columns; later Move Out is occupancy metadata only (docs/166 / 167) |
| July stays frozen | `finance_ops_cutover_state` not referenced |

UAT tenant charge `f2a6d161-…` / `17.16` / `open` remains selectable after occupying backfill.

---

## 9. COM-002 compatibility

Live insert: `sender_user_id = auth.uid()` AND `can_access_tenant_conversation`. Live `can_access` requires `is_lease_resident` plus current `pm_residents.lease_id` pointer.

After apply:

- SELECT policy `comms_thread_messages_select` is **not** dropped — historical rows remain
- `can_access_tenant_conversation` allows occupy **or** occupied for the same `user_id` + `tenant_account_id`
- insert policy becomes staff **or** `tenant_can_write_conversation` (occupying only)

| Rule | Proof |
|------|--------|
| Active tenant can participate | UAT tenant occupying; two threads already bound to `…0301` / `…0401` |
| Former tenant retains approved historical thread access | SELECT via occupied + own person |
| Former cannot create/receive new unit/lease conversations | insert occupying-only; new threads use another person/lease |
| Other tenant/unit/org denied | org + lease + person match |
| Historical rows not deleted | no DELETE; 2 conversations / 8 messages stay |

Residual (not blocking): the replacement insert policy does not repeat `sender_user_id = auth.uid()`. The application still sets sender to the session user. This does not restore org-wide tenant access. Do not “fix” it with substitute SQL in the apply package.

Legacy `conversation_threads` (3 rows) is untouched.

---

## 10. Maintenance compatibility

`can_select_work_order` is **unchanged** (PLAT-002 fail-closed: manager / technician / own requester / own `resident_id` / vendor). Org-member tenants do not gain work-order SELECT.

Insert resident policy today: requester = `auth.uid()`, residential surface, `pm_residents.user_id` + `portal_status = 'active'`.

After apply: requester = `auth.uid()`, occupying occupancy on the same person, lease property/unit must match the work order.

| Rule | Proof |
|------|--------|
| Active tenant may create/read authorized maintenance | UAT occupying + existing PLAT-002 own-WO SELECT |
| Former cannot create current-unit maintenance | occupying required |
| Historical tenant maintenance preserved | no DELETE; SELECT still own resident/requester |
| Membership alone does not expose another unit | insert ties occupancy lease property/unit; SELECT is not org-member |
| No work-order history deletion | 33 rows remain |

---

## 11. Document access compatibility

Live `document_documents_select_member` = `is_org_member(organization_id)` — too broad (docs/166 finding).

After apply: `tenant_can_select_document` **or** (`is_org_member` AND NOT `member_is_tenant_only`).

`document_documents_write_manager` unchanged — OPS-001 staff write remains.

Live document: `1e9aa31d-…`, org Clinic Complete `a11ce001-…c11c`, `entity_type=organization`. Tenant-only members cannot read it after apply. Staff members still can. Property Demo UAT tenant is not in that org.

| Rule | Proof |
|------|--------|
| Active tenant: only lease/resident-authorized documents | helper keys occupancy lease_id / pm_resident_id |
| Former: own historical lease/resident docs with `created_at::date <= occupy_to` | historical branch |
| Tenant cannot read staff/internal docs via membership | tenant-only excluded from org-member path |
| OPS-001 staff intact | write manager + non-tenant-only SELECT |

---

## 12. Move-out semantics

Production types support the approved verbs without this package performing them.

| Verb | Schema support |
|------|----------------|
| Future-dated Move Out | set `occupy_to` future; status stays `occupying` until after that UTC date |
| Effective Move Out | `occupy_to < utc_today()` → historical; status `moved_out` when already past |
| Cancel future Move Out | clear/adjust `occupy_to`; status remains occupying |
| Auditable correction | occupancy update + event; **no** row delete |

Move Out is resident occupancy (`lease_residents` row), not `lease_agreements.status`. The SQL does not add a trigger that ends the lease.

Does not delete: resident, lease, FIN-OPS, maintenance, communications, documents, auth account.

Date semantics: lease `start_date` / `end_date` are `date`; occupancy columns are `date`; `utc_today()` is `(timezone('utc', now()))::date`. Inclusive through `occupy_to`. Production has no organization timezone column — UTC calendar date is the certified rule.

---

## 13. Multi-resident households

Live uniques:

- `lease_residents_lease_id_email_key` UNIQUE `(lease_id, email)`
- `pm_residents_organization_id_email_key` UNIQUE `(organization_id, email)`
- **no** UNIQUE `(lease_id)` only
- **no** UNIQUE `(pm_resident_id)`

Two residents may share one lease/unit when emails differ. Moving out Tenant A updates one occupancy row. Tenant B is untouched. Replacement resident is a new `lease_residents` row. Current Production happens to be 1:1 (15 leases / 15 residents); the migration does not force that.

---

## 14. Returning tenant / transfer

Same `pm_residents` identity can be reused (`UNIQUE (organization_id, email)`). Same `auth.users` can be reused (`user_id` nullable, no unique). Old occupancy stays a historical row. New occupancy is a new `lease_residents` row on the new lease/unit.

Unit transfer = end occupancy A + start occupancy B. No destructive rewrite. Historical Unit A charges/messages/WOs/documents remain keyed to the old lease/person.

---

## 15. PWA split-state

docs/165 is application-layer (manifest / install copy / `beforeinstallprompt`). This migration creates no PWA, push, or native tables.

PWA installation remains optional. Browser onboarding remains the docs/135 accept path. Apple and Android presentation must not affect authorization. No native app dependency.

The live Production app has no occupancy-required PWA card. Schema apply does not require a PWA deploy.

---

## 16. Security review

| Check | Result |
|-------|--------|
| Anonymous privileged mutation helper | none; `REVOKE ALL … FROM public, anon` on new helpers |
| Client-callable SECURITY DEFINER accept / move-out bypass | none created; binding invitee insert absent |
| Trusted invitation acceptance | remains server-side service-role after session checks (docs/135 / 167) |
| Browser cannot mutate binding FKs | no invitee write policy; body ignored by later app |
| PLAT-005 | no new privileged execute surface; existing live helpers stay `anon` execute **false** |
| PLAT-002 | `can_select_work_order` body unchanged |
| ADR-033 | staff finance capability helper unchanged |
| New helper grants | `authenticated` + `service_role` execute on read helpers only |

`utc_today` is `STABLE` not `SECURITY DEFINER`. Occupancy predicates that read `auth.uid()` are `SECURITY DEFINER` + `search_path = public` (same pattern as live `finance_resident_owns_lease`).

---

## 17. Data safety

The apply alters schema, security helpers, and occupancy metadata only.

| Domain | Before | Expected after |
|--------|--------|----------------|
| Memberships | 36 / hash `606d49c2…` | same rows |
| Invitations | 14 / hash `f697f696…` | same rows |
| Leases | 15 / hash `bb5e8219…` | same rows |
| `lease_residents` | 15 / hash `df7ee4bf…` | same 15 IDs; four additive columns |
| `pm_residents` | 15 / hash `a3935a80…` | same rows |
| Units | 22 / hash `38aeed10…` | same rows |
| FIN-OPS money | hashes in §1.3 | **unchanged amounts/status** |
| Work orders | 33 | same rows |
| COM-002 | 2 / 8 | same rows |
| Documents | 1 | same row |
| Subscriptions | 4 saas / 6 org | same rows |
| Bindings | absent | 0 rows |

No financial amount/status mutation. No customer historical record deletion.

---

## 18. Application release order

docs/166 §29 asked for a compatible app before occupancy-required RLS so tenants are not locked out. That compatible app is **already live**: Production `867c579b` ignores occupancy columns.

| Order | Safety |
|-------|--------|
| **A. schema apply → validate → deploy tenant-lifecycle app** | **SAFE** — recommended |
| B. deploy occupancy-required app first | **UNSAFE** — columns/helpers missing |
| Coordinated same-window apply+deploy | acceptable, not required |

Recommended Owner sequence after this record:

1. Apply `20260816120000` only
2. Re-read counts/hashes and confirm UAT tenant occupying
3. Later package: deploy tenant-lifecycle application
4. Later package: controlled UAT
5. Stop

Do not apply in the same change as Stripe execution, M5, July work, SKU/pricing, native apps, or Web Push.

---

## 19. Production UAT plan (later; not this package)

Use controlled UAT fixtures only. Suggested org: Property Demo `a11ce002-0001-4000-8000-0000000000c2`. Known lease `a11ce002-0001-4000-8000-000000000401` and tenant `6cde6423-…` are **read orientation** until Owner authorizes new invitation or move-out.

Do **not** first-write finance, reopen July, or use Canopy / PMX / Development as the ceremony org.

| # | Script | Pass |
|---|--------|------|
| U1 | Manager Add Tenant (name, email, lease) | Invitation + binding; browser cannot set org/property/unit/lease/resident |
| U2 | New email: create account → accept | Trusted accept links correct identity |
| U3 | Existing email: sign in → accept | Same auth; no duplicate user/resident; idempotent retry |
| U4 | Active Tenant Portal | Correct property/unit; no staff chrome |
| U5 | Maintenance isolation | Own unit only; other unit denied |
| U6 | COM-002 isolation | Own threads only; other unit/org denied |
| U7 | FIN-OPS isolation | Own authorized history only; Tenant B denied; checkout still execution-disabled |
| U8 | Document isolation | No staff/internal dump |
| U9 | PWA | Apple Share → Add to Home Screen copy; Android install action when supported; already-installed suppression; browser remains usable |
| U10 | Future Move Out | Access remains through date inclusive |
| U11 | Effective Move Out | No delete; other household resident stays; unpaid balance survives; old session loses current-unit access; historical shell remains; no next-occupant leakage |
| U12 | Cancel future / correct effective | Audit events; no history delete |
| U13 | Return | Same auth/resident reused; new occupancy; old property does not reactivate |
| U14 | Facility-only Complete | Denied PM tenant finance (ADR-033) |
| U15 | Hashes | §1.3 money and historical counts unchanged |

Owner must authorize any live invitation send or Move Out. This certification performed **none**.

Existing pending tenant invitation `0da3b02d-…` must not be used as the UAT accept fixture after the new app deploys unless a server-owned binding is created.

---

## 20. Rollback

Rollback **before** Production implementation (this record; not performed):

| Situation | Action |
|-----------|--------|
| Bad RLS / helper after apply | Restore prior function bodies and prior resident policies from M4-era definitions recorded in this audit. **Keep** occupancy columns and any backfilled values. |
| Need to stop using occupancy | Leave columns unused; do not drop if rows are populated. |
| Wrong later Move Out | Cancel or correct (docs/166 §30). Do not delete occupancy history. |

Rollback must **not**:

- delete historical occupancy rows
- delete residents or leases
- delete finance rows
- reopen July
- delete communications, maintenance, or documents

Authorization restore = previous helper/policy SQL, not erasure of lifecycle metadata.

---

## 21. Exact next Owner-authorized step

**Apply** `supabase/migrations/20260816120000_docs_166_tenant_lifecycle.sql` (SHA-256 `4b1edb1f6150f70160577e2e1fba759bf4e15f92d7d6f6f3ca64bfd06f09a0c2`) to `mpa-prod` / `vahnmcrpnuggxkivynvo` in a later Owner-authorized package.

Then stop. Do not deploy the tenant-lifecycle application in that apply package. Do not create/send invitations. Do not move anyone out. Do not mutate FIN-OPS money.

---

## Approval / next gate

This certification does **not** apply the migration or deploy.

**Status: READY FOR TENANT LIFECYCLE PRODUCTION MIGRATION APPLICATION.**
