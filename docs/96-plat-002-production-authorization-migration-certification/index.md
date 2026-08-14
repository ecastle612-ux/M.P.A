# PLAT-002 PRODUCTION AUTHORIZATION MIGRATION CERTIFICATION

**Title:** PLAT-002 PRODUCTION AUTHORIZATION MIGRATION CERTIFICATION  
**Status:** BLOCKED  
**Date:** 2026-08-14  
**Recorded at:** 2026-08-14T14:54:00Z  
**Program:** PLAT-002  
**Authority:** [docs/94](../94-plat-002-authorization-hardening/index.md) Approved · [ADR-026](../18-decision-log/adr-026-authorization-hardening-pipeline.md) Accepted  
**Implementation cert:** [docs/95](../95-plat-002-authorization-hardening-implementation-certification/index.md) READY (no Production deploy)  
**Parent audit:** [PLAT-001](../93-plat-001-platform-mismatch-audit/index.md) C1–C5  
**Production project:** `mpa-prod` / `vahnmcrpnuggxkivynvo`  
**Application SHA (unchanged):** `102b63da`  
**Billing / Stripe / roles / SKUs:** No changes  
**Application deployment:** Not performed (forbidden for this record)

---

## Final verdict

**BLOCKED**

The approved migration `20260814160000_plat_002_authorization_hardening.sql` was reviewed, compatibility-checked, and applied exactly as approved. PostgreSQL rejected the transaction:

```
ERROR:  42P01: relation "public.maintenance_notifications" does not exist
```

`DROP POLICY IF EXISTS … ON public.maintenance_notifications` still requires the relation. The apply ran in one transaction and **rolled back**. Production schema, row counts, and the migration ledger are unchanged.

This record does **not** authorize a substitute SQL file, a new table, or an application deploy. Re-apply only after a Production-compat amendment is designed, documented, and approved.

---

## Constraints honored

| Constraint | Result |
|------------|--------|
| Apply only the approved PLAT-002 migration | Honored — one apply of the approved file; no other DDL |
| No application deployment | Honored — Production remains `102b63da` |
| No feature / role / SKU / billing / Stripe changes | Honored |
| No destructive data operations | Honored — failed apply deleted nothing |

---

## 1. Migration review

**File:** `supabase/migrations/20260814160000_plat_002_authorization_hardening.sql` (PR #203)

| Check | Result |
|-------|--------|
| Additive / policy-focused | **Pass** — `CREATE OR REPLACE FUNCTION`, `DROP POLICY IF EXISTS` + recreate, `REVOKE` / `GRANT EXECUTE` |
| No data deletion | **Pass** — no `DELETE`, `TRUNCATE`, or row rewrite |
| No destructive DDL | **Pass** — no `DROP TABLE`, `DROP COLUMN`, or `work_surface` drop |
| Rollback strategy documented | **Pass** — docs/94 §6: restore prior policy text from `20260806110000` / `20260814010000`; drop unused helpers later; **no row deletes** |

Intended objects:

- Helpers: `org_sku`, `org_allows_work_surface`, `can_select_work_order`, `is_pm_comms_staff`; replace `can_access_tenant_conversation` to call `is_pm_comms_staff` instead of `is_pm_staff`
- Work-order policies: select / insert_resident / manage_manager / update_technician / update_resident; updates SELECT; notifications INSERT
- Comms policies: `comms_conversations_insert_staff`, `comms_thread_messages_select`, `comms_thread_messages_update_staff`

---

## 2. Production apply preparation

Pre-apply inventory on `mpa-prod` (2026-08-14, before the apply attempt):

| Object | Count / state |
|--------|----------------|
| `product_skus` | 3 — `mpa_property_manager`, `mpa_facility_operations`, `mpa_complete_platform` |
| `organization_subscriptions` | 6 — 5 `mpa_property_manager` active, 1 `mpa_complete_platform` active, **0** Facility Operations |
| `organizations` | 21 |
| `organization_memberships` | 31 |
| `role_permission_grants` | 393 |
| `maintenance_work_orders` | 30 (18 residential, 12 facility) |
| `maintenance_work_order_updates` | 37 |
| `comms_conversations` | 2 |
| `comms_conversation_messages` | 8 |

Compatibility (data plane — would be preserved by a successful apply):

| Check | Result |
|-------|--------|
| Existing roles preserved | **Pass** — SQL does not touch role catalog or memberships |
| Existing SKUs preserved | **Pass** — catalog unchanged; helpers only *read* `organization_subscriptions.sku_code` |
| Existing subscriptions unaffected | **Pass** — no writes to `organization_subscriptions` |
| Existing work orders preserved | **Pass** — no row rewrite; `work_surface` kept |
| Existing conversations preserved | **Pass** — policy replace only |

Dependent functions **present:** `is_maintenance_manager`, `is_maintenance_technician`, `is_work_order_resident`, `is_lease_resident`, `is_pm_staff`, `is_org_member`, `can_access_tenant_conversation`.

Dependent columns **present:** `maintenance_work_orders.work_surface`, `pm_residents.portal_status` / `user_id` / `lease_id`, `vendor_vendors.user_id`.

Dependent tables **present:** `maintenance_work_orders`, `maintenance_work_order_updates`, `comms_conversations`, `comms_conversation_messages`.

Dependent table **missing:** `public.maintenance_notifications`. Production notification tables are `comms_notifications`, `in_app_notifications`, `notification_preferences`, `ops_notification_org_policies`. Repo J6 (`20260806110000`) creates `maintenance_notifications`; that migration is **not** on the Production ledger (FO enablement lineage, PLAT-001 H3).

UAT orgs used for planned security checks:

| Org | SKU | Work orders |
|-----|-----|-------------|
| M.P.A. UAT Property Demo `a11ce002-0001-4000-8000-0000000000c2` | `mpa_property_manager` | 1 residential, 0 facility |
| M.P.A. UAT Clinic Demo `a11ce001-0001-4000-8000-00000000c11c` | `mpa_complete_platform` | 0 residential, 12 facility |

No live Facility Operations subscription exists. FO surface isolation can only be proven via helpers, not a live FO customer.

---

## 3. Apply production migration

| Field | Value |
|-------|--------|
| Target | `mpa-prod` / `vahnmcrpnuggxkivynvo` |
| File | `20260814160000_plat_002_authorization_hardening.sql` |
| MCP name | `plat_002_authorization_hardening` |
| Attempted at | 2026-08-14T14:54:00Z (UTC) |
| Result | **FAILED** — `42P01 relation "public.maintenance_notifications" does not exist` |
| Ledger after attempt | Still `20260814030010` / `com_002_uat_remediation` (latest). **No** `plat_002_authorization_hardening` row |
| Helpers after attempt | `org_sku`, `org_allows_work_surface`, `can_select_work_order`, `is_pm_comms_staff` **absent** |
| `can_access_tenant_conversation` | Still calls `is_pm_staff` (pre-PLAT-002) |
| Work-order SELECT | Still includes `is_org_member(organization_id)` |
| Row counts after attempt | Identical to pre-apply (3 / 6 / 31 / 30 / 37 / 2 / 8 / 393) |

The failed statement is the notifications stanza (approved file, after work-order policy replaces):

```sql
drop policy if exists maintenance_notifications_insert on public.maintenance_notifications;
create policy maintenance_notifications_insert on public.maintenance_notifications
for insert with check (
  public.is_maintenance_manager(organization_id)
  or user_id = auth.uid()
);
```

No partial apply was performed. No amended SQL was submitted.

---

## 4. Security validation

**Not executed against live PLAT-002 policies.** Helpers and replacement policies are not on Production.

| Test | Result |
|------|--------|
| Work orders — PM sees residential | **Not run** — `can_select_work_order` / `org_allows_work_surface` do not exist |
| Work orders — FO sees facility | **Not run** — no FO SKU org; helpers not applied |
| Work orders — Complete sees approved union | **Not run** |
| Communications — PM access | **Not run** — `is_pm_comms_staff` not applied |
| Communications — tenant access | **Not run** |
| Communications — FO denied | **Not run** — no FO SKU org; `can_access_tenant_conversation` still uses `is_pm_staff` |
| APIs — unauthorized JSON 401/403 | **Not claimed on Production** — app SHA `102b63da` is pre-PLAT-002; middleware catalog lives in PR #203 and is not deployed |

Current Production C4 hole (unchanged): `maintenance_work_orders_select` still ORs `is_org_member(organization_id)` and does not read `work_surface`.

---

## 5. Residual Production issues (do not apply in this record)

These are **not** the apply blocker. They must be designed before a later successful apply can claim full C4 RLS.

### 5.1 Leftover `*_authorized` work-order policies

Production still has FO-enablement policies the approved file does **not** drop:

| Policy | Command | Surface check |
|--------|---------|---------------|
| `maintenance_work_orders_select_authorized` | SELECT | None — `property_manager` / `property_owner` + `maintenance:read`, or creator / tenant / vendor |
| `maintenance_work_orders_insert_authorized` | INSERT | None |
| `maintenance_work_orders_update_authorized` | UPDATE | None |
| `maintenance_work_orders_delete_authorized` | DELETE | None |

PostgreSQL ORs permissive policies. After a successful apply of the approved file, `can_select_work_order` would be bypassed for those leftover SELECT/UPDATE paths. That is the PLAT-001 H3 name-skew docs/94 already flagged.

### 5.2 No Facility Operations subscription

SKU catalog includes `mpa_facility_operations`. No organization has that subscription. Live “FO sees facility / FO denied on comms” cannot be certified on a real FO tenant until one exists.

---

## Recommended next gate (Design → Document → Approve)

Do **not** implement from this record.

1. **Production-compat amendment** to the approved migration (or a predecessor file): skip the `maintenance_notifications` policy stanza when `to_regclass('public.maintenance_notifications')` is null. Do **not** create that table from this program unless a separate design authorizes it.
2. Decide whether leftover `*_authorized` policies require an approved `DROP POLICY` so C4 cannot be OR-bypassed.
3. Re-run this certification: apply the amended approved SQL only, re-count rows, prove helpers + policies, then re-test the security matrix.
4. Application deploy of PR #203 remains a **later** step. This record does not authorize it.

---

## Explicitly not done

- Successful Production apply of PLAT-002 RLS
- Application / Vercel deploy
- Stripe / billing / price / SKU / role changes
- Creating `maintenance_notifications`
- Dropping leftover `*_authorized` policies
- Live API 401/403 certification on `www`

---

**Next design:** [docs/97](../97-plat-002-production-compatibility-amendment/index.md) (Draft) · [ADR-027](../18-decision-log/adr-027-plat-002-production-compatibility.md) (Proposed). Do not implement until Approved / Accepted.

**STOP.** Certification only. Production is unchanged. Not ready for application deployment.
