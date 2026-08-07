# 02 — Operational Philosophy

**Parent:** [FAC-OPS-001](./index.md)  
**Status:** Proposed

---

## Three products, one OS

| Product | Job |
|---------|-----|
| **Property Manager** | Lease, resident, rent, unit turnover, residential maintenance |
| **Facility Operations** | Asset/system stewardship, programs, facility risk & readiness |
| **Complete Platform** | Union of both without duplicate homes |

Master Admin is the operator OS — not a customer SKU.

---

## Facility Operations vs Maintenance vs Property Management

| Concern | Facility Operations | Maintenance (PM) | Property Management (broader PM) |
|---------|---------------------|------------------|----------------------------------|
| Primary object | Asset, system, site, program | Work order, unit, resident request | Property, lease, resident, money |
| Planning | Preventive schedules, inspection calendars, compliance obligations | Dispatch, SLA, technician load | Leasing pipeline, rent cycles |
| Corrective work | Opens **facility-context** work using shared WO domain | Executes WOs (tech/vendor) | Owns residential request intake |
| Inspections | Building/safety/facility programs | May execute WO tasks from FO programs | Lease move-in/out inspections |
| Inventory | Storerooms, parts, BOM | Consumes parts on WO close | N/A |
| Success | Plant readiness & compliance | Work completed on time | Occupancy & collections |

### One-line rule

**Facility generates and manages operational programs. Maintenance executes operational work.**

---

## Ownership boundaries

### Facility owns

- Site / facility profile (facility view of a managed location)  
- Assets & hierarchy  
- Building systems  
- Preventive maintenance **programs** (schedules, routes, generation rules)  
- Inventory locations & counts  
- Parts catalog & BOM links  
- Facility inspection **programs**  
- Safety programs & incidents  
- Facility compliance obligations  
- Facility Mission Control attention model  
- Facility operational reports  

### Maintenance owns (PM product)

- Work order lifecycle execution  
- Technician assignment & completion  
- Vendor assignment for execution  
- Repairs as WO outcomes  
- Resident maintenance request portal & PM queue  

### Shared Platform owns

- Work order **persistence domain** (single table family with product context)  
- Vendors marketplace identity  
- Documents, Communications, Search, Notifications, Timeline, Audit, Assistant  
- Organizations, entitlements, permissions  

### Explicitly not Facility

| Capability | Owner |
|------------|-------|
| Residents, Leasing, Rent | Property Manager |
| Owner reporting (rent/NOI) | Property Manager |
| Unit make-ready / turnover | Property Manager |
| Lease move-in/out inspections | Property Manager |
| SaaS subscription billing UI | Shared Platform |

---

## Shared responsibilities

| Concern | How shared |
|---------|------------|
| Work orders | FO creates with `product_context=facility` (+ asset/system links); Maintenance executes in execution surfaces |
| Vendors | Same marketplace identity; FO may assign for facility WOs |
| Documents | Attached to asset/system/inspection/incident aggregates |
| Communications | Threads on FO aggregates; notifications via shared service |
| Properties | PM `property_properties` remains portfolio identity; FO **site profile** references property when Complete/PM+FO |

---

## Domain events (canonical prefixes)

Emit via existing `event_domain_events` / audit patterns. Types are contracts for Implement:

| Event | Emitter | Meaning |
|-------|---------|---------|
| `facility.site.created` | FO | Site profile established |
| `facility.site.activated` | FO | Site ready for programs |
| `facility.asset.created` / `.updated` / `.decommissioned` | FO | Asset lifecycle |
| `facility.system.created` / `.status_changed` | FO | Building system |
| `facility.pm_schedule.created` / `.due` / `.generated_work` | FO | Preventive program |
| `facility.inventory.adjusted` / `.stockout` | FO | Inventory |
| `facility.part.issued` / `.received` | FO | Parts movement |
| `facility.inspection.started` / `.completed` / `.failed` | FO | Inspections |
| `facility.safety.incident_reported` / `.closed` | FO | Safety |
| `facility.compliance.obligation_due` / `.satisfied` | FO | Compliance |
| `work_order.created` / `.assigned` / `.completed` / `.closed` | Shared WO | Execution (any product context) |

FO Mission Control **reads** these events + derived due dates; it does not invent a second event bus.

---

## Anti-patterns (forbidden)

1. Second work-order product tree under `/facility` that bypasses shared WO domain  
2. FO “Maintenance” nav item that clones PM Maintenance Command Center  
3. Asset tables under `property_` prefix owned by PM  
4. Facility rent/ledger features  
5. Hiding FO modules from Master Admin  

---

## Related

- [07 Work Order Product Context](./07-work-order-product-context.md)  
- [08 Subscription Alignment](./08-subscription-alignment.md)  
