# 03 — Module Architecture

**Package:** FAC-002

---

## One platform

```
Core Platform
  └── Facility Operations module (licensed)
        ├── Coordination: Work Orders, Calendar, Technician Dashboard
        ├── Memory: Facility Records + Timeline (FAC-001)
        ├── Registry: Assets (FAC-001+) + Inventory (new)
        ├── Prevention: PM Schedules → draft WOs
        ├── Field partners: Vendors (no accounts)
        └── Proof: Inspections + Reports
```

Module licensing (BILL-001) will gate Facility routes/capabilities after entitlements land — design assumes `facility_operations` (or equivalent) entitlement; do not invent a second billing system.

---

## Entity relationships (logical)

| Entity | Role |
|--------|------|
| WorkOrder | Coordination unit (existing) |
| FacilityRecord | Permanent history row (existing) |
| FacilityAsset | Building equipment registry (existing + V1 fields) |
| FacilityInventoryItem | Parts/tools/supplies (new) |
| PmSchedule | Recurrence definition (new) |
| PmOccurrence | Due instance → optional linked WorkOrder (new) |
| InspectionRun | Checklist execution (new) |
| CalendarItem | Projection — not a second store of truth (view over WO/PM/Inspection) |

---

## SoT rules

| Concern | Source of truth |
|---------|-----------------|
| Work status | WorkOrder |
| What happened historically | FacilityRecord + Timeline |
| What equipment exists | FacilityAsset |
| What parts/tools exist | FacilityInventoryItem |
| What is due preventively | PmSchedule / PmOccurrence |
| What users see on calendar | Projection query |

---

## UI surfaces (proposed routes — post-Approve)

| Surface | Route (proposed) | Notes |
|---------|------------------|-------|
| Technician home | `/facility` or role default → tech dashboard | Prefer `/facility` hub; keep `/maintenance` for WO list |
| Work orders | `/maintenance` (existing) | Extend |
| Assets | `/facility/assets` (list) + existing detail | Add list if missing |
| Inventory | `/facility/inventory` | New |
| PM schedules | `/facility/pm` | New |
| Calendar | `/facility/calendar` | New |
| Inspections | `/facility/inspections` | New |
| Reports | Existing financials/reports + facility report entries | Extend catalog |

Exact path names may be adjusted at Authorize as long as navigation is one system (existing nav config).
