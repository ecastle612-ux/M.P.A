# 06 — Conceptual Data Model

**Parent:** [FAC-OPS-001](./index.md)  
**Status:** Proposed  
**Constraint:** Conceptual entities only — **no SQL**, no migrations in this package  
**Commercial owner:** Facility Operations  
**Tenancy:** All entities org-scoped; RLS required at Implement

---

## Prefix plan (logical)

| Prefix | Owns |
|--------|------|
| `facility_site_` / site profile | Sites |
| `facility_location_` | Locations within site |
| `facility_asset_` | Assets |
| `facility_asset_category_` | Categories |
| `facility_system_` | Building systems |
| `facility_pm_` | Preventive schedules & generation runs |
| `facility_inventory_` | Stock locations & levels |
| `facility_part_` | Parts catalog & movements |
| `facility_inspection_` | Programs & runs |
| `facility_safety_` | Incidents |
| `facility_compliance_` | Obligations |
| `facility_capital_` | Future CapEx |
| `work_order_` (existing shared) | Execution domain + **product context** |

Do not place FO assets under `property_` ownership.

---

## Entity catalog

### FacilitySite

| Attribute | Notes |
|-----------|-------|
| id, organization_id | Tenancy |
| name, timezone, status | `draft`/`active`/`archived` |
| property_id | Optional FK to PM property |
| address fields | Operational address |
| created/updated | Audit |

### FacilityLocation

| Attribute | Notes |
|-----------|-------|
| site_id, parent_location_id | Hierarchy |
| name, type | building, floor, room, yard, storeroom, … |
| status | active/archived |

### AssetCategory

| Attribute | Notes |
|-----------|-------|
| name, criticality_default | Taxonomy |
| organization_id | Org-defined categories |

### Asset

| Attribute | Notes |
|-----------|-------|
| site_id, location_id | Placement |
| parent_asset_id | Hierarchy |
| category_id, name, asset_tag | Identity |
| manufacturer, model, serial | Optional |
| criticality | critical/high/medium/low |
| status | intake/active/in_repair/decommissioned |
| installed_on, warranty_until | Lifecycle dates |
| system_ids | M2M building systems |

### BuildingSystem

| Attribute | Notes |
|-----------|-------|
| site_id, name, system_type | HVAC, fire, electrical, … |
| status | active/degraded/down/decommissioned |
| criticality | |

### PreventiveMaintenanceSchedule

| Attribute | Notes |
|-----------|-------|
| asset_id and/or system_id | Target |
| cadence | RRULE-like or day/interval model at Implement |
| next_due_on, last_completed_on | |
| status | draft/active/paused/retired |
| work_template | title, priority, checklist ref |

### PreventiveGenerationRun

| Attribute | Notes |
|-----------|-------|
| schedule_id, due_on, work_order_id | Link to shared WO |
| status | due/work_created/work_completed/acknowledged |

### Part

| Attribute | Notes |
|-----------|-------|
| sku, name, uom | Catalog |
| critical_part | bool |
| reorder_threshold_default | |

### InventoryLocation

| Attribute | Notes |
|-----------|-------|
| site_id, location_id | Often storeroom |
| name | |

### InventoryStock

| Attribute | Notes |
|-----------|-------|
| part_id, inventory_location_id | |
| quantity_on_hand | |
| reorder_threshold | |

### PartMovement

| Attribute | Notes |
|-----------|-------|
| part_id, location_id, direction | receive/issue/adjust |
| quantity, reason | |
| work_order_id | Required for issue (consumable) |
| actor_id | |

### InspectionProgram

| Attribute | Notes |
|-----------|-------|
| site_id, name, cadence | |
| checklist_template | Ordered items |
| status | active/retired |

### InspectionRun

| Attribute | Notes |
|-----------|-------|
| program_id, status | scheduled/in_progress/completed_pass/fail/cancelled |
| started_at, completed_at, actor_id | |
| results | Per-item pass/fail/notes |
| spawned_work_order_ids | |

### SafetyIncident

| Attribute | Notes |
|-----------|-------|
| site_id, severity, type | incident/near_miss |
| status | reported/triaged/actions_open/closed |
| description, closed_summary | |
| work_order_ids | Corrective actions |

### ComplianceObligation

| Attribute | Notes |
|-----------|-------|
| site_id, title, authority | |
| due_on, status | upcoming/due/overdue/satisfied/waived |
| evidence_document_ids | |
| waiver_reason | If waived |

### CapitalProject (future)

| Attribute | Notes |
|-----------|-------|
| name, status, budget_hint | No GL |
| asset_ids / system_ids | Links |

---

## Relationships (summary)

```
Organization
 └── FacilitySite ──optional── Property (PM)
       ├── FacilityLocation (tree)
       ├── BuildingSystem ──m2m── Asset
       ├── Asset (tree)
       ├── PMSchedule → GenerationRun → WorkOrder
       ├── InventoryLocation → InventoryStock → Part
       ├── InspectionProgram → InspectionRun → WorkOrder*
       ├── SafetyIncident → WorkOrder*
       └── ComplianceObligation → Documents
```

---

## Lifecycle rules

1. Decommissioned assets cannot receive new PM schedules.  
2. Archived sites hide from MC default but remain readable for audit.  
3. Part issue without WO forbidden for consumable policy (configurable later; default enforce).  
4. Waived compliance requires elevated permission + reason.  
5. All deletes prefer soft-archive; hard delete only per platform data-lifecycle policy.

---

## Ownership & permissions (logical)

| Entity | Manage | View |
|--------|--------|------|
| Site, Asset, System, PM, Inventory, Parts, Inspection, Safety, Compliance | FO manage permissions | FO view |
| WorkOrder facility context | Create: FO; Assign/Complete: Maintenance permissions | Per role |
| Documents on FO aggregates | Platform docs + FO permission | Entitled |

Exact permission strings at Implement must extend existing permission taxonomy without colliding with `pm.*`.

---

## Related

- [07 Work Order Product Context](./07-work-order-product-context.md)  
- [04 Workflow Catalog](./04-workflow-catalog.md)  
