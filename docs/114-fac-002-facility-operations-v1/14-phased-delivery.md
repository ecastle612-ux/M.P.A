# 14 — Phased Delivery

**Package:** FAC-002  
**Rule:** No implement until `APPROVE FAC-002`. Then authorize **one slice at a time**.

---

## Slice A — Technician home + Inventory MVP

**Authorize phrase:** `AUTHORIZE FAC-002 SLICE A`  
**Status:** ✅ Authorized 2026-07-25 · Shipped to Production (`d1f4dfe`, 2026-07-25)

- Technician dashboard at `/facility`  
- Inventory: Photo → Name → Save + list/detail/status (`/facility/inventory`)  
- Nav: Facility + Inventory (capability-gated)  
- Caps: `facility:dashboard`, `facility:inventory:read|write`  
- Migration: `supabase/migrations/20260726080000_fac002_slice_a_inventory_dashboard.sql`

**DoD subset:** mobile + desktop, RLS, empty states, no placeholder CTAs.

---

## Slice B — Preventive Maintenance + Calendar

**Authorize phrase:** `AUTHORIZE FAC-002 SLICE B`  
**Status:** ✅ Authorized 2026-07-25 · Shipped to Production (`290fdab`, 2026-07-25)

- PmSchedule / PmOccurrence  
- Job to create draft WOs (`submitted` / `assigned` — no separate WO draft status)  
- `/facility/calendar` projection  
- Notifications for PM due / assignment  
- Migration: `supabase/migrations/20260726090000_fac002_slice_b_pm_calendar.sql`  


---

## Slice C — Assets V1 + Inspections

**Authorize phrase:** `AUTHORIZE FAC-002 SLICE C`  
**Status:** ✅ Authorized 2026-07-25 · Shipped to Production (`e5f26d6`, 2026-07-25)

- Asset warranty/manuals/expected life/replacement notes + PM deep links  
- Inspection runs + Facility Record on complete  
- Optional follow-up WO from failed items (confirm)  
- Migration: `supabase/migrations/20260726100000_fac002_slice_c_assets_inspections.sql` (applied)  


---

## Slice D — WO materials/photos polish + Reports

**Authorize phrase:** `AUTHORIZE FAC-002 SLICE D`  
**Status:** ✅ Authorized 2026-07-26 · Shipped to Production (`83449be` + build fix `2e25470`, deploy `dpl_EPYuTPiVFcpWQyftFdGje4pan152`, 2026-07-26) · Package ✅ **COMPLETE** ([19](./19-fac-002-package-certification.md))

- WO materials + photo path consistency (`MediaImage` on detail)  
- Technician / inventory / asset / monthly building reports (`/facility/reports`)  
- Vendor Accept/Decline on token job + SMS/email share copy  
- Caps: `facility:report:read`  
- Migration: `supabase/migrations/20260726110000_fac002_slice_d_materials_reports.sql` (applied)

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
