# 14 — Phased Delivery

**Package:** FAC-002  
**Rule:** No implement until `APPROVE FAC-002`. Then authorize **one slice at a time**.

---

## Slice A — Technician home + Inventory MVP

**Authorize phrase:** `AUTHORIZE FAC-002 SLICE A`

- Technician dashboard  
- Inventory: Photo → Name → Save + list/detail/status  
- Nav entry under Facility  
- Permissions for dashboard + inventory  

**DoD subset:** mobile + desktop, RLS, empty states, no placeholder CTAs.

---

## Slice B — Preventive Maintenance + Calendar

**Authorize phrase:** `AUTHORIZE FAC-002 SLICE B`

- PmSchedule / PmOccurrence  
- Job to create draft WOs  
- `/facility/calendar` projection  
- Notifications for PM due / assignment  

---

## Slice C — Assets V1 + Inspections

**Authorize phrase:** `AUTHORIZE FAC-002 SLICE C`

- Asset warranty/manuals/expected life/replacement notes + PM deep links  
- Inspection runs + Facility Record on complete  
- Optional follow-up WO from failed items (confirm)  

---

## Slice D — WO materials/photos polish + Reports

**Authorize phrase:** `AUTHORIZE FAC-002 SLICE D`

- WO materials + photo path consistency  
- Technician / inventory / asset / monthly building reports  
- Vendor Accept/Decline + SMS/email gap close (if not already done)

---

## Dependency order

```
APPROVE FAC-002
    → Slice A
    → Slice B (uses WO + optionally assets)
    → Slice C
    → Slice D
```

Slices may be reordered only with Product Owner note in this file.
