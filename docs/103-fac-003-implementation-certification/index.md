# FAC-003 IMPLEMENTATION CERTIFICATION

**Title:** FAC-003 IMPLEMENTATION CERTIFICATION  
**Status:** READY  
**Date:** 2026-08-14  
**Program:** FAC-003  
**Authority:** [docs/102](../102-fac-003-asset-inventory-management/index.md) Approved · [ADR-028](../18-decision-log/adr-028-fac-003-asset-inventory-management.md) Accepted  
**Gate:** Design → Document → Approve → **Implement** (ADR-012)  
**Production:** **No production deployment** from this package  
**Billing / Stripe:** No changes  
**Roles / SKUs / entitlement keys:** No additions  

---

## Verdict

**READY** for review. Phase 1 application, schema, authorization, reports, MEDIA-001 parent, and tests are in this branch. **Do not apply the migration to Production. Do not deploy.**

---

## Scope delivered

| Phase | Delivery |
|-------|----------|
| A | Evolved `facility_assets`: lifecycle `maintenance`, floor/room/building labels, scan code, purchase date, vendor, additive `property_property_id`. Existing rows preserved. MEDIA-001 `related_entity_type = facility_asset`. |
| B | New `facility_stock_items` + append-only `facility_stock_movements`. Receive / issue / adjust / usage via `apply_facility_stock_movement`. **Not** `facility_inventory_items`. |
| C | Optional `maintenance_work_orders.facility_asset_id`. `facility_asset_label` kept. Asset history = completed / closed / cancelled facility work orders. |
| D | FAC-002 report types: asset list / status / repair history / repair frequency; current stock / low stock / usage / reorder. CSV + `facility_report.exported` audit. |
| E | PLAT-002 wrappers `requireFacilityAssetPermission` / `requireFacilityInventoryPermission`. FO and Complete managers allowed. PM SKU, tenant, owner, vendor denied. Technician: assigned asset read + usage only. |
| F | Asset CRUD, inventory movement, audit, work-order relationship, MEDIA-001, RLS contract, and PLAT-002 authorization tests. |

---

## Constraints honored

- No warehouse / ERP / purchasing / bins / waves
- No DOC-001 or SHEET-001
- No QR scanning UX (scan code stored only)
- No preventive maintenance generation
- No new roles, entitlement keys, SKUs, or Stripe changes
- No second work-order table
- No writes to `facility_records`
- No reuse of `facility_inventory_items` as the stock ledger
- No Production migration apply
- No Production deploy

Approve-silent defaults used (docs/102 Q1–Q6):

- Reuse `pm.maintenance:*` + existing `facility.assets` / `facility.inventory`
- Additive `property_property_id`; legacy `properties` FK not dropped
- Low stock: `reorder_level` if set, else `min_threshold`
- Asset history = work orders only
- Serialized `facility_inventory_items` unread by FAC-003 UI
- APIs: `/api/facility/assets`, `/api/facility/inventory`

---

## Authorization matrix (verified in tests)

| Actor | Assets | Inventory | Reports |
|-------|--------|-----------|---------|
| FO manager | Manage | Manage | View |
| Complete manager | Manage | Manage | View |
| Property Manager SKU | Denied | Denied | Denied |
| Tenant / owner / vendor | Denied | Denied | Denied |
| Technician | Assigned facility WO assets only | Usage on assigned facility WOs only | Denied (manager-only report wrappers) |

Pipeline: Authentication → Organization → Role → SKU entitlement → Module permission → Action.

---

## Schema

Migration: `supabase/migrations/20260814200000_fac_003_asset_inventory.sql`

- `CREATE TABLE IF NOT EXISTS` + additive columns
- Compat map copies `property_property_id` only when ids already match `property_properties`
- `property_id` remains nullable; new rows do not write legacy `properties` ids
- Movements insert `WITH CHECK (false)` — RPC only
- Helpers revoke `anon` EXECUTE
- MEDIA check adds `facility_asset`

**Not applied to Production.**

---

## Customer surfaces

| Route | Job |
|-------|-----|
| `/facility/assets` | Asset registry |
| `/facility/assets/[id]` | Detail, lifecycle, MEDIA-001 photos, history, create WO |
| `/facility/inventory` | Stock ledger |
| `/facility/inventory/[id]` | On-hand, movements |
| `/facility/operations` | Optional registered-asset picker; label preserved |
| `/facility/reports` | FAC-002 work-order reports + asset/inventory types |

Parts / preventive / inspection / safety / compliance remain category queues.

---

## Tests run (this certification)

| Suite | Result |
|-------|--------|
| `@mpa/shared` commercial + media + maintenance schemas + facility schemas + reports | **183 passed** |
| `@mpa/web` FAC-003 asset / inventory / reports / authz / RLS / MEDIA / WO relationship | **26 passed** |
| `@mpa/web` facility + media + auth + FO marketing + FAC-002 report routes | **148 passed** (29 files) |
| `@mpa/web` `tsc --noEmit` | **Pass** |

Coverage mapped to the approved acceptance criteria: FO/Complete manage, PM/tenant deny, technician assigned-only, movement integrity, WO history, MEDIA-001 parent, FAC-002 report types, no new commercial keys.

---

## Explicitly not done

- Production migration apply
- Production Vercel deploy
- Browser UAT / Preview deploy
- QR / barcode scanner UX
- Preventive schedule generation
- Parts BOM
- DOC-001 / SHEET-001
- Warehouse / ERP / cost accounting
- PM SKU asset/inventory grant

---

## Rollback

- App: revert this branch / SHA. No Production schema from this package.
- If a later Owner-authorized apply occurs: drop additive policies/helpers/tables only after a new Approve; do not delete FAC-001 `facility_assets` rows.

---

CI lint on this package was later remediated in [docs/107](../107-fac-003-ci-remediation-merge-readiness/index.md) (**READY FOR MERGE**). No production deployment from this record.

**STOP.** Certification only. No production deployment.
