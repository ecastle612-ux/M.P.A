# FAC-003 PRODUCTION MIGRATION CERTIFICATION

**Title:** FAC-003 PRODUCTION MIGRATION CERTIFICATION  
**Status:** READY FOR PRODUCTION MIGRATION  
**Date:** 2026-08-14  
**Recorded at:** 2026-08-14T16:30:00Z  
**Program:** FAC-003  
**Authority:** [docs/102](../102-fac-003-asset-inventory-management/index.md) Approved · [ADR-028](../18-decision-log/adr-028-fac-003-asset-inventory-management.md) Accepted  
**Implementation cert:** [docs/103](../103-fac-003-implementation-certification/index.md) READY (PR #211 · no Production deploy)  
**Production project:** `mpa-prod` / `vahnmcrpnuggxkivynvo`  
**Preview project (not used):** `drcbipqrxfqpjilsfxip`  
**Migration:** `supabase/migrations/20260814200000_fac_003_asset_inventory.sql`  
**Ledger name (when later applied):** `fac_003_asset_inventory`  
**Application deployment:** **Not performed** (forbidden for this record)  
**Production apply:** **Not performed** (forbidden for this record)  
**Billing / Stripe / roles / SKUs / entitlement keys:** No changes  

---

## Final verdict

**READY FOR PRODUCTION MIGRATION**

The approved FAC-003 migration is additive, Production-compatible with live FAC-001 / FAC-002 / PLAT-002 / MEDIA-001 objects, and has a documented rollback. Existing `facility_assets` rows, work orders, vendors, and serialized `facility_inventory_items` are preserved. New stock objects are absent today and can be created safely.

This record **does not apply** the migration and **does not deploy** the application. A later Owner-authorized apply is a separate step. Application deploy of PR #211 is a later step after apply.

---

## Constraints honored

| Constraint | Result |
|------------|--------|
| Certification only | Honored — read-only `execute_sql` on Production; no `apply_migration` |
| No Production deployment | Honored |
| No application / Vercel deploy | Honored |
| No billing / Stripe / commercial-flow changes | Honored |
| No new features, roles, SKUs, or entitlement keys | Honored |
| Do not create `maintenance_notifications` | Honored — not in this file |
| Do not reuse `facility_inventory_items` as stock | Honored — 1 live serialized row untouched |
| Do not write `facility_records` history | Honored — not in this file |
| Do not replay PLAT-002 `20260814160000` | Honored — successor `20260814151825` / `plat_002_production_compat` is already on the ledger |

---

## 1. Migration review

**File:** `supabase/migrations/20260814200000_fac_003_asset_inventory.sql` (PR #211)

| Check | Result |
|-------|--------|
| Additive changes only | **Pass** — `CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, `CREATE OR REPLACE FUNCTION`, `CREATE INDEX IF NOT EXISTS`, policy replace, check-constraint recreate |
| Existing `facility_assets` preserved | **Pass** — no `DELETE` / `TRUNCATE` / `DROP TABLE` / `DROP COLUMN`. Only a compat `UPDATE` that sets `property_property_id` when ids already match `property_properties` |
| No destructive operations | **Pass** — no row deletes; `property_id DROP NOT NULL` keeps live values; status check replace is compatible with live `active` rows |
| Rollback documented | **Pass** — see §5 |

### New objects (absent on Production today)

| Object | Production now | Migration |
|--------|----------------|-----------|
| `facility_stock_items` | **Absent** | `CREATE TABLE IF NOT EXISTS` |
| `facility_stock_movements` | **Absent** | `CREATE TABLE IF NOT EXISTS` |
| `can_manage_facility_ops` | **Absent** | `CREATE OR REPLACE` — `is_maintenance_manager AND org_allows_work_surface(..., 'facility')` |
| `can_select_facility_asset` | **Absent** | `CREATE OR REPLACE` — manager or assigned facility technician |
| `can_select_facility_stock_item` | **Absent** | `CREATE OR REPLACE` — FO/Complete manager |
| `apply_facility_stock_movement` | **Absent** | `CREATE OR REPLACE` — receive / issue / adjust / usage; fails closed on negative on-hand |

### Updated objects

| Object | Production now | Migration |
|--------|----------------|-----------|
| `facility_assets` | **Exists** — 4 live rows, 0 soft-deleted | Additive columns; `property_id` nullable; status check adds `maintenance`; partial unique + site index; compat map |
| `maintenance_work_orders` | **Exists** — 30 rows; `facility_asset_label` present; `facility_asset_id` **absent** | Nullable `facility_asset_id` + index. Label kept. No backfill |

### Other additive touches (not new product tables)

| Object | Change |
|--------|--------|
| `facility_work_order_materials` | Table already exists (0 rows). `ADD COLUMN stock_item_id`. Policies replaced to `can_select_work_order` (PLAT-002 C4). Delete/update client policies not recreated (default deny) |
| `media_attachments` | Check constraint drop/recreate adds `facility_asset`; keeps every live type |

### Destructive-pattern scan

Repo grep of the file for `DELETE FROM`, `TRUNCATE`, `DROP TABLE`, `DROP COLUMN`, and `ALTER COLUMN … TYPE`: **no matches**.

`DROP CONSTRAINT` / `DROP POLICY` are recreate-only (status check, MEDIA parent allowlist, RLS names).

`CREATE TABLE IF NOT EXISTS facility_assets` is a **no-op** on Production (table exists). Fresh environments still get the FAC-001 spine.

`CREATE TABLE IF NOT EXISTS facility_work_order_materials` is a **no-op** on Production. Live columns match the CREATE spine (`id`, `organization_id`, `work_order_id`, `name`, `quantity`, `inventory_item_id`, `sort_order`, `metadata`, `created_by`, `updated_by`, `created_at`, `updated_at`). Then `stock_item_id` is added.

---

## 2. Production compatibility check

Read-only inventory on `mpa-prod` (2026-08-14). Ledger latest row: `20260814151825` / `plat_002_production_compat`. **`20260814200000` is not on the ledger.**

### 2.1 Live counts

| Object | Count / state |
|--------|----------------|
| `organizations` | 21 |
| `product_skus` | 3 — `mpa_property_manager`, `mpa_facility_operations`, `mpa_complete_platform` |
| `organization_subscriptions` (not canceled) | 6 — 5 `mpa_property_manager` active, 1 `mpa_complete_platform` active, **0** Facility Operations |
| `property_properties` | 9 |
| `properties` (legacy) | 10 |
| `facility_assets` | **4** live, 0 deleted, 1 org, all `status = active`, 4 distinct `asset_code` |
| `facility_stock_items` | **Absent** |
| `facility_stock_movements` | **Absent** |
| `facility_inventory_items` | 1 (serialized equipment — out of FAC-003 write scope) |
| `facility_work_order_materials` | 0 |
| `maintenance_work_orders` | 30 (18 residential, 12 facility); 5 have `facility_asset_label` |
| `vendor_vendors` | 13 (2 in the asset org) |
| `media_attachments` | 10 — `maintenance` 9, `conversation_message` 1 |

### 2.2 Existing `facility_assets` rows

All four rows belong to Canopy Property Partners `f88ee244-5343-4ddf-be48-15e96b9380ee`. That org has **no** `organization_subscriptions` row (`org_sku` is null).

| id | asset_code | status | `property_id` matches `property_properties` | matches legacy `properties` |
|----|------------|--------|---------------------------------------------|------------------------------|
| `142aae34-…` | `WH-203` | active | yes | yes |
| `1ef1ad89-…` | `HVAC-001` | active | yes | yes |
| `a7e863eb-…` | `ROOF-001` | active | yes | yes |
| `324cf079-…` | `WH-101` | active | yes | yes |

Shared `property_id`: `8705fd26-5818-4fdf-ae70-f54f1234eaca`.

Compat `UPDATE` will set `property_property_id` on all four rows. No row is deleted or rewritten except that nullable copy.

Live columns **missing** FAC-003 fields (all `ADD COLUMN IF NOT EXISTS`): `scan_code`, `floor_label`, `room_label`, `building_label`, `purchase_date`, `vendor_id`, `replaced_asset_id`, `property_property_id`.

Live constraints that remain valid after apply:

```
facility_assets_status_check
  CHECK (status = ANY (ARRAY['active','replaced','retired']))
  -- replaced with active | maintenance | retired | replaced
  -- live values: 4 × active

facility_assets_organization_id_asset_code_key
  UNIQUE (organization_id, asset_code)
  -- kept; new partial unique facility_assets_org_code_uidx is additive

facility_assets_property_fk
  FOREIGN KEY (property_id, organization_id)
  REFERENCES properties(id, organization_id) ON DELETE CASCADE
  -- kept. property_id DROP NOT NULL uses MATCH SIMPLE:
  -- existing non-null pairs stay enforced; new FAC-003 rows may use
  -- property_property_id only.

facility_assets_org_status_idx
  -- already exists; CREATE INDEX IF NOT EXISTS is a no-op
```

`property_id` is currently `NOT NULL`. Dropping NOT NULL does not null existing values.

### 2.3 Existing work orders

- `facility_asset_id` **absent** — nullable add + `ON DELETE SET NULL`.
- `facility_asset_label` **kept** (5 populated). No backfill of typed ids (approved: optional link).
- Work-order RLS already PLAT-002:

```
maintenance_work_orders_select
  USING (can_select_work_order(id))

maintenance_work_orders_manage_manager
  USING / CHECK (
    is_maintenance_manager(organization_id)
    AND org_allows_work_surface(organization_id, work_surface)
  )
```

FAC-003 does not replace these policies.

### 2.4 Existing vendors

`vendor_vendors` exists (13 rows). `facility_assets.vendor_id` and `facility_stock_items.vendor_id` are nullable `ON DELETE SET NULL`. No vendor rewrite.

### 2.5 Existing RLS (paste)

`facility_assets` today (capability-based; **will be replaced**):

```
facility_assets_select_authorized
  FOR SELECT USING (has_org_capability(organization_id, 'maintenance:read'))

facility_assets_insert_authorized
  FOR INSERT WITH CHECK (has_org_capability(organization_id, 'maintenance:update'))

facility_assets_update_authorized
  FOR UPDATE USING / CHECK (has_org_capability(organization_id, 'maintenance:update'))
```

After apply (approved FAC-003 / PLAT-002 wrappers):

```
facility_assets_select
  USING (can_select_facility_asset(id))

facility_assets_insert
  WITH CHECK (created_by = auth.uid() AND can_manage_facility_ops(organization_id))

facility_assets_update
  USING / CHECK (can_manage_facility_ops(organization_id))
```

`facility_work_order_materials` today (0 rows):

```
select  has_org_capability(organization_id, 'maintenance:read')
insert  has_org_capability(organization_id, 'maintenance:update')
update  has_org_capability(organization_id, 'maintenance:update')
delete  has_org_capability(organization_id, 'maintenance:update')
```

After apply: select/insert via `can_select_work_order(work_order_id)`. Aligns materials with PLAT-002 C4. Empty table — no row-visibility surprise.

`facility_stock_movements` insert `WITH CHECK (false)` — RPC-only. `REVOKE … FROM public, anon` on new helpers; `GRANT EXECUTE` to `authenticated`.

### 2.6 Existing authorization helpers

| Helper | Production |
|--------|------------|
| `has_org_capability` | Present |
| `is_org_member` | Present |
| `is_maintenance_manager` | Present |
| `can_select_work_order` | Present (PLAT-002) |
| `org_allows_work_surface` | Present — facility requires `mpa_facility_operations` or `mpa_complete_platform` |
| `org_sku` | Present — reads `organization_subscriptions.sku_code` where status is distinct from `canceled` |
| `can_manage_facility_ops` | **Absent** (this migration) |
| `can_select_facility_asset` | **Absent** (this migration) |
| `can_select_facility_stock_item` | **Absent** (this migration) |
| `apply_facility_stock_movement` | **Absent** (this migration) |

New helpers **call** the live PLAT-002 functions. They do not replace `org_sku`, `org_allows_work_surface`, or `can_select_work_order`.

### 2.7 Program conflict check

| Program | Conflict? | Evidence |
|---------|-----------|----------|
| **PLAT-002** | **None** | Successor `20260814151825` applied. FAC-003 wrappers compose `is_maintenance_manager` + `org_allows_work_surface(..., 'facility')` + `can_select_work_order`. Work-order policies untouched. Do **not** replay `20260814160000` (that file still references missing `maintenance_notifications`). |
| **FAC-002** | **None** | Report types are application-layer (PR #211). This migration does not alter a report-registry table. Materials table already exists; `stock_item_id` is additive. `facility_pm_schedules` / `facility_records` untouched. |
| **MEDIA-001** | **None** | Live check: `maintenance`, `vendor`, `inspection`, `incident`, `organization`, `conversation_message`. Live values: `maintenance` (9), `conversation_message` (1). Recreate keeps all six and adds `facility_asset`. MEDIA select policy is unchanged (conversation special-case + `is_org_member`). |

### 2.8 Expected post-apply access tightening (not a blocker)

Today any member with `maintenance:read` can select the four Canopy assets. After apply, select requires `can_manage_facility_ops` (FO or Complete manager) or an assigned facility technician.

Canopy Property Partners has **no** FO/Complete subscription. Those four rows **remain in the table** and become invisible under the new RLS until that org is on Facility Operations or Complete. That is ADR-028 / docs/102 (PM and unsubscribed orgs denied). It is not data loss.

There is **no** live Facility Operations subscription. FO-surface proof after apply uses the Complete UAT org plus helper evaluation, same as PLAT-002.

RLS changes take effect at apply time, **before** any application deploy. Between apply and deploy, Production asset lists that still query `facility_assets` under the old capability model will see zero rows for Canopy. Complete currently has zero assets.

---

## 3. Validation plan

Run these checks **after** a later Owner-authorized apply. Do **not** run them as an apply from this record. Application-level “create asset in UI” waits for a later deploy of PR #211; SQL-level checks can run immediately after apply.

UAT orgs:

| Org | SKU | Use |
|-----|-----|-----|
| M.P.A. UAT Clinic Demo `a11ce001-0001-4000-8000-00000000c11c` | `mpa_complete_platform` | Complete allow |
| M.P.A. UAT Property Demo `a11ce002-0001-4000-8000-0000000000c2` | `mpa_property_manager` | PM deny |
| Canopy Property Partners `f88ee244-5343-4ddf-be48-15e96b9380ee` | none | Existing four assets preserved; select denied under new RLS |
| Facility Operations | **none live** | Helper-only until a FO subscription exists |

### 3.1 Assets

| Check | Pass when |
|-------|-----------|
| Existing assets preserved | Count still 4; same ids / `asset_code` / `status`; `property_id` unchanged; `property_property_id` = `8705fd26-…` on all four |
| Soft-delete count | Still 0 |
| New columns present | `scan_code`, `floor_label`, `room_label`, `building_label`, `purchase_date`, `vendor_id`, `replaced_asset_id`, `property_property_id` |
| Status check | Accepts `maintenance`; live `active` rows still valid |
| New asset creation (SQL, Complete org) | Insert with `property_property_id` set, `property_id` null, `created_by = auth.uid()`, manager role — succeeds |
| Unique code | Duplicate `(organization_id, asset_code)` on a live row fails |

### 3.2 Inventory

| Check | Pass when |
|-------|-----------|
| Tables exist | `facility_stock_items`, `facility_stock_movements`; RLS on |
| Serialized table untouched | `facility_inventory_items` still 1 row; no new FK from FAC-003 UI |
| Receive | `apply_facility_stock_movement(..., 'receive', +n)` increases `quantity_on_hand`; movement `quantity` = `+n`; `quantity_after` matches |
| Issue / usage | Decrements; usage requires a facility work order the actor can select |
| Adjust | Requires reason; signed quantity applied |
| Insufficient stock | Issue/usage below zero raises `insufficient stock`; on-hand unchanged |
| Direct insert | Client `INSERT` into `facility_stock_movements` fails (`WITH CHECK (false)`) |
| `facility_inventory_items` unused | FAC-003 RPC does not read or write it |

### 3.3 Work orders

| Check | Pass when |
|-------|-----------|
| Column added | `maintenance_work_orders.facility_asset_id` nullable |
| Labels preserved | Still 5 non-empty `facility_asset_label`; 30 work orders |
| Asset linking | Update a facility WO with a live asset id succeeds for a Complete/FO manager; `ON DELETE SET NULL` |
| History source | Completed / closed / cancelled facility WOs for that id — no `facility_records` insert |

### 3.4 Reports (FAC-002)

| Check | Pass when |
|-------|-----------|
| Registry still serves FAC-002 work-order types | Existing export/audit path unchanged (app-layer; after deploy) |
| New types available after deploy | Asset list / status / repair history / repair frequency; current stock / low stock / usage / reorder |
| Schema-only after apply | New columns/tables exist so those queries do not 42P01 |

### 3.5 Security

| Actor | Assets | Inventory | Expected |
|-------|--------|-----------|----------|
| FO manager | Access | Access | Allow — **no live FO org**; prove `org_allows_work_surface(org, 'facility')` true for an FO sku and `can_manage_facility_ops` |
| Complete manager (`a11ce001-…`) | Access | Access | Allow |
| Property Manager SKU (`a11ce002-…`) | Denied | Denied | `can_manage_facility_ops` false; RLS hides rows |
| Tenant / owner / vendor | Denied | Denied | No manager + no facility surface |
| Technician | Assigned facility WO assets only | Usage on assigned facility WOs only | `can_select_facility_asset` via assignment; receive/issue/adjust forbidden |
| Anon | Denied | Denied | `REVOKE` on helpers; RLS to `authenticated` |

Pipeline remains Authentication → Organization → Role → SKU entitlement → Module permission → Action (ADR-026). No new roles or entitlement keys.

---

## 4. Rollback

If a later Owner-authorized apply must be reversed (new Approve required before any destructive undo):

1. **Do not delete** FAC-001 `facility_assets` rows. Restore prior policy text (`facility_assets_*_authorized` / `has_org_capability`) if old capability access must return.
2. Drop FAC-003 policies on stock tables; drop `apply_facility_stock_movement`, `can_select_facility_*`, `can_manage_facility_ops`.
3. Drop `facility_stock_movements` then `facility_stock_items` only if empty or after an approved archive.
4. Drop `maintenance_work_orders.facility_asset_id` and `facility_work_order_materials.stock_item_id` only if unused.
5. Restore `media_attachments_related_entity_type_check` without `facility_asset` only if no `facility_asset` attachments exist.
6. Leave `property_id` nullable; do not re-impose `NOT NULL` if any new row has a null `property_id`.
7. Application: revert PR #211 / SHA. No Production schema from **this** certification record.

---

## 5. Certification

| Gate | Result |
|------|--------|
| Additive-only review | **Pass** |
| Existing assets / work orders / vendors preserved | **Pass** |
| No destructive SQL | **Pass** |
| Rollback documented | **Pass** |
| PLAT-002 compatibility | **Pass** — helpers present; no replay of `20260814160000` |
| FAC-002 compatibility | **Pass** — materials additive; reports app-layer |
| MEDIA-001 compatibility | **Pass** — live types ⊂ new check |
| Validation plan defined | **Pass** — not executed (apply forbidden) |
| Apply performed | **No** |
| Application deployed | **No** |

**Verdict: READY FOR PRODUCTION MIGRATION**

---

## Explicitly not done

- Production apply of `20260814200000_fac_003_asset_inventory.sql`
- Application / Vercel deploy of PR #211
- Stripe / billing / price / SKU / role / entitlement changes
- Creating `maintenance_notifications`
- Replaying `20260814160000_plat_002_authorization_hardening.sql`
- Writing `facility_records` or reusing `facility_inventory_items` as stock
- Live FO-tenant proof (no FO subscription)
- Authenticated UI UAT

---

**STOP.** Certification only. Do not apply this migration. Do not deploy.
