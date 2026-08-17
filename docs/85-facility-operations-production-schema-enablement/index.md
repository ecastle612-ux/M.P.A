# FACILITY OPERATIONS PRODUCTION SCHEMA ENABLEMENT

**Status:** READY FOR AUTHENTICATED FO UAT  
**Date:** 2026-08-13 (UTC)  
**Database:** Supabase `mpa-prod` (`vahnmcrpnuggxkivynvo`)  
**Release baseline:** `main` @ `dac469a` (no application / Stripe / billing changes)  
**UAT organization:** M.P.A. UAT Clinic Demo (`a11ce001-0001-4000-8000-00000000c11c`)

---

## Objective

Apply already-approved Facility Operations database migrations required for authenticated production UAT. App on `dac469a` expects Launch J6 + STAB-004 FO maintenance model; `mpa-prod` still had the older phase6 `maintenance_work_orders` shape (and related gaps), so raw `CREATE TABLE IF NOT EXISTS` repo migrations would no-op.

---

## Constraints observed

| Constraint | Observed |
|------------|----------|
| No application code changes | **YES** |
| No Stripe / billing / subscription changes | **YES** |
| No new product features | **YES** |
| Apply only approved FO-related schema (additive) | **YES** |
| Non-destructive (no DROP TABLE / TRUNCATE / mass DELETE) | **YES** |

---

## 1. Migration review (approved sources)

| Repo source (approved) | Why adaptation was required | Prod enablement action |
|------------------------|-----------------------------|------------------------|
| `20260806050000_fin_ops_001_s2_delinquency_vendor_ap.sql` | `vendor_vendors` never applied | Create `vendor_vendors` + RLS; bridge from legacy `vendors` |
| `20260806110000_launch_001_j6_maintenance.sql` | `CREATE TABLE IF NOT EXISTS` no-op on existing WO table | Additive columns, checks, updates table, helpers/RLS |
| `20260811140000_stab004_facility_work_surface.sql` | Same no-op class | `work_surface` (+ facility columns/indexes) |
| `20260806030000_fin_ops_001_s0_foundation.sql` | Older ADR `event_domain_events` already existed → IF NOT EXISTS no-op; `audit_events` missing | Additive FIN-OPS columns + `audit_events` (required by FO create path) |

### Destructive / unrelated check

- **No** `DROP TABLE`, `TRUNCATE`, or bulk `DELETE` of customer data.
- Existing 18 work orders retained (count rose only from UAT/smoke creates).
- Legacy `properties` / `units` / `vendors` tables untouched except additive bridges.
- Stripe / subscription / billing tables not modified.

---

## 2. Applied to production (`mpa-prod`)

| Migration ID (version) | Name | Result | Timestamp (version encode / apply window) |
|------------------------|------|--------|-------------------------------------------|
| `20260813231223` | `fo_prod_enablement_a_vendor_vendors_property_bridge` | **SUCCESS** | 2026-08-13 ~23:12:23 UTC |
| `20260813231236` | `fo_prod_enablement_b_j6_stab004_columns` | **SUCCESS** | 2026-08-13 ~23:12:36 UTC |
| `20260813231251` | `fo_prod_enablement_c_triggers_rls_updates` | **SUCCESS** | 2026-08-13 ~23:12:51 UTC |
| `20260813232103` | `fo_prod_enablement_d_events_audit_compat` | **SUCCESS** | 2026-08-13 ~23:21:03 UTC |

Part D was required after UI create failed with: `Could not find the 'actor_id' column of 'event_domain_events' in the schema cache` (approved FIN-OPS S0 shape not present on the older ADR events table; `audit_events` absent). PostgREST schema cache reloaded via `NOTIFY pgrst, 'reload schema'`.

---

## 3. Database impact

### Tables created / ensured

| Table | Notes |
|-------|--------|
| `vendor_vendors` | Created; 13 rows bridged from non-deleted `vendors` |
| `maintenance_work_order_updates` | Created + RLS |
| `audit_events` | Created + RLS (FIN-OPS S0) |

### `maintenance_work_orders` columns added

`resident_id`, `requested_by_user_id`, `assignee_type` (NOT NULL, default `unassigned`), `technician_user_id`, `submitted_at` (NOT NULL), `triaged_at`, `assigned_at`, `started_at`, `resident_confirmed_at`, `closed_at`, `work_surface` (NOT NULL, default `residential`), `facility_asset_label`, `due_at`, `cancelled_at`

### Checks expanded (legacy values preserved)

- Priority: adds `normal` (keeps `medium`)
- Status: adds `closed`, `canceled` (keeps existing statuses)
- Category: adds FO categories while keeping residential set

### FKs / indexes / RLS

- `vendor_id` → `vendor_vendors(id)` (legacy composite FK to `vendors` dropped)
- Additive FKs to `property_properties` / `property_units` for PostgREST embeds (legacy `properties`/`units` FKs kept)
- Indexes: org+surface+status; org+status+priority+submitted_at
- Before-insert trigger for `work_order_number` / `created_by` defaults (app create path)
- J6 helper functions + select/manage policies; org-member select retained for FO access
- `event_domain_events`: additive `id`, `actor_id`, `aggregate_type`, `aggregate_id`, `error` + insert bridge trigger (existing ADR rows preserved)

### Data safety

| Check | Result |
|-------|--------|
| Pre-apply WO count | 18 |
| Post-apply + smoke WO count | 22 (additive UAT/smoke creates only) |
| Missing `property_properties` for WO `property_id` | 0 after backfill |
| UAT seed WO `work_surface` | `facility` (`Chair broken in Room 204`) |
| Org isolation | FO JWT only returns WOs for memberships (UAT Clinic Demo + existing FO memberships); not a cross-tenant leak |

---

## 4. Validation

### Schema presence

| Requirement | Result |
|-------------|--------|
| `work_surface` | **PASS** |
| `assignee_type` | **PASS** |
| `vendor_vendors` | **PASS** |
| FO list embed (`property_properties`, `property_units`, `pm_residents`, `vendor_vendors`) | **PASS** (HTTP 200) |
| FO create (DB + app path: WO + updates + events + audit) | **PASS** |
| Vendor directory query | **PASS** |

### Authenticated FO readiness smoke (not full UAT)

| Check | Result |
|-------|--------|
| FO login | **PASS** |
| Access Facility Operations (`/facility/operations`) | **PASS** — work queue loads; no schema errors after Part D |
| Create work order | **PASS** — UI created **UI readiness WO** |
| Access vendor workflow (`/facility/vendors`) | **PASS** — **UAT Fix-It Vendor** listed |

Evidence: `fo_operations_after_schema.webp`, `fo_create_ui_readiness_wo.webp`, `fo_vendors_uat_fixit.webp`, `fo_schema_enablement_readiness_demo.mp4`

---

## 5. UAT readiness

Authenticated FO UAT may proceed against **M.P.A. UAT Clinic Demo** (Complete Platform). Remaining full UAT (media attach, vendor assign/lifecycle, Complete Plan isolation, unauthorized media URL checks) is **out of scope** for this certification and was not executed.

---

## Final verdict

**READY FOR AUTHENTICATED FO UAT**

STOP after migration certification.
