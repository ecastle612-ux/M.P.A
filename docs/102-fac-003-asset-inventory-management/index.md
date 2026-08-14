# FAC-003 ASSET & INVENTORY MANAGEMENT DESIGN

**Title:** FAC-003 ASSET & INVENTORY MANAGEMENT DESIGN  
**Status:** Draft  
**Date:** 2026-08-14  
**Program:** FAC-003  
**Related ADR:** [ADR-028](../18-decision-log/adr-028-fac-003-asset-inventory-management.md) (Proposed)  
**Gate:** Design → Document → **Approve** → Implement (ADR-012)  
**Production:** No production change from this package  
**Billing / Stripe / roles / SKUs:** No changes  
**New entitlement keys:** None  
**New roles:** None  

---

## Constraints honored

This package does **not**:

- Change application code, UI, or tests
- Write or apply migrations
- Change production data, Auth, Storage, or Edge Functions
- Change billing, Stripe products, prices, checkout, or SKUs
- Add roles or entitlement keys
- Add RBAC capability keys without a later Approve

Recommended actions are implementable only after **Approve**. They are not work orders from this record.

---

## 1. Product goal

Give Facility Operations an **operational** asset registry and stock ledger so a facility team can:

- Track equipment and assets at a site
- Track supplies and stock
- Place assets on a facility / building / floor / room
- Attach assets to work orders
- See maintenance history from those work orders
- Produce asset and inventory reports

This is **not** a warehouse management system (no bins, waves, pick/pack, multi-warehouse replenishment, barcode hardware product, or purchasing ERP).

It is **not** a second maintenance system. Corrective and preventive work stays on `maintenance_work_orders` (ADR-020).

### Goals (Phase 1, after Approve)

1. Asset identity, location, lifecycle, and manufacturer/vendor details  
2. Inventory item + quantity ledger with add / remove / adjust / usage  
3. Work order ↔ asset link; asset history = completed facility work  
4. MEDIA-001 photos on assets (and usage evidence on work orders as today)  
5. FAC-002-pattern reports (list, status, history, stock, low stock, usage, reorder)  
6. PLAT-002 authorization (SKU + role + capability + action)  
7. Production-compatible schema — evolve live FAC-001 objects; do not invent a parallel CMMS  

### Non-goals (this package)

- Application code, UI, migrations, or Production apply  
- Warehouse / ERP / purchasing / accounting (ADR-010)  
- Parts BOM catalog (`facility.parts` stays a work-order category until a later design)  
- Preventive schedule generation (tables exist; scheduling is a later program)  
- QR/barcode scanning UX (reserve a scan code only)  
- DOC-001 operational documents or SHEET-001 operational tables  
- Capital Projects  
- Property Manager residential asset/inventory (unless a later Approve extends SKU)  
- New commercial product, SaaS tier, or Enterprise SKU  

---

## 2. Constitution and product fit

| Rule | Application |
|------|-------------|
| Three products only | FAC-003 is a **Facility Operations capability**, not a fourth product |
| Facility Operations | Full asset + inventory manage + reports |
| Complete Platform | Facility access **plus** the existing PM union — no PM asset module in Phase 1 |
| Property Manager | **No** facility assets/inventory unless a later Approve adds a SKU grant |
| Enterprise | Sales motion only — must not appear in landing, pricing, or Confirm Plan |
| Commercial flow | Unchanged |
| Capital Projects | Not a commercial product; out of scope |

Canopy and Experience Architecture remain visual/interaction authority when UI is later approved.

---

## 3. What Production already has

Read-only snapshot of `mpa-prod` / `vahnmcrpnuggxkivynvo` (2026-08-14). FAC-003 must not pretend these objects are absent.

| Object | Live shape | FAC-003 use |
|--------|------------|-------------|
| `facility_assets` (4 rows) | Org + **legacy** `properties` FK, `asset_code`, type, manufacturer/model/serial, warranty, status `active` / `replaced` / `retired`, `location_scope` property/building/unit/common_area, soft delete | **Evolve** — canonical asset registry |
| `facility_inventory_items` (1 row) | Serialized equipment (`available` / `in_service` / `repair` / …), optional serial/warranty, **no quantity** | **Not** the stock ledger. Leave in place. Do not treat as FAC-003 inventory. |
| `facility_work_order_materials` (0 rows) | WO line: name, quantity, optional `inventory_item_id` | Reuse for usage lines; point at the **new** stock item when implemented |
| `facility_pm_schedules` / occurrences | Asset-optional PM cadence | Future preventive program — do not activate from this design |
| `facility_records` | Legacy completed-work notes with optional `asset_id` | Do not write a second history store. History = shared work orders. |
| `/facility/assets` UI | “Buildings & Sites” — `property_properties` as buildings | Replace meaning after Approve: **Asset registry**. Sites remain the location parent. |
| `/facility/inventory` UI | Inventory-category **work-order queue** | Replace meaning after Approve: **Stock ledger**. Category queues stay on Operations. |
| Work orders | `facility_asset_label` text only; `work_surface` isolation live (PLAT-002) | Add optional `facility_asset_id`; keep label for unlabeled work |
| Entitlements | `facility.assets`, `facility.inventory`, `facility.parts` already on FO and Complete | **Reuse**. No new keys. |
| MEDIA-001 | `related_entity_type` has no `facility_asset` | Additive parent type after Approve |
| Location graph | No floor/room/storeroom tables | Phase 1 uses **labels**, not a space BIM |

`facility_assets.property_id` currently references legacy `properties`, while FO work orders use `property_properties` (PLAT-001 M12 dual stack). The implement package must include a **Production-compatible location mapping**. It must not drop `properties` or rewrite customer rows from this design.

---

## 4. User workflows

Actors: Facility manager (org admin / property_manager on an FO or Complete SKU). Technician is assignment-scoped. Tenant has no access.

### 4.1 Register an asset

1. Open Facility **Assets**.  
2. Create asset: name, type, asset tag (`asset_code`), site (facility/property), optional building / floor / room labels.  
3. Add manufacturer, model, serial, purchase date, warranty, vendor (existing `vendor_vendors`).  
4. Status starts **Active**.  
5. Attach photos via MEDIA-001.  
6. Optional scan code stored for future QR/barcode (no scanner UX in Phase 1).

### 4.2 Locate and update an asset

1. Filter by site, type, status, vendor.  
2. Open the asset.  
3. Change location labels or lifecycle (Active → Maintenance → Active, or Retired / Replaced).  
4. Replaced assets stay readable; a later asset may record `replaced_asset_id` (optional Phase 1 column).

### 4.3 Work an asset

1. From the asset, **Create facility work order** (pre-fills `facility_asset_id`, site, label).  
2. Or from Operations, pick an existing asset (optional).  
3. Complete the work on the shared WO lifecycle.  
4. Asset **History** lists completed/cancelled facility WOs for that id. MEDIA on the WO remains MEDIA-001.

### 4.4 Stock a storeroom

1. Open Facility **Inventory**.  
2. Create a stock item: name, category, unit of measure, storage location label, min threshold, reorder level, supplier/vendor.  
3. **Add stock** (receive), **Remove stock** (issue/waste), **Adjust** (count correction). Each writes a movement row.  
4. **Record usage** from a facility work order (quantity decrements; movement type `usage` links `work_order_id`).

### 4.5 Reorder and report

1. Low-stock list: `quantity_on_hand <= reorder_level` (or min threshold — see Q3).  
2. Reports home (FAC-002 chrome): asset list/status/history/repair frequency; stock / low / usage / reorder.  
3. CSV + PDF using existing export patterns. Audit every export.

---

## 5. Asset model

### 5.1 Types (controlled list + custom)

| Type key | Examples |
|----------|----------|
| `hvac` | Air handlers, chillers, rooftop units |
| `medical` | Clinic devices the facility team owns |
| `furniture` | Waiting-room and office furniture |
| `appliance` | Kitchen / break-room appliances |
| `electrical` | Panels, generators, lighting plants |
| `plumbing` | Pumps, water heaters, backflow |
| `safety` | Extinguishers, AEDs, eyewash |
| `other` | `custom_type_label` required |

Do not invent a medical-device regulatory module. Medical is an **ownership type**, not a compliance product.

### 5.2 Identity

| Field | Source | Notes |
|-------|--------|-------|
| Name | `facility_assets.name` | Required |
| Type | `asset_type` + optional custom label | Required |
| Asset tag / ID | `asset_code` | Unique per organization |
| Scan code | **Additive** `scan_code` | Nullable; future QR/barcode. Not a second unique id in Phase 1 |

### 5.3 Location

Operational, not a CAD/BIM graph.

| Level | Phase 1 representation |
|-------|------------------------|
| Facility / site | Required FK to the org’s operational property (`property_properties` going forward; compat map from legacy `properties`) |
| Building | Existing `building_id` if a real building row exists later; otherwise `location_note` / additive `building_label` |
| Floor | Additive `floor_label` (text) |
| Room / location | Additive `room_label` (text) plus existing `location_scope` |

`location_scope` (`property` / `building` / `unit` / `common_area`) stays. Unit-scoped assets may keep `unit_id` when the site has units. Do not require a unit for building systems.

### 5.4 Lifecycle

| Status | Meaning |
|--------|---------|
| `active` | In service |
| `maintenance` | **Additive** — down / under repair (not retired) |
| `retired` | Removed from service |
| `replaced` | Superseded; keep history |

Existing check is `active` / `replaced` / `retired`. Implement adds `maintenance` only after Approve.

### 5.5 Details

Reuse: manufacturer, model, serial, warranty start/end/notes, install date.  
**Additive:** `purchase_date`, `vendor_id` → `vendor_vendors` (org-scoped).  
Keep replacement-planning columns already on the table. Do not add cost/GL fields (ADR-010).

### 5.6 History

| History kind | System of record |
|--------------|------------------|
| Work / repairs | `maintenance_work_orders` where `facility_asset_id` = asset and `work_surface = facility` |
| Photos | MEDIA-001 `related_entity_type = facility_asset` (and WO media for job evidence) |
| Documents | **Future DOC-001** — do not attach PDFs through MEDIA-001 |
| Legacy `facility_records` | Read-only if an implement package chooses to show them; no new writes |

---

## 6. Inventory model

### 6.1 Why a new ledger

`facility_inventory_items` is a **serialized equipment** record (status `in_service`, serial, warranty). It cannot express “24 filters, each, storeroom A, reorder at 6.”

FAC-003 inventory is **consumable / stockable material**:

| Examples | Category keys (Phase 1) |
|----------|-------------------------|
| Filters | `filters` |
| Cleaning supplies | `cleaning` |
| Replacement parts (loose stock, not a BOM) | `parts` |
| Safety supplies | `safety` |
| Office supplies | `office` |
| Other | `other` |

### 6.2 Stock item (new entity)

Proposed name: `facility_stock_items` (final name at implement; must not collide with `facility_inventory_items`).

| Field | Required | Notes |
|-------|----------|-------|
| organization_id | ● | Tenant key |
| name | ● | |
| category | ● | Controlled list above |
| quantity_on_hand | ● | Numeric ≥ 0; **only** changed by movements |
| unit_of_measure | ● | `each`, `box`, `case`, `gallon`, `liter`, `roll`, `pair` |
| facility / property_id | ● | Site that owns the stock |
| storage_location_label | ● | “Boiler room cage”, not a bin graph |
| min_threshold | ○ | Attention |
| reorder_level | ○ | Reorder report |
| vendor_id | ○ | Supplier — existing vendors |
| sku_code | ○ | Supplier SKU text; not a commercial M.P.A. SKU |
| status | ● | `active` / `inactive` |
| notes | ○ | |
| created_by / timestamps / deleted_at | ● | Soft delete |

One row = one catalog item at one site + storage label. Split sites = split rows. That is enough for facility closets. It is not multi-warehouse WMS.

### 6.3 Movements (new entity)

Proposed name: `facility_stock_movements` (append-only).

| Type | Quantity sign | Extra |
|------|---------------|-------|
| `receive` | + | Optional vendor / note |
| `issue` | − | Optional note |
| `adjust` | + or − | Required reason |
| `usage` | − | **Required** `work_order_id` (facility surface) |

Rules:

- Application (or SECURITY DEFINER helper) updates `quantity_on_hand` in the same transaction as the movement.  
- Fail closed if result would be negative.  
- Do not update quantity with a bare `UPDATE` from the client.  
- `usage` requires the caller can act on that work order (PLAT-002 action step).

### 6.4 Actions

| Action | Movement |
|--------|----------|
| Add stock | `receive` |
| Remove stock | `issue` |
| Adjust quantity | `adjust` |
| Record usage | `usage` + optional `facility_work_order_materials` line |

Inventory history = movement table. Do not invent a second audit store for quantities.

---

## 7. Work order integration

```
Asset  →  Work order (shared)  →  Maintenance history (same WO)
              ↓
         Stock usage (optional)
```

| Requirement | Design |
|-------------|--------|
| WO may reference an asset | Additive nullable `maintenance_work_orders.facility_asset_id` → `facility_assets.id` |
| Same org + facility surface | Check: asset `organization_id` = WO org; WO `work_surface = facility` |
| Unlabeled work remains valid | Keep `facility_asset_label` |
| History | Query completed/closed/cancelled facility WOs by `facility_asset_id` |
| Media | WO evidence stays `related_entity_type = maintenance`; asset photos are `facility_asset` |
| No duplicate maintenance | No new work-order table. Do not write `facility_records` for FAC-003 history |
| Materials | Prefer `facility_work_order_materials.stock_item_id` (additive) over the serialized `inventory_item_id` |

Technician usage: only on **assigned** (or manager-visible) facility work orders.

---

## 8. Reporting integration

Extend the **FAC-002 report-type registry** (ADR-025). Do not build a second export stack or a warehouse.

### 8.1 Asset reports

| Report | Question | Source |
|--------|----------|--------|
| Asset list | What do we own? | `facility_assets` |
| Asset status | What is active / in maintenance / retired / replaced? | Group by lifecycle |
| Maintenance history | What work happened on this asset / these assets? | WOs by `facility_asset_id` + period |
| Repair frequency | Which assets come back most often? | Count of completed WOs per asset in period |

### 8.2 Inventory reports

| Report | Question | Source |
|--------|----------|--------|
| Current stock | What is on hand? | `facility_stock_items` |
| Low inventory | What is at or below threshold? | `quantity_on_hand <= reorder_level` (Q3) |
| Usage history | What was consumed on jobs? | Movements `usage` (+ optional issue) |
| Reorder report | What should we buy? | Low inventory + vendor + unit + suggested qty (reorder − on hand, floor 0) |

### 8.3 Shared FAC-002 rules

- Homes: FO **Reports** (and Complete FO Reports). Not RAC. Not FIN-OPS.  
- Filters: site, type/category, status, vendor, date (history/usage).  
- CSV + professional PDF; row caps and export audit as FAC-002.  
- Surface: facility only. PM SKU cannot run these reports.  
- MEDIA: indicator only in Phase 1 exports (no binary zip).  
- Cost / invoice columns: **out** (ADR-010).

---

## 9. Permission model (PLAT-002)

Pipeline (fail closed):

```
Authentication → Organization → Role → SKU entitlement → Module permission → Action
```

Wrappers call `requireAuthorizedAction`. Suggested names at implement: `requireFacilityAssetPermission`, `requireFacilityInventoryPermission` — thin wrappers, not a second pipeline.

### 9.1 Entitlements (existing — no new keys)

| Entitlement | Routes (current map) | FAC-003 meaning |
|-------------|----------------------|-----------------|
| `facility.assets` | `/facility/assets`, `/api/facility/assets` | Asset registry |
| `facility.inventory` | `/facility/inventory`, `/api/facility/inventory` | Stock ledger |
| `platform.reports` + FO surface | FAC-002 report APIs | Asset / inventory report types |
| `facility.operations` | Operations | Create/link WO; record usage on a job |
| `facility.parts` | Unchanged category queue | **Not** the stock ledger in Phase 1 |

### 9.2 Actor matrix

| Actor | Assets | Inventory | Asset/inventory reports |
|-------|--------|-----------|-------------------------|
| Facility Operations manager (`organization_admin` / `property_manager` on FO SKU) | Manage | Manage | View |
| Complete manager | Same facility surfaces | Same | Same |
| Property Manager SKU | **Denied** | **Denied** | **Denied** |
| Tenant / resident | **Denied** | **Denied** | **Denied** |
| Owner portal | **Denied** | **Denied** | **Denied** |
| Vendor portal | **Denied** (Phase 1) | **Denied** | **Denied** |
| Technician (`maintenance_technician`) | **Read** assets referenced on **assigned** facility WOs; no registry manage | **Usage** on assigned facility WOs only; no receive/adjust | **Denied** |
| Master Admin | Operator plane only — no customer PostgREST bypass | Same | Same |

No new roles. `facility_technician` remains a UAT label, not a role (PLAT-001 L4).

### 9.3 Module permission (RBAC)

Today FO mutations reuse `pm.maintenance:*`. **Default if Approve is silent:**

| Action | Capability reuse |
|--------|------------------|
| Manager asset/inventory CRUD | `pm.maintenance:write` **and** the matching `facility.*` entitlement |
| Manager reports / export | `platform.reports:read` **and** FO SKU |
| Technician assigned usage / asset read | `pm.maintenance:read` or `:write` **and** assignment action step |

**Do not add** `facility.assets:read` / `facility.inventory:write` (or similar) unless Approve explicitly authorizes new capability keys. New keys are permissions; this design does not create them.

---

## 10. Data architecture

### 10.1 Entities (Phase 1)

```
organizations
    └── property_properties          facility / site (compat: legacy properties)
            ├── facility_assets      evolved
            │     ├── vendor_vendors (optional)
            │     ├── media_attachments (facility_asset)
            │     └── maintenance_work_orders.facility_asset_id
            └── facility_stock_items          new
                  ├── vendor_vendors (optional)
                  └── facility_stock_movements  new (append-only)
                            └── maintenance_work_orders (usage)
```

### 10.2 Additive changes (design only — SQL after Approve)

| Change | Purpose |
|--------|---------|
| `facility_assets`: `maintenance` status; `scan_code`; `floor_label`; `room_label`; `building_label`; `purchase_date`; `vendor_id`; optional `replaced_asset_id`; optional `property_property_id` compat column | Close FAC-003 asset gaps without a second table |
| `maintenance_work_orders.facility_asset_id` | Typed WO ↔ asset |
| `facility_stock_items` + `facility_stock_movements` | Quantity ledger |
| `facility_work_order_materials.stock_item_id` | Usage line → stock |
| MEDIA-001 check: add `facility_asset` (optional later `facility_stock_item`) | Photos |
| Indexes | `(organization_id, asset_code)`, `(organization_id, facility_asset_id)`, stock org+site |

No row deletes of FAC-001 data. No replay of unrelated migrations.

### 10.3 RLS approach

Follow PLAT-002: org + SKU surface + role/assignment. Helpers stay `SECURITY DEFINER` + `SET search_path = public`. **Revoke `anon` EXECUTE.**

| Table | SELECT | INSERT/UPDATE | DELETE |
|-------|--------|---------------|--------|
| `facility_assets` | FO/Complete staff with `facility.assets` **or** technician if asset is on an assigned facility WO | Manager + entitlement | Soft delete only; manager |
| `facility_stock_items` | FO/Complete staff with `facility.inventory` | Manager + entitlement | Soft delete; manager |
| `facility_stock_movements` | Same as parent item | Insert via helper only | **None** (append-only) |
| WO asset FK | Existing `can_select_work_order` | Manager/technician rules + surface + asset org match | Unchanged |

Do not grant SELECT to `is_org_member` alone (C4 lesson). PM SKU fails `org_allows_work_surface(..., 'facility')` and fails `facility.*` entitlements.

Implement must paste live `pg_policies` at apply time (Production policy names already use `*_authorized` on `facility_assets`).

### 10.4 Audit

| Event | When |
|-------|------|
| `facility_asset.created` / `.updated` / `.lifecycle_changed` | Registry writes |
| `facility_stock.moved` | Every movement (type, qty, resulting on-hand, actor, optional WO) |
| `facility_report.exported` | CSV/PDF (filters, format, row count) — FAC-002 pattern |

Use existing `audit_events` / domain-event outbox. No new audit product.

### 10.5 Media and documents

| Need | System |
|------|--------|
| Asset photos / short video | MEDIA-001 (`facility_asset`) — signed URLs, private bucket |
| Job evidence | MEDIA-001 (`maintenance`) as today |
| Manuals, warranties (PDF), contracts | **DOC-001** future — do not store PDFs as media |
| Spreadsheet-like operating logs | **SHEET-001** future |

Optional later: promote an asset photo into Document Center (MEDIA-001 bridge). Not Phase 1.

---

## 11. Security model

| Control | Requirement |
|---------|-------------|
| Organization isolation | Every query `organization_id = caller.org` |
| SKU isolation | FO and Complete only; PM denied |
| Surface isolation | Assets/stock are facility-plane; WOs that link assets must be `work_surface = facility` |
| Technician least privilege | Assigned WO only |
| Tenant / owner / vendor portals | No access |
| Quantity integrity | Movements only; no negative on-hand |
| IDOR | Validate asset, stock, vendor, property, WO ids belong to the org and are ACL-visible |
| Export | Authz + caps + audit (FAC-002) |
| Helpers | No `anon` EXECUTE |
| Fail closed | Missing entitlement or capability → 401/403 JSON on APIs; pages redirect as today |

---

## 12. Information architecture (when UI is later approved)

| Route (suggested) | Job |
|-------------------|-----|
| `/facility/assets` | Asset registry (replaces Buildings & Sites as the primary job) |
| `/facility/assets/[id]` | Detail, location, lifecycle, media, history, create WO |
| `/facility/inventory` | Stock ledger (replaces inventory-category queue as the primary job) |
| `/facility/inventory/[id]` | On-hand, movements, receive/issue/adjust |
| `/facility/operations` | Unchanged queue; asset picker + usage |
| `/facility/reports` | FAC-002 home + new report types |

Buildings & Sites context can remain a filter/section on Assets or Mission Control. Do not delete site records. Inventory-category work stays creatable from Operations.

Canopy only after UI Approve. Honest empty states. No tenant chrome.

---

## 13. Future connections

| Program | Compatibility |
|---------|----------------|
| **DOC-001** Operational documents | Attach manuals/warranties to `facility_asset` / stock item via document entity link — not MEDIA-001 |
| **SHEET-001** Operational tables | Read-only or synced views of stock on-hand / asset lists; FAC-003 remains system of record |
| **QR / barcode** | `scan_code` on assets (and later stock). Scanner UX and hardware are a later design |
| **Preventive maintenance** | Existing `facility_pm_schedules.asset_id` can point at evolved `facility_assets`. Generation engine is **not** FAC-003 |
| **Vendor management** | `vendor_id` on assets and stock uses `vendor_vendors`. No second vendor tree. Marketplace economics unchanged (ADR-004) |
| **FAC-002** | Asset/inventory report types plug into the existing registry |
| **PLAT-002** | Same pipeline; no entitlement-key or role additions |
| **Parts / BOM** | `facility.parts` remains a WO category until a Parts design. Loose part **stock** lives in FAC-003 inventory category `parts` |
| **Building systems** | Asset types `hvac` / `electrical` / `plumbing` are the Phase 1 stand-in. A systems graph is a later design |

---

## 14. Phased delivery (after Approve)

| Phase | Scope | Requires |
|-------|-------|----------|
| **1** | Evolve assets; stock ledger + movements; WO FK; MEDIA parent; FAC-002 report types; PLAT-002 wrappers | This design + ADR-028 Accepted + Owner implement authorization |
| **2** | QR scan UX; PM schedule generation; Parts BOM; DOC-001 links; floor/room graph | New Design → Document → Approve |
| **Never from FAC-003** | WMS, purchasing ERP, cost accounting, Capital Projects, PM SKU assets, new roles/SKUs | Constitution / ADR-010 / ADR-019 |

---

## 15. Open questions (for Approve)

| ID | Question | Default if Approve is silent |
|----|----------|------------------------------|
| Q1 | New RBAC keys vs reuse `pm.maintenance:*`? | Reuse `pm.maintenance:*` + existing `facility.*` entitlements |
| Q2 | Site FK: migrate `facility_assets` off legacy `properties` in Phase 1? | Additive `property_property_id` + mapping; do not drop legacy FK in Phase 1 |
| Q3 | Low stock uses `reorder_level` or `min_threshold`? | `reorder_level` if set, else `min_threshold` |
| Q4 | Show legacy `facility_records` on asset history? | Hide in Phase 1; WO history only |
| Q5 | Serialized `facility_inventory_items` UI? | Leave unread by FAC-003 UI; no automatic merge into assets |
| Q6 | Exact API paths? | `/api/facility/assets`, `/api/facility/inventory`; ownership binding |

---

## 16. Acceptance criteria (future implementation package)

Implementation may be claimed complete only when:

1. FO manager can create/update assets and stock in their org  
2. PM SKU cannot open asset/inventory routes or APIs  
3. Complete manager can use facility assets/inventory; PM union unchanged  
4. Tenant cannot access  
5. Technician cannot manage the registry; can record usage only on assigned facility WOs  
6. Completing a WO linked to an asset shows on asset history  
7. Quantity changes only through movements; negative on-hand fails  
8. Reports match FAC-002 security (org + FO surface + audit)  
9. MEDIA-001 is the only photo path  
10. No Stripe/SKU/role/entitlement-key changes; no second work-order table  

---

## 17. Governance

| Artifact | Role |
|----------|------|
| This record (`docs/102`) | Authoritative FAC-003 design |
| ADR-028 | Architectural decisions (Proposed until Accept) |
| ADR-012 | Gate — no implement while Draft/Proposed |
| ADR-019 | Product constitution |
| ADR-020 | Shared work orders |
| ADR-023 | MEDIA-001 |
| ADR-025 | FAC-002 report registry |
| ADR-026 | Authorization pipeline |
| FO module map | Assets / Inventory ownership |

### Status board

| Stage | State |
|-------|-------|
| Design | **Done** (this document) |
| Document | **Done** |
| Approve | **Pending** |
| Implement | **Blocked** until Approve |

---

**STOP.** Design only. No implementation from this record.
