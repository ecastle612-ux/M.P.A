# 08 — Facility Inventory

**Package:** FAC-002  
**Product rule (mission):** Extremely simple. **No** check-in / check-out process.

---

## Add path (mandatory UX)

```
Take Photo  →  Name Item  →  Save
```

Everything else is optional and editable later.

---

## Entity: FacilityInventoryItem

| Field | Required | Notes |
|-------|----------|-------|
| Photo(s) | Yes on create* | At least one media id; allow “skip photo” only if Product later amends — default **required** for V1 honesty |
| Name | Yes | Free text |
| Category | Optional | Extensible list |
| Status | Yes (default Available) | Available, In Service, Repair, Disposed, Retired, Lost, Stolen |
| Assigned property | Optional | Org property id |
| Assigned technician | Optional | User id |
| Purchase date | Optional | |
| Warranty | Optional | End date + notes |
| Serial number | Optional | |
| Notes | Optional | |

\*If camera unavailable (desktop), allow upload file as the “photo” step — same media pipeline.

---

## Screens

| Screen | Purpose |
|--------|---------|
| Inventory list | Search/filter by status, property, category |
| Add inventory | 3-step flow above |
| Item detail | Edit optional fields; status change; link to WO materials (optional) |

---

## Relationships

- Optional link from WO materials line → inventory item (does not decrement stock unless Product later approves a minimal qty field — **V1 default: no stock quantities / no check-out**).  
- Significant status changes may emit Timeline events (optional, low noise).

---

## Non-goals

- Barcode warehouse WMS  
- Check-in / check-out  
- Purchase orders / vendor catalogs  
- Forced categories  
