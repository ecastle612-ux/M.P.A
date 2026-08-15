# COMPLETE DELEGATED OPERATIONS — ADR-033 PRODUCTION MIGRATION CERTIFICATION

**Title:** COMPLETE DELEGATED OPERATIONS / ADR-033 PRODUCTION MIGRATION CERTIFICATION  
**Status:** READY FOR PRODUCTION MIGRATION APPLICATION  
**Date:** 2026-08-15  
**Program:** Complete Delegated Operations — Member Operating Scope  
**Authority:** [docs/127](../127-complete-delegated-operations/index.md) Approved · [ADR-033](../18-decision-log/adr-033-member-operating-scope.md) Accepted · in-repo implementation complete at `56ffb150`  
**Gate:** Design → Document → Approve → Implement → **Production migration certification** (ADR-012)  
**Target:** `mpa-prod` / `vahnmcrpnuggxkivynvo` (us-west-2, ACTIVE_HEALTHY)  
**Not the target:** `mpa-preview` / `drcbipqrxfqpjilsfxip`  
**This package:** **Read-only Production analysis only.**

---

## Verdict

**READY FOR PRODUCTION MIGRATION APPLICATION.**

The approved statements in `supabase/migrations/20260815200000_adr_033_member_operating_scope.sql` (implementation SHA `56ffb150`) are **additive against the actual Production lineage**. ADR-033 is **not** on Production today. Applying the schema will not delete memberships, invitations, subscriptions, SKUs, work orders, communications, FAC-003 rows, or July finance data.

This record **does not apply** the migration. It **does not deploy**. It **does not authorize** a Production application release. It **does not authorize** FIN-OPS remediation.

**Apply-time ledger stamp:** Production tip is `20260815175833` / `plat_006_finance_capability_grants`. The repo filename version `20260815200000` is **greater than** that tip. It is a **valid successor**. Do **not** invent a substitute stamp. Do **not** alter SQL semantics.

**Apply order:** schema first, while the current Production application (`44d50bf178b89842494671060852891087eed200`) continues to serve traffic. That split state is **safe** (section 9). Do **not** deploy the ADR-033 application before the schema. Do **not** assign Sarah/Mike scopes until the application is live.

---

## What this package did not do

- Did not call `apply_migration`
- Did not write to Production
- Did not deploy the application
- Did not merge for Production release
- Did not change Stripe / billing / SKUs / subscriptions / roles
- Did not create `financial_*` tables or replay FIN-OPS S0 / S1 / S2
- Did not modify July `financial_activity`
- Did not remediate docs/126
- Did not invent substitute SQL

---

## 1. Production baseline

Read 2026-08-15 against `mpa-prod` / `vahnmcrpnuggxkivynvo` via Supabase MCP `list_migrations` and `execute_sql` only. Production is authoritative.

### 1.1 Production application SHA

GitHub Deployments API, environment `Production`:

| Field | Value |
|-------|-------|
| SHA | `44d50bf178b89842494671060852891087eed200` |
| Created | `2026-08-15T18:09:36Z` |
| Meaning | Merge of PR #226 PLAT-006 finance grants, report shapes, and canonical post-auth routing |

That SHA has **zero** `operating_scope` references. A Preview exists for implementation SHA `56ffb150`. Preview is not Production.

### 1.2 Ledger tip

Last applied: **`20260815175833` / `plat_006_finance_capability_grants`**.

ADR-033 is **not** on the Production ledger (`adr033_on_ledger = false`).

Recent Production lineage (apply-time versions):

| Version | Name |
|---------|------|
| `20260814151825` | `plat_002_production_compat` |
| `20260814163540` | `fac_003_asset_inventory` |
| `20260814224518` | `fac_003_production_uat_remediation` |
| `20260814233536` | `ops_001_operational_workspace` |
| `20260815170604` | `plat_005_privileged_rpc_execute_hardening` |
| `20260815175833` | `plat_006_finance_capability_grants` |

FIN-OPS S0 / S1 / S2 (`20260806030000` / `20260806040000` / `20260806050000`) are **not** on the Production ledger. Do not replay them.

### 1.3 ADR-033 objects — confirmed absent

| Object | Production |
|--------|------------|
| `organization_memberships.operating_scope` | **false** |
| `organization_invitations.operating_scope` | **false** |
| `organization_operating_scope_events` | **null** |
| `member_operating_scope()` | **false** |
| `member_allows_work_surface()` | **false** |
| `financial_charges` | **null** (FIN-OPS object; out of scope) |
| `financial_activity` | present (July lineage; **12** rows; do not modify) |

`org_sku`, `org_allows_work_surface`, `is_pm_comms_staff`, `can_select_work_order`, and `can_manage_facility_ops` **exist** and are SKU-only today.

### 1.4 Organizations / memberships / invitations / SKUs

| Object | Count |
|--------|-------|
| `organizations` | 21 |
| `organization_memberships` | 31 (29 active) |
| `organization_invitations` | 4 |
| `organization_subscriptions` | 6 live |
| `saas_subscriptions` | 4 |

`organization_subscriptions` by SKU (authoritative commercial assignment):

| `sku_code` | `status` | n |
|------------|----------|---|
| `mpa_complete_platform` | `active` | **1** |
| `mpa_property_manager` | `active` | **5** |
| `mpa_facility_operations` | — | **0** |

No FO-only subscriber is live. The one Complete org is the only Facility-capable commercial audience.

### 1.5 Complete organizations and members

One Complete organization:

| Field | Value |
|-------|-------|
| Name | M.P.A. UAT Clinic Demo |
| Slug | `mpa-uat-clinic-demo` |
| Id | `a11ce001-0001-4000-8000-00000000c11c` |
| SKU | `mpa_complete_platform` / `active` |
| Memberships | 3 active |

| Membership id prefix | User id prefix | Roles | Stored `operating_scope` today |
|----------------------|----------------|-------|--------------------------------|
| `3398c1c6` | `ce12a723` | `organization_admin`, `property_manager` | **column does not exist** |
| `93beaa0c` | `bbc4cffa` | `organization_admin`, `property_manager`, `facility_technician` | **column does not exist** |
| `5ad386bf` | `efd879ed` | `vendor` | **column does not exist** |

There is **no** Sarah-equivalent (Complete `property_manager` + PROPERTY) and **no** Mike-equivalent (Complete `property_manager` + FACILITY) membership on Production. Both staff members are `organization_admin`. `facility_technician` is **not** a `USER_ROLES` value; Production `is_maintenance_technician` still accepts it. Do not revive it as a role.

Emails and passwords are intentionally omitted.

### 1.6 PM organizations and members

Five active Property Manager subscriptions. Memberships on those orgs:

| Organization | Active members | Roles |
|--------------|----------------|-------|
| M.P.A. UAT Property Demo (`a11ce002-…00c2`) | 3 | `property_manager`; `tenant`; `facility_technician` |
| `bug0121.cert.1786234101` | 1 | `organization_admin`, `property_manager` |
| `bug0121.final.1786235563` | 1 | `organization_admin`, `property_manager` |
| `bug0112.recon.pass` | 0 | — |
| `bug012.cert.1786233238` | 0 | — |

Remaining organizations have **no** live `organization_subscriptions` row (cert leftovers / AUTH / QA). They are not Complete and are not FO.

### 1.7 FO organizations and members

**Zero.** No `mpa_facility_operations` subscription exists on Production.

### 1.8 Invitations

| Id prefix | Org | SKU | Roles | Status |
|-----------|-----|-----|-------|--------|
| `0da3b02d` | Canopy Property Partners | none | `tenant` | pending |
| `1b659e20` | AUTH001C Validate Org | none | `property_manager` | accepted |
| `fae401aa` | AUTH001C Validate Org | none | `tenant` | revoked |
| `20044491` | AUTH001C Validate Org | none | `vendor` | expired |

No Complete invitation exists. No invitation has `operating_scope` (column absent).

### 1.9 Work orders / comms / FAC-003

| Object | Count |
|--------|-------|
| `maintenance_work_orders` | 32 (14 facility / 18 residential) |
| `maintenance_work_order_updates` | 43 |
| `facility_assets` | 6 |
| `facility_stock_items` | 2 |
| `comms_conversations` | 2 |
| `comms_conversation_messages` | 8 |
| `comms_messages` | 0 |
| `conversation_threads` | 3 |
| `communication_messages` | 2 |
| `financial_activity` | 12 (July lineage; do not touch) |

### 1.10 Current Production helpers (pre-ADR-033)

Captured from `pg_get_functiondef` on `mpa-prod`.

| Helper | Contract today |
|--------|----------------|
| `org_sku(org)` | Live `organization_subscriptions.sku_code` where status is distinct from `canceled` |
| `org_allows_work_surface(org, surface)` | SKU-only. Residential ∈ {PM, Complete}. Facility ∈ {FO, Complete} |
| `is_pm_comms_staff(org)` | Staff roles + SKU ∈ {PM, Complete}. **No member scope** |
| `can_select_work_order(id)` | Manager/tech + `org_allows_work_surface`; resident/vendor self-access separate. **No member scope** |
| `can_manage_facility_ops(org)` | `is_maintenance_manager` AND `org_allows_work_surface(..., 'facility')`. **No member scope** |
| `can_access_tenant_conversation(...)` | `is_pm_comms_staff` OR lease resident self-access |
| `can_select_facility_stock_item(id)` | Delegates to `can_manage_facility_ops` |
| `is_maintenance_manager` | `organization_admin` or `property_manager` |
| `is_maintenance_technician` | `maintenance_technician` **or** `facility_technician` |

The proposed migration **does not** replace `org_sku` or `org_allows_work_surface`. SKU remains the outer boundary.

### 1.11 Current Production RLS (relevant)

| Table | Policy | Predicate today |
|-------|--------|-----------------|
| `maintenance_work_orders` | SELECT | `can_select_work_order(id)` |
| `maintenance_work_orders` | ALL manager | `is_maintenance_manager` AND `org_allows_work_surface` (**SKU only**) |
| `maintenance_work_orders` | UPDATE technician | `is_maintenance_technician` AND `org_allows_work_surface` (**SKU only**) |
| `maintenance_work_order_updates` | SELECT | `can_select_work_order` |
| `maintenance_work_order_updates` | INSERT | manager / tech / resident / vendor (**no member scope**) |
| `facility_assets` | SELECT | `can_manage_facility_ops` OR assigned facility WO via `can_select_work_order` |
| `facility_assets` | INSERT/UPDATE | `can_manage_facility_ops` (**SKU only**) |
| `facility_stock_items` | ALL staff | `can_manage_facility_ops` (**SKU only**) |
| `comms_conversations` | staff | `is_pm_comms_staff` / `can_access_tenant_conversation` |
| `organization_memberships` / `organization_invitations` | capability-gated | INSERT lists omit `operating_scope` |

Membership / invitation RLS does not enumerate columns. A nullable additive column is compatible.

---

## 2. Migration review

File (implementation SHA `56ffb150`): `supabase/migrations/20260815200000_adr_033_member_operating_scope.sql`

Reviewed against **actual Production**, not Preview. SQL semantics are not altered by this record.

### 2.1 Every change

| Kind | Objects |
|------|---------|
| ADD COLUMN IF NOT EXISTS | `organization_memberships.operating_scope text` (nullable) |
| ADD COLUMN IF NOT EXISTS | `organization_invitations.operating_scope text` (nullable) |
| CHECK | `organization_memberships_operating_scope_check` — `NULL` or `property_operations` \| `facility_operations` \| `both` |
| CHECK | `organization_invitations_operating_scope_check` — same |
| CREATE TABLE IF NOT EXISTS | `organization_operating_scope_events` (append-only audit; org FK cascade; membership/invitation FK set null; actor set null) |
| CHECK (new table) | `from_scope` / `to_scope` null or the three canonical values |
| INDEX IF NOT EXISTS | `organization_operating_scope_events_org_created_idx` `(organization_id, created_at DESC)` |
| RLS | `ENABLE ROW LEVEL SECURITY` on the events table |
| DROP/CREATE POLICY | `operating_scope_events_select_member` — SELECT if an **active membership** exists for `auth.uid()` in that org |
| DROP/CREATE POLICY | `operating_scope_events_insert_manager` — INSERT if `is_org_manager(organization_id)` |
| CREATE OR REPLACE FUNCTION | `member_operating_scope(uuid, uuid default auth.uid())` |
| CREATE OR REPLACE FUNCTION | `member_allows_work_surface(uuid, text, uuid default auth.uid())` |
| CREATE OR REPLACE FUNCTION | `is_pm_comms_staff(uuid)` — existing body **plus** `AND member_allows_work_surface(org, 'residential')` |
| CREATE OR REPLACE FUNCTION | `can_select_work_order(uuid)` — manager and technician branches **AND** `member_allows_work_surface`; resident/vendor branches unchanged |
| REVOKE | new helpers + replaced helpers from `public`, `anon` |
| GRANT EXECUTE | those four functions to `authenticated` only |

`DROP POLICY IF EXISTS` is limited to the **new** events-table policy names so the file is re-runnable. It does not drop work-order, comms, FAC-003, membership, or invitation policies.

### 2.2 Destructive / rewrite scan

| Pattern | Present? |
|---------|----------|
| `DELETE` / `TRUNCATE` | **No** |
| Membership deletion | **No** |
| Subscription / SKU mutation | **No** |
| `DROP TABLE` / `DROP COLUMN` | **No** |
| Stripe / billing change | **No** |
| FIN-OPS `financial_*` CREATE | **No** |
| July finance `UPDATE` / rewrite | **No** |
| `org_allows_work_surface` replace | **No** |
| Role catalog / entitlement insert | **No** |

`CREATE OR REPLACE FUNCTION` replaces two existing helpers by **tightening** them with an additional AND. It does not rewrite rows.

### 2.3 Helper behavior (certified from the SQL)

`member_operating_scope(org, user)`:

1. Portal-only (`tenant` / `vendor` / `property_owner` and not staff) → `NULL`
2. Stored value in the three canonical strings → that value
3. Else PM SKU → `property_operations`
4. Else FO SKU → `facility_operations`
5. Else Complete SKU → `both`
6. Else `NULL`

`member_allows_work_surface(org, surface, user)`:

```
org_allows_work_surface(org, surface)
AND (
  org_sku is distinct from Complete
  OR (Complete AND scope allows that surface)
)
```

Non-Complete short-circuits to the SKU helper. Stored `both` **cannot** expand a PM or FO subscription.

### 2.4 Additive against actual Production lineage

| Assumption | Actual Production | Compatible? |
|------------|-------------------|-------------|
| Memberships / invitations exist | Yes | Yes — nullable ADD COLUMN |
| `operating_scope` absent | Confirmed absent | Yes — `IF NOT EXISTS` |
| Events table absent | Confirmed absent | Yes — `CREATE TABLE IF NOT EXISTS` |
| `org_sku` / `org_allows_work_surface` exist | Yes | Yes — not replaced |
| `is_pm_comms_staff` / `can_select_work_order` exist | Yes | Yes — replace with AND |
| `is_org_manager` exists | Yes | Yes — events INSERT |
| `organization_memberships.roles` is `text[]` | Yes | Yes |
| No existing `operating_scope` values to validate | Column absent | CHECK is vacuous on apply |

**No schema compatibility gap.** Do not improvise SQL.

---

## 3. Migration lineage

| Item | Value |
|------|-------|
| Repo file | `supabase/migrations/20260815200000_adr_033_member_operating_scope.sql` |
| Repo version | `20260815200000` |
| Implementation SHA | `56ffb150` |
| Production tip | `20260815175833` / `plat_006_finance_capability_grants` |
| Successor? | **Yes** — `20260815200000` > `20260815175833` |
| Substitute stamp required? | **No** |

Do **not** replay historical migrations. Specifically do **not** replay:

- FIN-OPS S0 / S1 / S2
- old PLAT migrations
- old FAC migrations
- OPS-001 / COM-002 / PLAT-006 already on the ledger

If a later cert finds a newer Production tip ≥ `20260815200000`, register **the same statements** under a greater successor version. Do not change semantics.

---

## 4. Existing Complete members

Critical gate: nobody currently using Complete may lose access merely because the nullable column is introduced.

Immediately after schema apply and **before** application deploy, every stored scope is `NULL` (new column, no backfill).

| Membership | Role | Current effective product access | Stored scope after apply | Effective scope after apply / before deploy |
|------------|------|----------------------------------|--------------------------|---------------------------------------------|
| `3398c1c6` | Complete `organization_admin` + `property_manager` | Property ∪ Facility (org SKU union) | `NULL` | **`both`** (Complete NULL compatibility + admin) |
| `93beaa0c` | Complete `organization_admin` + `property_manager` + `facility_technician` | Property ∪ Facility | `NULL` | **`both`** |
| `5ad386bf` | Complete `vendor` | Vendor portal only | `NULL` | **`NULL`** (portal-only short-circuit; unused) |

Proof from the helper (section 2.3): Complete + NULL + staff → `both`. `member_allows_work_surface` then allows both surfaces because Complete SKU already allows both and scope is `both`.

Replaced helpers therefore evaluate **identically to today** for every live Complete member:

- `is_pm_comms_staff` gains `AND member_allows_work_surface(..., 'residential')` → true for both admins (same as today)
- `can_select_work_order` manager/tech branches gain the same AND → both surfaces remain visible to those admins (same as today)
- Vendor self-access branches are unchanged

Approved compatibility rule is satisfied:

- Complete admin → BOTH
- Other existing Complete staff with NULL → compatibility BOTH
- Production currently has **no** non-admin Complete staff; the two staff members are admins

Do **not** silently convert anyone to PROPERTY or FACILITY on apply. There is no Sarah/Mike to convert.

---

## 5. Single-product compatibility

| SKU | Stored scope | Effective scope | Surfaces |
|-----|--------------|-----------------|----------|
| PM + NULL | NULL | `property_operations` | Property only |
| PM + `both` (if later written) | `both` | stored `both`, but **SKU wins** | Property only |
| FO + NULL | NULL | `facility_operations` | Facility only |
| FO + `both` | `both` | stored `both`, but **SKU wins** | Facility only |

Proof: `member_allows_work_surface` returns `org_allows_work_surface` and **skips** the Complete intersection whenever `org_sku is distinct from 'mpa_complete_platform'`. `org_allows_work_surface` is unchanged and SKU-bound.

Shared TypeScript `effectiveSurfaces` (`packages/shared/src/auth/operating-scope.ts` at `56ffb150`) matches: non-Complete returns `skuSurfaces` and ignores stored scope.

Production has five PM subscribers and zero FO subscribers. After apply, all PM staff NULL → Property. No FO rows exist to migrate.

---

## 6. Complete security matrix

Certified from the **proposed SQL** plus the approved application resolver at `56ffb150`. Application enforcement is **not** live on Production until a later deploy.

| Complete + scope | Residential WO SELECT (`can_select_work_order`) | Tenant comms (`is_pm_comms_staff`) | Facility WO SELECT | FAC-003 SELECT/write (`can_manage_facility_ops`) | App entitlements after deploy |
|------------------|--------------------------------------------------|------------------------------------|--------------------|--------------------------------------------------|-------------------------------|
| BOTH (or NULL compat) | Y if role | Y if comms role | Y if role | Y if manager (SKU) | Property ∪ Facility |
| PROPERTY | Y if role | Y if comms role | **N** (helper AND) | Residual: still Y at SQL (SKU) | Property only |
| FACILITY | **N** (helper AND) | **N** | Y if role | Y if manager (SKU) | Facility only |

### 6.1 Closed by this migration

- **Tenant communications (COM-002 `comms_conversations` / messages / participants):** staff path goes through `is_pm_comms_staff` → `can_access_tenant_conversation`. Complete + FACILITY fails closed. Resident self-access unchanged.
- **Work-order SELECT and update SELECT:** manager/tech branches AND `member_allows_work_surface`. Complete + PROPERTY cannot SELECT facility WOs; Complete + FACILITY cannot SELECT residential WOs.
- **Assigned-asset SELECT via WO:** `facility_assets_select` OR-branch uses `can_select_work_order`. A PROPERTY manager does not pick up facility assets through that branch.
- **No org-member blanket** was added to the replaced helpers. Resident/vendor self-access remains requester/resident/vendor-link only.

### 6.2 Residual SQL (not a schema-apply blocker)

These policies remain SKU-only after this file. They are the docs/127 Slice D remainder. **Do not alter SQL in this certification.**

| Policy / helper | After explicit PROPERTY/FACILITY assignment |
|-----------------|---------------------------------------------|
| `can_manage_facility_ops` | Complete + PROPERTY manager can still pass FAC-003 write / stock SELECT at PostgREST |
| `maintenance_work_orders_manage_manager` ALL | Complete + PROPERTY manager can still ALL facility WOs at PostgREST |
| `maintenance_work_orders_update_technician` | SKU-only AND |
| `maintenance_updates_insert` | no member-scope AND |
| Legacy `comms_messages` (0 rows) | `is_org_member` blanket (unused COM-002 path) |
| `conversation_threads` / `communication_messages` | capability `message:*`, not member scope |

After ADR-033 **application** deploy, `entitlementsForMember` / `requireAuthorizedAction` deny Mike on `pm.*` (finance, tenant portal, PM reports) and deny Sarah on `facility.*` APIs. Direct PostgREST on FAC-003 / manager ALL is the residual. Full data-plane AND for those policies is a later Owner-authorized RLS slice. It does **not** make schema-before-app unsafe.

Technician assignment: `can_select_work_order` technician branch already requires assignment / unassigned / early status **and** will AND member scope. A Complete FACILITY technician cannot SELECT residential WOs. Portal vendor/tenant paths stay self-access.

---

## 7. Sarah / Mike / Erick contract

Production does not yet have these personas. The proposed schema **supports** them. Expected effective access is certified from helper + application resolver behavior.

| Persona | SKU | Role | Stored scope | Expected |
|---------|-----|------|--------------|----------|
| ERICK | Complete | `organization_admin` | `both` | Property ∪ Facility |
| SARAH | Complete | `property_manager` | `property_operations` | Property only |
| MIKE | Complete | `property_manager` | `facility_operations` | Facility only |

**Most important negative:** MIKE must not receive Property data-plane access merely because the organization owns Complete.

| Surface | ERICK | SARAH | MIKE |
|---------|-------|-------|------|
| `/launcher` (after app deploy) | Y | N (PM home) | N (FO home) |
| PM mission control / residents / leases | Y | Y | **N** (app entitlements; WO SELECT + comms SQL) |
| Tenant comms | Y | Y | **N** (`is_pm_comms_staff` AND residential scope) |
| `pm.financial_operations` / `pm.finance:*` | Y if capability | Y if capability | **N** — entitlement dropped before finance authorize |
| Facility WOs | Y | **N** (WO SELECT helper) | Y |
| FAC-003 assets / inventory (app API) | Y | **N** | Y |
| FAC-003 PostgREST residual | Y | Residual until follow-on RLS | Y |

Mike’s denial does **not** depend on changing the Complete SKU. The SKU stays the outer union; member scope intersects it.

Last-BOTH-admin protection is **application** logic (Team & Access). The schema stores `both` and does not enforce last-admin in SQL. That is correct for this file.

---

## 8. Finance dependency

**docs/126 remains AUDIT COMPLETE · BLOCKED FOR REMEDIATION DESIGN.**

This certification:

- Does **not** remediate docs/126
- Does **not** create `financial_charges` or any `financial_*` table
- Does **not** replay FIN-OPS S0 / S1 / S2
- Does **not** modify the 12 July `financial_activity` rows
- Does **not** touch Stripe / billing / SKUs

Architectural requirement only, once the ADR-033 **application** is deployed:

```
Complete + facility_operations
  → entitlementsForMember drops every pm.* key
  → pm.financial_operations is absent
  → requireAuthorizedAction / requireFinancePermission fails
  → pm.finance:* cannot authorize the action
```

`requireFinancePermission` already requires `pm.financial_operations` via `requireAuthorizedAction`. The insertion point is member-effective entitlements, not a second finance if-statement.

**Recorded dependency:** docs/126 cannot close without successful ADR-033 Production certification **and** the later application deploy that makes Mike fail closed. This package does not close docs/126.

---

## 9. RLS / application split-state safety

Analyzed state:

```
DATABASE ADR-033 LIVE
APPLICATION PRE-ADR-033  (SHA 44d50bf1, currently serving Production)
```

### 9.1 Can the migration be applied while the current Production application serves traffic?

**Yes.** Verdict for this split: **SAFE**.

| Check | Finding |
|-------|---------|
| Nullable columns | Both `operating_scope` columns are nullable. No rewrite. |
| Invitation inserts | Current Production INSERT omits `operating_scope` → NULL. CHECK allows NULL. |
| Membership reads | Current Production SELECT lists omit `operating_scope`. Extra column is ignored. |
| Old clients | SHA `44d50bf1` has **zero** `operating_scope` references (`git grep` on that SHA is empty). |
| Existing RLS | Membership/invitation policies are capability predicates, not column lists. |
| Compatibility fallback | Complete NULL → `both`. PM NULL → Property. FO NULL → Facility. |
| Complete NULL behavior | Live Complete admins keep today’s union. No access loss. |
| PM/FO NULL behavior | Same surfaces as today. Stored `both` cannot expand SKU. |
| Unexpected deny | Impossible for current rows: nobody has a stored PROPERTY/FACILITY value, and the old app never writes the column. |
| Unexpected expand | Impossible: SKU helper unchanged; Complete already has both surfaces. |

The old application **cannot** accidentally assign PROPERTY/FACILITY and lock people out, because it never writes the column.

### 9.2 Inverse split (forbidden)

```
APPLICATION ADR-033 LIVE
DATABASE PRE-ADR-033
```

**BLOCKED.** The implementation at `56ffb150` SELECTs and writes `operating_scope` and inserts `organization_operating_scope_events`. Deploying that application before the schema would break Team & Access, invitations, middleware entitlement resolution, and Guided Setup.

### 9.3 Release ordering

1. Apply `20260815200000` to `mpa-prod` (this certification; later Owner-authorized apply).
2. Keep SHA `44d50bf1` serving traffic (safe).
3. Deploy the ADR-033 application only after post-apply validation (section 11).
4. Only then create Sarah/Mike assignments and run authenticated UAT (section 12).

If the split state had denied or expanded access unexpectedly, this record would be **BLOCKED**. It does not.

---

## 10. Rollback

Rollback must preserve memberships, subscriptions, organizations, work orders, communications, FAC-003 data, and invitations. **No destructive customer-data rollback.**

### 10.1 Restore previous helper contract (exact Production bodies captured 2026-08-15)

Replace `is_pm_comms_staff` with the current Production body: staff roles + SKU ∈ {PM, Complete} — **no** `member_allows_work_surface` AND.

Replace `can_select_work_order` with the current Production body: manager/tech + `org_allows_work_surface` only; resident/vendor branches unchanged — **no** member-scope AND.

### 10.2 Drop additive objects (only if unused)

1. Drop policies `operating_scope_events_select_member` and `operating_scope_events_insert_manager`.
2. Drop functions `member_operating_scope` and `member_allows_work_surface`.
3. Drop table `organization_operating_scope_events` (audit only; empty immediately after apply unless the new app wrote events).
4. Drop CHECKs, then drop columns `organization_memberships.operating_scope` and `organization_invitations.operating_scope` **only if** no assigned values must be retained.

Do **not** DELETE memberships, invitations, subscriptions, organizations, work orders, comms, FAC-003, or `financial_activity`.

Do **not** drop `org_sku` / `org_allows_work_surface` / `can_manage_facility_ops`.

If assigned scopes already exist and must be kept, leave the columns and only restore the two replaced helpers.

---

## 11. Post-apply validation plan

For the later **authorized** migration application. **Read-only checks only.** Do not execute write-based UAT during that apply unless a separate Owner record authorizes it.

| # | Check | Expected |
|---|-------|----------|
| 1 | Ledger tip | `20260815200000` / `adr_033_member_operating_scope` (or the same statements under a later successor if the tip moved) |
| 2 | Columns | `organization_memberships.operating_scope` and `organization_invitations.operating_scope` exist, nullable |
| 3 | Helpers | `member_operating_scope` and `member_allows_work_surface` exist |
| 4 | Event table | `organization_operating_scope_events` exists, RLS on, two policies |
| 5 | Membership count | still 31 / 29 active |
| 6 | Subscription count | still 6 live; SKU split 1 Complete / 5 PM / 0 FO |
| 7 | Complete NULL compatibility | both Complete admins: stored NULL, `member_operating_scope` → `both` |
| 8 | Complete vendor | `member_operating_scope` → NULL |
| 9 | PM NULL → Property | UAT Property Demo manager: effective `property_operations`; `member_allows_work_surface(..., 'facility')` = false |
| 10 | FO NULL → Facility | vacuous today (0 FO orgs); prove from helper definition |
| 11 | Complete BOTH | admins allow residential **and** facility |
| 12 | Complete PROPERTY / FACILITY | no such stored rows yet; do not invent them during apply validation |
| 13 | Tenant / vendor isolation | vendor membership still portal-only; comms resident path unchanged |
| 14 | Technician helper | `is_maintenance_technician` unchanged (still accepts `facility_technician`) |
| 15 | Work-surface RLS | `can_select_work_order` body contains `member_allows_work_surface`; Complete NULL still allows both |
| 16 | Comms isolation | `is_pm_comms_staff` body contains residential `member_allows_work_surface`; Complete NULL still true for admins |
| 17 | Finance / Stripe | `financial_charges` still absent; `financial_activity` still 12; no SKU change |
| 18 | `org_allows_work_surface` | definition unchanged |

Do not assign Sarah/Mike during post-apply validation. Do not write events. Do not deploy from the apply record.

---

## 12. Application deployment UAT plan

For the later **authenticated** UAT after application deployment. **Do not execute it from this record.**

Use one Complete org (UAT Clinic Demo or an Owner-authorized clone). No SKU / billing / subscription changes. Do not publish passwords.

Required personas (create only after the ADR-033 app is live):

| Persona | Role | Stored scope |
|---------|------|--------------|
| Erick-equivalent | `organization_admin` | `both` |
| Sarah-equivalent | `property_manager` | `property_operations` |
| Mike-equivalent | `property_manager` | `facility_operations` |

### 12.1 BOTH admin (Erick)

- `/launcher` is home
- PM access (`/pm/mission-control`, residents, leases, residential WOs)
- Facility access (`/facility/mission-control`, facility WOs, assets, inventory)
- Team & Access can assign scope and invite with an explicit scope

### 12.2 PROPERTY manager (Sarah)

- `/pm/mission-control` is home
- PM resources allowed
- Tenant comms allowed
- PM reports allowed (capability)
- Facility URLs / APIs **denied**
- FAC-003 app APIs **denied**

### 12.3 FACILITY manager (Mike)

- `/facility/mission-control` is home
- Facility WOs allowed
- Assets allowed
- Inventory allowed
- FAC reports allowed
- PM resources **denied**
- Tenant comms **denied**
- PM finance authorization **denied** (`pm.financial_operations` absent before `pm.finance:*`)

### 12.4 Also verify

- Invitation with explicit scope
- Accepted membership receives that scope
- Team & Access scope change
- Audit row in `organization_operating_scope_events`
- Last-BOTH-admin protection (cannot leave Complete with zero BOTH admins)
- Navigation filtering (no Facility tiles for Sarah; no PM tiles for Mike)
- OPS-001 connection filtering (Sarah cannot connect facility assets/stock/facility WOs; Mike cannot connect residents/leases/PM finance)
- Shared-report narrowing (`?persona=` / `?area=` cannot expand past member scope)
- PM-only org: stored `both` still cannot open `/facility/*`
- Portal tenant / vendor / owner unchanged
- Existing unassigned Complete staff (if any remain NULL) still reach today’s union until assigned

Do not use this UAT to apply FIN-OPS schema.

---

## 13. Certification

| Evidence | Result |
|----------|--------|
| Production baseline | App `44d50bf1` (PLAT-006). Ledger `20260815175833`. ADR-033 objects absent. 21 orgs / 31 memberships / 6 live subs / 1 Complete / 5 PM / 0 FO |
| Exact migration review | Additive columns, events table, two new helpers, two helper replacements, grants. No deletes, no SKU/Stripe/FIN-OPS |
| Lineage | `20260815200000` is a valid successor of `20260815175833`. No substitute stamp. No historical replay |
| Complete membership compatibility | Both live Complete admins → NULL → `both`. Vendor portal NULL. No access loss |
| Single-product compatibility | PM + NULL → Property. FO + NULL → Facility. Stored BOTH cannot expand SKU |
| RLS matrix | Comms + WO SELECT closed by helper AND. FAC-003 / manager ALL residual documented. No new org-member blanket |
| Split-state safety | Schema-before-app **SAFE**. App-before-schema **BLOCKED** |
| Rollback | Restore exact current `is_pm_comms_staff` and `can_select_work_order`; drop additive objects; never delete customer rows |
| Post-apply validation plan | Read-only ledger / helper / count / NULL-compat checks |
| Later authenticated UAT plan | Erick / Sarah / Mike plus invite, audit, last-admin, nav, OPS-001, reports |

**Final verdict: READY FOR PRODUCTION MIGRATION APPLICATION.**

This record does not apply, deploy, merge for Production release, or implement FIN-OPS.

---

## Next authorized step

Apply completed in [docs/129](../129-complete-delegated-operations-production-migration-application/index.md) (**READY FOR APPLICATION DEPLOYMENT**). Production ledger: `20260815185722` / `adr_033_member_operating_scope`. Do not re-apply from this record. Do not deploy from this record.

---

## Constraints honored

- Product Constitution: three products; Complete remains one subscription
- Commercial flow unchanged
- Implementation Gate: documentation only
- No Stripe / SKU / subscription mutation
- No FIN-OPS schema
- No July finance modification
- No substitute SQL
- No Production write
