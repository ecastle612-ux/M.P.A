# PLAT-002 PRODUCTION AUTHORIZATION MIGRATION CERTIFICATION

**Title:** PLAT-002 PRODUCTION AUTHORIZATION MIGRATION CERTIFICATION  
**Status:** READY FOR APPLICATION DEPLOYMENT  
**Date:** 2026-08-14  
**Recorded at:** 2026-08-14T15:18:36Z  
**Program:** PLAT-002  
**Authority:** [docs/94](../94-plat-002-authorization-hardening/index.md) Approved · [docs/97](../97-plat-002-production-compatibility-amendment/index.md) Approved · [ADR-026](../18-decision-log/adr-026-authorization-hardening-pipeline.md) Accepted · [ADR-027](../18-decision-log/adr-027-plat-002-production-compatibility.md) Accepted  
**Successor impl cert:** [docs/98](../98-plat-002-production-compatibility-implementation-certification/index.md) READY  
**Prior blocked apply:** [docs/96](../96-plat-002-production-authorization-migration-certification/index.md)  
**Production project:** `mpa-prod` / `vahnmcrpnuggxkivynvo`  
**Application SHA (unchanged):** `102b63da`  
**Billing / Stripe / roles / SKUs:** No changes  
**Application deployment:** Not performed

---

## Final verdict

**READY FOR APPLICATION DEPLOYMENT**

The approved successor `20260814180000_plat_002_production_compat.sql` applied cleanly to Production. Helpers and policies are live. Leftover `*_authorized` work-order policies are gone. `maintenance_notifications` was not created. Row counts are unchanged. `20260814160000` was **not** replayed.

This record does **not** deploy the application. C1–C3 API JSON 401/403 remain on the unimplemented Production SHA until a later Owner-authorized Vercel deploy.

---

## 1. Pre-apply check

| Field | Value |
|-------|--------|
| Latest ledger | `20260814030010` / `com_002_uat_remediation` |
| PLAT-002 helpers | Absent |
| `maintenance_notifications` | Absent |
| Leftover `*_authorized` policies | 4 |

| Object | Count |
|--------|------:|
| `organization_memberships` | 31 |
| `organization_subscriptions` | 6 (5 Property Manager active, 1 Complete active, 0 Facility Operations) |
| `maintenance_work_orders` | 30 (18 residential / 12 facility) |
| `comms_conversations` | 2 |
| `comms_conversation_messages` | 8 |
| `product_skus` | 3 |
| `role_permission_grants` | 393 |

---

## 2. Apply

| Field | Value |
|-------|--------|
| File | `supabase/migrations/20260814180000_plat_002_production_compat.sql` |
| MCP name | `plat_002_production_compat` |
| Result | **SUCCESS** |
| Ledger | `20260814151825` / `plat_002_production_compat` |
| Timestamp | 2026-08-14T15:18:25Z (ledger version) · recorded 2026-08-14T15:18:36Z |
| `20260814160000` | **Not applied** — no `plat_002_authorization_hardening` ledger row |
| Notifications table | Still absent (conditional skip) |

---

## 3. Post-apply validation

### Helpers present

`org_sku`, `org_allows_work_surface`, `can_select_work_order`, `is_pm_comms_staff`

`can_access_tenant_conversation` calls `is_pm_comms_staff`, not `is_pm_staff`.

`anon` EXECUTE: revoked. `authenticated` EXECUTE: granted.

### Work-order policies

| Policy | State |
|--------|--------|
| `maintenance_work_orders_select` | `can_select_work_order(id)` |
| `maintenance_work_orders_manage_manager` | manager **and** `org_allows_work_surface` |
| `maintenance_work_orders_insert_resident` | Present |
| `maintenance_work_orders_update_technician` | Present |
| `maintenance_work_orders_update_resident` | Present |
| `maintenance_updates_select` | `can_select_work_order(work_order_id)` |
| `*_authorized` (select/insert/update/delete) | **Removed** |

### Comms policies

| Policy | State |
|--------|--------|
| `comms_conversations_insert_staff` | `is_pm_comms_staff` |
| `comms_thread_messages_select` | `can_access_tenant_conversation` + `is_pm_comms_staff` for hidden |
| `comms_thread_messages_update_staff` | `is_pm_comms_staff` |

---

## 4. Security matrix

### Work orders (`org_allows_work_surface` on live orgs)

| Org | SKU | residential | facility |
|-----|-----|:-----------:|:--------:|
| M.P.A. UAT Property Demo | `mpa_property_manager` | ● | — |
| M.P.A. UAT Clinic Demo | `mpa_complete_platform` | ● | ● |

Live helper text: facility is allowed only for `mpa_facility_operations` or `mpa_complete_platform`. No organization has a Facility Operations subscription, so FO-only allow was not exercised on a live FO tenant. PM facility deny and Complete facility allow are live.

### Communications (JWT `request.jwt.claim.sub` + helpers)

| Actor | Staff inbox | Own thread |
|-------|:-----------:|:----------:|
| PM `property_manager` on Property Demo | ● | ● |
| Tenant on Property Demo | — | ● |
| `facility_technician` on Property Demo (FO-like) | — | — |
| Complete org admin / PM on Clinic Demo | ● | n/a (no clinic thread) |

`is_pm_comms_staff` requires SKU in Property Manager or Complete, so a future FO-only org is denied by helper even without a live FO tenant.

---

## 5. Data safety

| Object | Before | After |
|--------|-------:|------:|
| Memberships | 31 | 31 |
| Subscriptions | 6 | 6 |
| Work orders | 30 (18 / 12) | 30 (18 / 12) |
| Conversations | 2 | 2 |
| Messages | 8 | 8 |
| SKUs | 3 | 3 |
| Role grants | 393 | 393 |

No row deletes. No SKU / role / Stripe writes.

---

## Explicitly not done

- Application / Vercel deploy (Production remains `102b63da`)
- Replay of `20260814160000`
- Creating `maintenance_notifications`
- Live FO-only customer org
- Live www API 401/403 claim (app gates are not on this SHA)

---

**STOP.** Database is ready for application deployment. This record does not deploy the application.
