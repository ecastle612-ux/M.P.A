# 06 — Asset Foundation

**Package:** FAC-001  
**Status:** Design ✔ · Document ✔ · Approved (Slice C) · **Implemented**  
**Authorization:** EP-005 Slice C — 2026-07-19  
**Delivery:** [13-slice-c-delivery.md](./13-slice-c-delivery.md)

---

## Intent

Track the physical systems and equipment that accumulate repair history so M.P.A. can answer “what is this building made of?” and “what broke before?”

Property managers should think in permanent identities:

> “I managed Asset WH-203.”

not ephemeral anecdotes:

> “I fixed a water heater.”

---

## Asset types (extensible)

HVAC · Water Heater · Roof · Boiler · Appliance · Smoke Detector · Fire Equipment · Lighting · Door · Window · Parking · Pool · Elevator · Custom

`asset_type` is an open taxonomy: known constants ship in Slice C; `custom` + `custom_type_label` (and future string values) allow unlimited growth without schema redesign.

---

## Asset entity

```
FacilityAsset {
  id, organizationId, propertyId,
  buildingId?, unitId?,
  locationScope: property | building | unit | common_area,
  assetCode,           // permanent human identity e.g. WH-203
  name, assetType, customTypeLabel?,
  installDate?, manufacturer?, model?, serialNumber?,
  expectedLifeYears?,
  warrantyPlaceholder?,
  status: active | replaced | retired,
  locationNote?, notes?,
  metadata,
  createdAt, updatedAt, deletedAt?
}
```

Belonging rules:

| Scope | property_id | unit_id | building_id |
| --- | --- | --- | --- |
| property | required | null | null |
| building | required | null | optional reserved |
| unit | required | required | optional |
| common_area | required | null | optional |

---

## Facility linking

- `facility_records.asset_id` optional FK  
- Completing a work order does **not** require an asset  
- When linked, repairs accumulate under the Asset profile (same Facility Records — never duplicated)  
- Timeline may reference `asset_id` / `facility.asset_*` events  

---

## Surfaces (Slice C)

| Surface | Behavior |
| --- | --- |
| Property → Assets | List + minimal create; status, last repair, repair count, install date, quick view |
| Unit → Assets | Unit-scoped assets only |
| `/facility/assets/[assetId]` | Read-only profile |
| Facility Record detail | Optional asset chip + link action |
| Facility Search / Command Center | Assets by name, type, code (HVAC, Water Heater, WH-203, Roof) |
| Document Vault | `entity_type = asset` |

---

## Explicit non-goals (Slice C)

- Preventive Maintenance schedules  
- Warranty engine / expiry automation  
- Replacement planning / depreciation / capital planning  
- Property Health scoring  
- AI recommendations  
- Compliance engines  
- Mandatory asset on every work order  
- Full CMMS barcoding product  

---

## Capabilities

Reuse `maintenance:read` for asset reads; `maintenance:update` for create/link (same as Facility Records Slice A). No new `facility:*` capabilities in Slice C.
