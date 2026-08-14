# FAC-003 PRODUCTION MIGRATION APPLY CERTIFICATION

**Title:** FAC-003 PRODUCTION MIGRATION APPLY CERTIFICATION  
**Status:** READY FOR APPLICATION DEPLOYMENT  
**Date:** 2026-08-14  
**Recorded at:** 2026-08-14T16:36:00Z  
**Program:** FAC-003  
**Authority:** Owner apply authorization (this task) · [docs/104](../104-fac-003-production-migration-certification/index.md) READY FOR PRODUCTION MIGRATION · [docs/102](../102-fac-003-asset-inventory-management/index.md) Approved · [ADR-028](../18-decision-log/adr-028-fac-003-asset-inventory-management.md) Accepted  
**Implementation cert:** [docs/103](../103-fac-003-implementation-certification/index.md) READY (PR #211 · no Production deploy)  
**Production project:** `mpa-prod` / `vahnmcrpnuggxkivynvo`  
**Repo file:** `supabase/migrations/20260814200000_fac_003_asset_inventory.sql`  
**MCP name:** `fac_003_asset_inventory`  
**Application deployment:** **Not performed** (forbidden for this record)  
**Billing / Stripe / roles / SKUs / entitlement keys:** No changes  

---

## Final verdict

**READY FOR APPLICATION DEPLOYMENT**

The approved FAC-003 migration applied cleanly to Production. Existing assets, work orders, vendors, memberships, and subscriptions are unchanged. Stock tables and helpers are live. MEDIA-001 accepts `facility_asset`. FO/Complete facility-surface access is active; PM and unsubscribed orgs are denied.

This record **does not deploy** the application. UI create/list/report journeys wait for a later Owner-authorized deploy of PR #211.

---

## Constraints honored

| Constraint | Result |
|------------|--------|
| Apply this migration only | Honored — one `apply_migration` of `fac_003_asset_inventory` |
| No other migrations | Honored — `20260814160000` not replayed; no other DDL |
| No application deploy | Honored |
| No billing / Stripe changes | Honored |
| No new permissions / roles / SKUs | Honored — wrappers only; catalog untouched |

---

## 1. Pre-apply record

Captured on `mpa-prod` immediately before apply (read-only).

| Field | Value |
|-------|--------|
| Latest ledger | `20260814151825` / `plat_002_production_compat` |
| `fac_003_asset_inventory` | Absent |
| `facility_stock_items` / `facility_stock_movements` | Absent |
| `maintenance_work_orders.facility_asset_id` | Absent |
| FAC-003 asset columns | Absent |
| FAC-003 helpers | Absent |

| Object | Count |
|--------|------:|
| `facility_assets` | 4 (4 live, 0 deleted) |
| `maintenance_work_orders` | 30 (18 residential / 12 facility) |
| `vendor_vendors` | 13 |
| `organization_subscriptions` | 6 (5 Property Manager active, 1 Complete active, 0 Facility Operations) |
| `organization_memberships` | 31 |
| `facility_inventory_items` | 1 |
| `facility_work_order_materials` | 0 |
| `media_attachments` | 10 |

Existing asset identities (unchanged after apply):

| id | asset_code | status | property_id |
|----|------------|--------|-------------|
| `1ef1ad89-ad9c-4259-a249-fc2d8ad4bd29` | `HVAC-001` | active | `8705fd26-5818-4fdf-ae70-f54f1234eaca` |
| `a7e863eb-c83b-48b7-8865-d0670178d662` | `ROOF-001` | active | `8705fd26-5818-4fdf-ae70-f54f1234eaca` |
| `324cf079-eae7-45e9-a465-9ecc3a39c237` | `WH-101` | active | `8705fd26-5818-4fdf-ae70-f54f1234eaca` |
| `142aae34-5879-4efb-897a-405aa54af1e8` | `WH-203` | active | `8705fd26-5818-4fdf-ae70-f54f1234eaca` |

Org: Canopy Property Partners `f88ee244-5343-4ddf-be48-15e96b9380ee`.

---

## 2. Apply

| Field | Value |
|-------|--------|
| File | `supabase/migrations/20260814200000_fac_003_asset_inventory.sql` |
| SHA-256 (approved bytes) | `d8c7ec1a1dce7ce9c767c9c09165e530ab799dcbfefdd076b8afb73615e2dc44` |
| MCP name | `fac_003_asset_inventory` |
| Target | `mpa-prod` / `vahnmcrpnuggxkivynvo` |
| Result | **SUCCESS** |
| Ledger | `20260814163540` / `fac_003_asset_inventory` |
| Timestamp | 2026-08-14T16:35:40Z (ledger version) · recorded 2026-08-14T16:36:00Z |
| Other migrations | **None** |

Supabase MCP assigns the ledger version at apply time (same pattern as PLAT-002: repo `20260814180000` → ledger `20260814151825`). The applied SQL is the approved FAC-003 file. The repo filename `20260814200000` is the source identity.

---

## 3. Post-apply validation

### Assets

| Check | Result |
|-------|--------|
| Existing 4 assets preserved | **Pass** — same ids, codes, statuses, `property_id` |
| Compat map | **Pass** — all four have `property_property_id = 8705fd26-…` |
| New fields available | **Pass** — `scan_code`, `floor_label`, `room_label`, `building_label`, `purchase_date`, `vendor_id`, `replaced_asset_id`, `property_property_id` (null except mapped site) |
| Status check | **Pass** — `active \| maintenance \| retired \| replaced` |
| `property_id` | Nullable; live values still set |
| Old `*_authorized` policies | **Gone** |

### Inventory

| Check | Result |
|-------|--------|
| `facility_stock_items` | **Created** — 0 rows · RLS on |
| `facility_stock_movements` | **Created** — 0 rows · RLS on |
| Movement RPC | **Present** — `apply_facility_stock_movement` |
| Direct movement insert | Policy `WITH CHECK (false)` |
| `facility_inventory_items` | Unchanged — 1 serialized row |

### Work orders

| Check | Result |
|-------|--------|
| Count / surfaces | **Unchanged** — 30 (18 residential / 12 facility) |
| `facility_asset_label` | **Kept** — 5 nonempty |
| `facility_asset_id` | **Present**, nullable, all null (no backfill) |
| Materials | 0 rows; `stock_item_id` added |

### Media

| Check | Result |
|-------|--------|
| `facility_asset` on allowlist | **Pass** |
| Live attachments | Unchanged — `maintenance` 9, `conversation_message` 1 |

```
media_attachments_related_entity_type_check
  CHECK (related_entity_type = ANY (ARRAY[
    'maintenance','vendor','inspection','incident',
    'organization','conversation_message','facility_asset']))
```

### Authorization

Helpers present: `can_manage_facility_ops`, `can_select_facility_asset`, `can_select_facility_stock_item`, `apply_facility_stock_movement`.

`anon` EXECUTE: **revoked**. `authenticated` EXECUTE: **granted**.

Live policies:

```
facility_assets_select
  USING (can_select_facility_asset(id))
facility_assets_insert
  WITH CHECK (created_by = auth.uid() AND can_manage_facility_ops(organization_id))
facility_assets_update
  USING / CHECK (can_manage_facility_ops(organization_id))

facility_stock_items_select
  USING (can_select_facility_stock_item(id))
facility_stock_movements_insert
  WITH CHECK (false)

facility_work_order_materials_select / insert
  can_select_work_order(work_order_id)
```

Surface proofs (SKU path; no live FO subscription):

| Org | SKU | `org_allows_work_surface(..., 'facility')` |
|-----|-----|---------------------------------------------|
| UAT Clinic Demo `a11ce001-0001-4000-8000-00000000c11c` | `mpa_complete_platform` | **true** — Complete access path active |
| UAT Property Demo `a11ce002-0001-4000-8000-0000000000c2` | `mpa_property_manager` | **false** — PM denied |
| Canopy Property Partners `f88ee244-5343-4ddf-be48-15e96b9380ee` | none | **null** (not true) — denied; 4 rows preserved |

FO manager path is `is_maintenance_manager AND org_allows_work_surface(..., 'facility')`. Catalog still includes `mpa_facility_operations`; no org has that subscription. FO proof is helper-complete; live FO-tenant UAT waits for a FO subscription plus app deploy.

Tenant / owner / vendor remain outside `can_manage_facility_ops` (no facility SKU + not maintenance manager). Technician select remains assignment-scoped via `can_select_facility_asset`.

---

## 4. Data safety

| Object | Before | After |
|--------|-------:|------:|
| `facility_assets` | 4 | 4 |
| `maintenance_work_orders` | 30 | 30 |
| `vendor_vendors` | 13 | 13 |
| `organization_memberships` | 31 | 31 |
| `organization_subscriptions` | 6 | 6 (5 PM / 1 Complete / 0 FO) |
| `facility_inventory_items` | 1 | 1 |
| `facility_work_order_materials` | 0 | 0 |
| `media_attachments` | 10 | 10 |
| `facility_stock_items` | absent | 0 |
| `facility_stock_movements` | absent | 0 |

No row deletes. No subscription, membership, vendor, or work-order rewrites. Asset `property_id` values unchanged; `property_property_id` copied where ids already matched.

---

## 5. Certification

| Gate | Result |
|------|--------|
| Apply succeeded | **Pass** |
| Ledger entry present | **Pass** — `20260814163540` / `fac_003_asset_inventory` |
| Existing assets / WOs / vendors preserved | **Pass** |
| Stock tables + movement RPC | **Pass** |
| MEDIA `facility_asset` | **Pass** |
| Complete allow / PM deny | **Pass** |
| Memberships / subscriptions unchanged | **Pass** |
| Application deployed | **No** |

**Verdict: READY FOR APPLICATION DEPLOYMENT**

---

## Explicitly not done

- Application / Vercel deploy of PR #211
- Stripe / billing / price / SKU / role / entitlement changes
- Replay of `20260814160000`
- Creating `maintenance_notifications`
- Live FO-tenant UI proof (no FO subscription; app not deployed)
- Authenticated browser UAT

---

**STOP.** Schema is on Production. Do not deploy the application from this record.
