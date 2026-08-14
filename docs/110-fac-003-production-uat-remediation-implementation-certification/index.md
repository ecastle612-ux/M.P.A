# FAC-003 PRODUCTION UAT REMEDIATION IMPLEMENTATION CERTIFICATION

**Title:** FAC-003 PRODUCTION UAT REMEDIATION IMPLEMENTATION CERTIFICATION  
**Status:** READY FOR PRODUCTION REMEDIATION RELEASE  
**Date:** 2026-08-14  
**Program:** FAC-003  
**Authority:** [docs/109](../109-fac-003-production-uat-remediation/index.md) Approved · [ADR-029](../18-decision-log/adr-029-fac-003-production-uat-remediation.md) Accepted  
**Amends:** [ADR-028](../18-decision-log/adr-028-fac-003-asset-inventory-management.md) remains authoritative for privileges, ledger, MEDIA-001, and FAC-002  
**Parent UAT:** [docs/108](../108-fac-003-production-release-certification/index.md) (Production UAT **BLOCKED**)  
**Gate:** Design → Document → Approve → **Implement** (ADR-012)  
**Production:** **No production deployment** from this package  
**Billing / Stripe:** No changes  
**Roles / SKUs / entitlement keys:** No additions  

---

## Verdict

**READY FOR PRODUCTION REMEDIATION RELEASE.**

The two docs/108 blockers are remediated in this branch:

1. Parent SELECT policies are RETURNING-safe and privilege-equivalent.
2. Work-order lifecycle no longer throws when `maintenance_notifications` is absent.

**Do not apply the migration to Production from this record. Do not deploy.**

---

## Scope delivered

| Item | Delivery |
|------|----------|
| Asset SELECT RLS | `facility_assets_select` uses current-row `deleted_at` / `organization_id` plus assigned facility work-order subquery. Does not re-select `facility_assets` by id. |
| Stock SELECT RLS | `facility_stock_items_select` uses current-row `deleted_at` and `can_manage_facility_ops(organization_id)`. Manager-only. |
| Official create API | `POST /api/facility/assets` and `POST /api/facility/inventory` still use `insert().select()`. Success remains HTTP `201` `{ asset }` / `{ item }`. |
| Asset code conflict | Unique violation → `FacilityConflictError` → HTTP `409`. Uniqueness unchanged. |
| Notify compatibility | `notifyLifecycle` soft-fails missing-table / schema-cache errors (`inApp: false`). Other insert errors still throw. |
| Migration | Additive successor only. No historical edit. No row rewrite. No new table. |

---

## Constraints honored

- No new FAC-003 features
- No new roles or entitlement keys
- No billing / Stripe changes
- No service-role create path
- No `USING (true)` or org-member SELECT
- No J6 replay / no `maintenance_notifications` create
- No COM-002 `comms_notifications` reuse
- No Production apply or deploy

---

## RLS policy changes

Migration: `supabase/migrations/20260814210000_fac_003_production_uat_remediation.sql`

Replaces only:

- `facility_assets_select`
- `facility_stock_items_select`

Equivalent fail-closed predicates (ADR-028 / ADR-029):

| Table | `USING` |
|-------|---------|
| `facility_assets` | `deleted_at IS NULL` AND (`can_manage_facility_ops(organization_id)` OR assigned facility WO + `can_select_work_order`) |
| `facility_stock_items` | `deleted_at IS NULL` AND `can_manage_facility_ops(organization_id)` |

Unchanged:

- INSERT `WITH CHECK` (`created_by = auth.uid()` AND `can_manage_facility_ops`)
- UPDATE policies
- `apply_facility_stock_movement`
- Movement insert `WITH CHECK (false)`
- Child-table helper `can_select_facility_stock_item(stock_item_id)` on movements

Helpers that re-select the parent by id remain for **other** tables. They are no longer the parent SELECT `USING` body.

---

## API behavior

| Path | Success | Conflict | Authz |
|------|---------|----------|-------|
| `POST /api/facility/assets` | `201 { asset }` from `insert().select()` | `409` duplicate live `asset_code` | Existing `requireFacilityAssetPermission` (`managerOnly` write) |
| `POST /api/facility/inventory` | `201 { item }` from `insert().select()` | n/a (no unique name/SKU) | Existing `requireFacilityInventoryPermission` (`managerOnly` write) |
| `POST /api/facility/operations/progress` | `200 { workOrder }` after committed lifecycle | — | Existing `requireFacilityOperation` |

Two-step insert (Option A) and create RPCs (Option B) were not implemented.

---

## Notification compatibility

`notifyLifecycle` (`apps/web/src/lib/maintenance/lifecycle-notify.ts`):

| Condition | Behavior |
|-----------|----------|
| Table absent (`42P01`, `PGRST205`, schema-cache / does-not-exist message) | Do not throw. `inApp: false`, `notificationId: null`. Email still follows existing preference / Vitest / provider gates. |
| Table present, insert succeeds | Unchanged (`inApp: true` when a row id is returned). |
| Table present, unexpected insert error (RLS, check, etc.) | Still throws. |

Callers (`progressWorkOrder` start/complete, assign, cancel, residential progress) share this helper. Facility complete still closes the work order.

No `maintenance_notifications` object is created. No write to `comms_notifications`.

---

## Tests

Targeted remediation + regression (this certification):

| Suite | Result |
|-------|--------|
| FAC-003 RLS (original + successor) | Pass |
| Asset service (create `insert().select()`, 409 unique, soft-delete hide, history) | Pass |
| Inventory service (create `insert().select()`, receive/usage, negative stock) | Pass |
| FAC-003 PLAT-002 authz (FO/Complete allow; PM/tenant/owner/vendor deny; technician create deny) | Pass |
| Asset / inventory official POST routes (`201`, `409`, `403`) | Pass |
| `notifyLifecycle` missing-table soft-fail + present-table hard fail | Pass |
| Facility progress start/complete with table absent and present | Pass |
| FAC-002 FAC-003 report types | Pass |
| MEDIA-001 `facility_asset` parent | Pass |
| Work-order asset relationship | Pass |
| Vendor portal isolation | Pass |
| Facility / PLAT-002 `requireFacilityOperation` | Pass |
| `@mpa/shared` facility schemas | Pass |
| Combined facility + media + notify + facility API | **22 files / 92 passed** |
| Additional authz + FO vendor + shared schemas | **4 files / 35 passed** |
| `@mpa/web` `tsc --noEmit` | **Pass** |

---

## Security validation

| Control | Result |
|---------|--------|
| Privilege expansion | None. Manager / technician / stock predicates match ADR-028. |
| Soft-deleted rows | Hidden (`deleted_at IS NULL`). |
| PM SKU / tenant / owner / vendor | Still denied by PLAT-002 wrappers + `can_manage_facility_ops`. |
| Technician create | Still `managerOnly` on official POST. |
| Service role create | Not used. |
| `USING (true)` / org-member SELECT | Absent from successor migration. |
| Movement integrity | RPC unchanged; negative stock still fail-closed. |
| Notify fail-closed when table exists | Unexpected insert errors still throw. |

---

## Production status

| Item | Status |
|------|--------|
| Application + migration on this branch | Ready for review / merge |
| Production schema apply | **Not done** |
| Production Vercel deploy | **Not done** |
| Docs/108 UAT re-run (§9 of docs/109) | **Not done** — requires Owner-authorized apply + deploy after merge |

After a later Owner-authorized Production apply and deploy, re-run only:

1. Official UI/API asset create  
2. Official UI/API stock item create  
3. Work-order start  
4. Work-order complete  
5. Asset history after completion  
6. Inventory and report regression  
7. Authorization regression  

---

## Rollback

- App: revert this branch / SHA.
- Schema (only after a later Owner-authorized apply): restore the two SELECT policies to `USING (can_select_facility_*(id))`. Data unchanged.
- Notify: revert `notifyLifecycle` soft-fail. No schema rollback (table was not created).

---

## Explicitly not done

- Production migration apply
- Production Vercel deploy
- Browser / Production UAT re-run
- J6 / `maintenance_notifications` create
- COM-002 notification routing
- Option A two-step create
- Option B create RPCs
- New roles, SKUs, entitlement keys, Stripe changes

---

**STOP.** Certification only. No production deployment.
