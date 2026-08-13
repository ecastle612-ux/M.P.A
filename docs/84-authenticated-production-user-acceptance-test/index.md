# AUTHENTICATED PRODUCTION USER ACCEPTANCE TEST

**Status:** BLOCKED  
**Date:** 2026-08-13  
**Release SHA:** `dac469a7de5ee245978c47b08b9e7c03d18abdd4` (`dac469a`)  
**Production deployment:** `dpl_5j41NXUG94oQyuNFXdzbMzTpQWFn`  
**UAT organization:** M.P.A. UAT Clinic Demo  
**Provisioning pass:** 2026-08-13 (this update)  

---

## Constraints observed (provisioning)

| Constraint | Observed |
|------------|----------|
| No code changes | **YES** |
| No migrations / DDL | **YES** (explicitly not applied) |
| No Stripe / billing changes | **YES** |
| No real customer org used | **YES** — dedicated internal UAT org only |

---

## UAT organization created

| Field | Value |
|-------|--------|
| Name | **M.P.A. UAT Clinic Demo** |
| Org id | `a11ce001-0001-4000-8000-00000000c11c` |
| Slug | `mpa-uat-clinic-demo` |
| SKU | `mpa_complete_platform` (**active**) |
| Setup state | Product confirmed + checklist completed |
| Type | `internal_uat` |

---

## Users provisioned

| Account | Auth | Membership on UAT org | Roles |
|---------|------|------------------------|-------|
| FO (`MPA_UAT_FO_*`) | **Login OK** (password aligned to secret) | **YES** | `organization_admin`, `property_manager`, `facility_technician` |
| PM (`MPA_UAT_PM_*`) | **Login OK** (password aligned to secret) | **YES** (owner) | `organization_admin`, `property_manager` |

Also seeded (optional vendor contact, not a login user): **UAT Fix-It Vendor** on the UAT org.

Permission catalog data added (not DDL): `pm.maintenance:read|write|assign` capabilities + grants for admin/PM/facility_technician/vendor — required by current FO/PM API gates and previously missing on production.

---

## Test data created

| Entity | Value |
|--------|--------|
| Facility / property | **Demo Clinic Facility** (`property_properties` + mirror row in `properties`) |
| Location | **Room 204** (`property_units` + mirror `units`) |
| Work order | **Chair broken in Room 204** (`UAT-WO-204-001`, status `submitted`) |

---

## Verify access (post-provision)

| Check | Result | Notes |
|-------|--------|-------|
| FO login | **PASS** | Org switcher → M.P.A. UAT Clinic Demo |
| FO Facility Operations page | **PARTIAL** | UI loads; API **400** — schema cache: no relationship `maintenance_work_orders` ↔ `property_properties` |
| FO Mission Control | **FAIL** | Unavailable (same class of schema/API errors) |
| FO create work order via UI | **NOT VERIFIED** | Blocked by FO operations API/schema gap |
| PM login | **PASS** | Lands in UAT Clinic Demo (Organization Admin) |
| PM property dashboard | **PASS** | `/pm/properties` shows **Demo Clinic Facility** (1 unit) |
| PM Mission Control | **PARTIAL** | Loads; warns `assignee_type` column missing |
| Org association / roles | **PASS** | Memberships + Complete SKU confirmed |

Evidence artifacts: `uat_fo_ops_schema_error.webp`, `uat_pm_mission_control.webp`, `uat_pm_demo_clinic_property.webp`

---

## Remaining UAT steps (blocked on schema)

Production app code on `dac469a` expects FO schema that is **not** present on `mpa-prod` (migrations exist in repo but were never applied; this provisioning pass was forbidden from applying DDL):

1. `stab004` / facility surface columns (`work_surface`, `facility_asset_label`, `due_at`, `assignee_type`, …)  
2. `vendor_vendors` table (FO vendor list)  
3. PostgREST relationship between `maintenance_work_orders` and `property_properties`  

**Do not re-run full authenticated FO media/vendor UAT until Product Owner authorizes applying the missing FO schema migrations to production.**

After migrations are applied (separate approved task):

1. FO create work order + photo/video MEDIA-001  
2. Vendor assign / lifecycle  
3. Complete Plan isolation / cross-module checks  
4. Authorized vs unauthorized media URL checks  

---

## Issues found

1. **FO production schema drift** — app expects Launch/STAB FO maintenance model; `mpa-prod` still on older `maintenance_work_orders` shape (FK to `properties`/`units`, no `work_surface` / `assignee_type`; no `vendor_vendors`).  
2. FO Operations / Mission Control APIs fail for the new UAT org despite valid login + Complete entitlement.  
3. Prior blocker (invalid FO password / missing UAT org / PM with no org) is **resolved** by this provisioning pass.

---

## Final verdict

**BLOCKED**

Dedicated UAT org, users, roles, Complete SKU, Demo Clinic Facility, Room 204, and seed work order are provisioned; FO/PM logins succeed. Authenticated FO workflow UAT remains blocked by missing production FO schema (migrations not applied per constraint). Stop after provisioning.
