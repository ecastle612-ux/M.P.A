# ADR-028: FAC-003 Asset and Inventory Management

## Status
Accepted

## Accepted
2026-08-14 — Product Owner authorization for FAC-003 Phase 1 (docs/102 Approved).

## Amendment
2026-08-14 — [ADR-029](./adr-029-fac-003-production-uat-remediation.md) (Accepted) amends the SELECT-policy *implementation* (RETURNING-safe, equivalent privileges) and states that `maintenance_notifications` is optional/legacy for work-order lifecycle. Privilege, ledger, MEDIA-001, and FAC-002 decisions in this ADR are unchanged.

## Date
2026-08-14

## Context

Facility Operations Production MVP (ADR-020) reused `maintenance_work_orders` with `work_surface = facility` and a free-text `facility_asset_label`. FAC-002 (ADR-025) delivered work-order operational reports and listed asset history and inventory reports as future types. MEDIA-001 (ADR-023) is the only operational photo/video path. PLAT-002 (ADR-026) is the customer authorization pipeline.

Customers still cannot register equipment, hold stock quantities, or see asset maintenance history as a first-class Facility Operations workflow. Current `/facility/assets` is “Buildings & Sites.” Current `/facility/inventory` is a work-order category queue.

Production already has FAC-001 tables (`facility_assets`, `facility_inventory_items`, `facility_work_order_materials`, `facility_pm_schedules`). `facility_assets` is a usable registry spine (4 live rows) but FKs to legacy `properties` and lacks floor/room, purchase date, vendor, scan code, and a `maintenance` lifecycle. `facility_inventory_items` is **serialized equipment**, not a quantity ledger.

Inventing a second work-order system would violate ADR-020. A warehouse management system or purchasing ERP would violate the product goal and ADR-010. New SKUs, roles, or entitlement keys would violate the Product Constitution and this program’s constraints. Implementing before approval would violate ADR-012.

Related:

- Feature design: `docs/102-fac-003-asset-inventory-management/index.md`
- ADR-003 four-plane authorization
- ADR-004 vendor marketplace
- ADR-010 defer full accounting
- ADR-012 Implementation Gate
- ADR-019 Product Constitution
- ADR-020 shared work orders
- ADR-023 MEDIA-001
- ADR-025 FAC-002 report registry
- ADR-026 authorization pipeline
- FO module map: `docs/24-product-architecture/facility-operations-module-map.md`

ADR-027 is reserved on the unmerged PLAT-002 production-compatibility branch. This record is **028** to avoid collision.

## Decision

1. Introduce **FAC-003 Asset & Inventory Management** as a **Facility Operations capability** (also available on Complete). It is not a fourth product, SaaS tier, or Enterprise SKU. Property Manager does not receive facility assets/inventory in this decision.

2. **Assets:** Evolve Production `facility_assets` additively. Do not create a second asset table. Do not drop FAC-001 rows. Add the missing operational fields (including lifecycle `maintenance`, location labels, `scan_code`, `purchase_date`, `vendor_id`) in an Approved implement migration. Resolve legacy `properties` vs `property_properties` with a compatibility mapping — do not require a dual-stack rewrite in Phase 1.

3. **Inventory:** Introduce a **stock item + append-only movement ledger** (`facility_stock_items` / `facility_stock_movements` or equivalent names). Do **not** reuse `facility_inventory_items` as the quantity system. Leave that table in place; FAC-003 UI does not manage it. Quantity on hand changes only through movements (`receive`, `issue`, `adjust`, `usage`). Negative on-hand fails closed.

4. **Work orders:** Keep `maintenance_work_orders` as the only maintenance system. Add optional `facility_asset_id`. Keep `facility_asset_label`. Asset history is completed (and cancelled) facility work orders for that id. Optional stock `usage` movements reference the same work order. Do not write new history into `facility_records`.

5. **Media:** Attach asset photos through MEDIA-001 by adding `facility_asset` to the polymorphic parent allowlist. Job evidence stays `maintenance`. PDFs and manuals wait for DOC-001.

6. **Reports:** Add asset and inventory report types to the FAC-002 registry (list, status, history, repair frequency, on-hand, low stock, usage, reorder). Same org/surface/export/audit rules. No warehouse. No cost columns.

7. **Authorization:** Use the ADR-026 pipeline. Reuse existing entitlements `facility.assets` and `facility.inventory`. No new roles. No new entitlement keys. Technicians are assignment-scoped (read linked assets; record usage on assigned facility work only). Tenants, owners, vendors, and Property Manager SKU are denied. Default RBAC reuse is `pm.maintenance:*` plus those entitlements unless Approve authorizes new capability keys.

8. **Not a WMS.** No bin graph, waves, purchasing, or multi-warehouse automation. Floor/room/storage are labels in Phase 1. QR/barcode scanning, preventive generation, and Parts BOM are later designs. `scan_code` and existing `facility_pm_schedules.asset_id` are compatibility hooks only.

9. **Implementation is authorized** for Phase 1 while this ADR is **Accepted** and docs/102 is **Approved**. Material scope changes restart Design → Document → Approve. No Production apply, billing, or Stripe changes without Owner authorization.

## Consequences

**Easier:** Facility teams get a real registry and stock ledger without a second CMMS or WO stack; FAC-002 and MEDIA-001 stay the report and photo spines; PLAT-002 boundaries stay intact; Production FAC-001 assets are not abandoned.

**More difficult:** Implement must handle legacy `properties` FKs and must not confuse serialized `facility_inventory_items` with stock; `/facility/assets` and `/facility/inventory` change meaning from site/queue shells to registry/ledger; Complete vs PM denial must be tested; movement integrity needs a transactional helper.

## Alternatives Considered

- **Greenfield asset/inventory tables only:** Rejected — Production already has `facility_assets` with live rows and overlapping identity fields.  
- **Use `facility_inventory_items` as stock:** Rejected — no quantity, unit, threshold, or movement model; statuses are serialized-equipment.  
- **Second work-order or `facility_records` history write path:** Rejected — violates ADR-020.  
- **Full WMS / purchasing / cost:** Rejected — out of product goal and ADR-010.  
- **New roles or entitlement keys:** Rejected — existing `facility.assets` / `facility.inventory` and PLAT-002 pipeline suffice.  
- **PM SKU assets in Phase 1:** Rejected — facility-plane capability; requires a later Approve.  
- **Implement before Approve:** Rejected — violates ADR-012.
