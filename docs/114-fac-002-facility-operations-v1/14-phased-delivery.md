# 14 — Phased Delivery

**Package:** FAC-002  
**Rule:** No implement until `APPROVE FAC-002`. Then authorize **one slice at a time**.

---

## Slice A — Technician home + Inventory MVP

**Authorize phrase:** `AUTHORIZE FAC-002 SLICE A`  
**Status:** ✅ Authorized 2026-07-25 · Implemented (awaiting migration apply + smoke)

- Technician dashboard at `/facility`  
- Inventory: Photo → Name → Save + list/detail/status (`/facility/inventory`)  
- Nav: Facility + Inventory (capability-gated)  
- Caps: `facility:dashboard`, `facility:inventory:read|write`  
- Migration: `supabase/migrations/20260726080000_fac002_slice_a_inventory_dashboard.sql`

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
