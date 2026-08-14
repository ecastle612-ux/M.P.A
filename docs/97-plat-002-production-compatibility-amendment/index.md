# PLAT-002 PRODUCTION COMPATIBILITY AMENDMENT

**Title:** PLAT-002 PRODUCTION COMPATIBILITY AMENDMENT  
**Status:** Approved  
**Date:** 2026-08-14  
**Approved:** 2026-08-14 — Product Owner authorization to implement ADR-027  
**Program:** PLAT-002  
**Gate:** Design → Document → Approve → **Implement**  
**Parent cert:** [docs/96](../96-plat-002-production-authorization-migration-certification/index.md) BLOCKED  
**Approved design:** [docs/94](../94-plat-002-authorization-hardening/index.md)  
**PLAT-002 impl cert:** [docs/95](../95-plat-002-authorization-hardening-implementation-certification/index.md)  
**Parent ADR:** [ADR-026](../18-decision-log/adr-026-authorization-hardening-pipeline.md) Accepted  
**This amendment ADR:** [ADR-027](../18-decision-log/adr-027-plat-002-production-compatibility.md) Accepted  
**Successor impl cert:** [docs/98](../98-plat-002-production-compatibility-implementation-certification/index.md)  
**Production:** No writes from this record  
**Billing / Stripe / roles / SKUs:** Unchanged

---

## Purpose

Production rejected the approved PLAT-002 migration and rolled back. This record designs the **minimum compatibility amendment** so a later authorized retry can apply C4/C5 RLS without creating tables, replaying FO/J6 lineage, or leaving permissive leftovers that bypass `can_select_work_order`.

This package does **not**:

- Write or apply SQL
- Change Production, Auth, Storage, or Edge Functions
- Deploy the application
- Change billing, Stripe, roles, SKUs, or entitlement keys
- Create `maintenance_notifications`
- Replay `20260806110000` or FO enablement migrations
- Change ADR-026’s pipeline, Complete union, or comms staff rule

This record is **Approved** and ADR-027 is **Accepted**. Implement only the successor migration and tests. Do not apply to Production from the implementation package.

---

## Failure recap (docs/96)

| Item | Fact |
|------|------|
| File attempted | `20260814160000_plat_002_authorization_hardening.sql` |
| Error | `42P01 relation "public.maintenance_notifications" does not exist` |
| Why | `DROP POLICY IF EXISTS … ON table` still requires the relation |
| Ledger | Unchanged — `20260814030010` / `com_002_uat_remediation` |
| Data | Unchanged — transaction rolled back |
| Residual | Production `*_authorized` work-order policies have no `work_surface` check |

Inventory (read-only, 2026-08-14) still holds: 3 SKUs, 6 subscriptions (no Facility Operations), 30 work orders (18 residential / 12 facility), 2 conversations. Notification tables present: `comms_notifications`, `in_app_notifications`, `notification_preferences`, `ops_notification_org_policies`. `maintenance_notifications` is absent.

---

## 1. Missing `maintenance_notifications` compatibility

### Decision

**Skip policy DDL when the relation is absent. Do not create the table.**

| Option | Verdict |
|--------|---------|
| Create `maintenance_notifications` (replay J6) | **Rejected** — unnecessary table; unrelated lineage; new schema object not in docs/94 |
| Replay FO enablement / J6 / STAB notification migrations | **Rejected** — Production already has a different notification architecture |
| Delete the notifications stanza forever | **Rejected** — local/preview DBs that applied J6 still need the approved insert tighten |
| Conditional policy operations | **Accepted** |

### How the amended migration must behave

1. Before any `DROP POLICY` / `CREATE POLICY` on `maintenance_notifications`, test `to_regclass('public.maintenance_notifications')`.
2. **If null (Production today):** skip the entire notifications stanza. Do not create the table, indexes, or grants. Leave `comms_notifications` / `in_app_notifications` / `ops_notification_org_policies` untouched.
3. **If present (local / preview that ran J6):** apply the **same** approved insert policy as `20260814160000` (manager or self; no `is_org_member` OR).
4. Use a single transaction. A missing table must not abort helpers, work-order policies, or comms policies.
5. Do not `ALTER` or `DROP` any notification table that does exist.

### Preserve existing notification architecture

Production in-app / ops / tenant notification paths do **not** use `maintenance_notifications`. App references to that name are a pre-existing lineage gap (PLAT-001 H3). This amendment does **not** repair those writes by creating a table. A later program may design notification-table alignment; it is out of scope here.

---

## 2. Work-order policy compatibility

PostgreSQL ORs permissive policies. Replacing `maintenance_work_orders_select` with `can_select_work_order` does **not** close C4 while leftover `*_authorized` policies remain.

### 2.1 Production policy set (current)

**`maintenance_work_orders`**

| Policy | Cmd | Surface? | Amendment |
|--------|-----|:--------:|-----------|
| `maintenance_work_orders_select` | SELECT | No — includes `is_org_member` | **Replace** with `can_select_work_order(id)` (docs/94) |
| `maintenance_work_orders_select_authorized` | SELECT | No — PM/owner + `maintenance:read`, or `created_by`, or legacy `tenants` / `vendors` | **Drop** |
| `maintenance_work_orders_insert_authorized` | INSERT | No — `maintenance:create` + `created_by` | **Drop** |
| `maintenance_work_orders_update_authorized` | UPDATE | No — update/assign/archive/delete capabilities | **Drop** |
| `maintenance_work_orders_delete_authorized` | DELETE | No — `maintenance:delete` | **Drop** |
| `maintenance_work_orders_manage_manager` | ALL | No — `is_maintenance_manager` only | **Replace** with manager **and** `org_allows_work_surface` (docs/94) |
| `maintenance_work_orders_insert_resident` | INSERT | n/a (absent) | **Create** as approved (residential + active portal) |
| `maintenance_work_orders_update_technician` | UPDATE | n/a (absent) | **Create** as approved (assigned tech + surface) |
| `maintenance_work_orders_update_resident` | UPDATE | n/a (absent) | **Create** as approved (resident + residential) |

**`maintenance_work_order_updates` (child)**

| Policy | Cmd | Surface? | Amendment |
|--------|-----|:--------:|-----------|
| `maintenance_updates_select` | SELECT | No — `is_org_member` OR resident OR linked vendor | **Replace** with `can_select_work_order(work_order_id)` (docs/94) |
| `maintenance_updates_insert` | INSERT | No — manager / tech / resident / linked vendor | **Keep** — actor-scoped; not a SELECT dump. Surface tightening is not in this amendment |

No `*_authorized` policies exist on the child table. Do not invent drops there.

**Comms (unchanged from docs/94 Slice D)**

Replace staff policies that call `is_pm_staff` with `is_pm_comms_staff`. `comms_conversations_select` / `update_staff` already call `can_access_tenant_conversation`; replacing that function is sufficient. No leftover `*_authorized` comms policies.

### 2.2 Why leftover `*_authorized` must be dropped

ADR-026 Decision 4: org membership is not a sufficient SELECT grant; staff visibility is SKU ↔ `work_surface`. The leftover policies grant by **capability + shared role names**. Facility Operations and Property Manager share `property_manager` / `organization_admin` (docs/94). Without a drop:

- A future FO org’s `property_manager` would SELECT every surface in that org.
- A PM org could INSERT/UPDATE/DELETE facility rows if any existed.
- Complete union would be “PM role sees everything” instead of “both surfaces via the helper.”

Drop is `DROP POLICY IF EXISTS` only. No table drop. No row delete.

### 2.3 Paths removed with `select_authorized`

These legacy grants go away. That is intended.

| Path | After amendment |
|------|-----------------|
| `created_by = auth.uid()` | Not a staff grant. Creator who is manager/tech/resident/vendor still matches `can_select_work_order` |
| Legacy `tenants` | Residents use `pm_residents` (already in the approved helper) |
| Legacy `vendors` email match | Linked vendors use `vendor_vendors.user_id` (already in the approved helper) |
| `property_owner` + `maintenance:read` | Owner portal keeps its own APIs (docs/94 residual). Not a work-order SELECT grant |

### 2.4 `work_surface` enforcement

Helpers (already approved; amendment does not change semantics):

| SKU | residential | facility |
|-----|:-----------:|:--------:|
| `mpa_property_manager` | ● | — |
| `mpa_facility_operations` | — | ● |
| `mpa_complete_platform` | ● | ● |
| canceled / missing | — | — |
| unknown surface | — | — |

Applies to: `can_select_work_order` (manager/tech branches), `manage_manager`, technician update. Resident insert/update stay `work_surface = 'residential'`. Vendors stay assignment-scoped (no SKU union).

### 2.5 Complete union

Complete is the **union of both surfaces through the helpers**, not a leftover-policy bypass.

| Actor on Complete | Residential WO | Facility WO |
|-------------------|----------------|-------------|
| Org admin / PM (manager helper) | ● | ● |
| Technician (assignment rule + surface) | ● | ● |
| Tenant / requester | own residential | — |
| Vendor | linked only | linked only |
| Technician as comms staff | — (C5 unchanged) | — |

No live Facility Operations subscription exists. FO isolation is proven with `org_allows_work_surface` / `org_sku` on real org ids, plus policy-text assertions. Do not create an FO SKU or subscription from this program.

---

## 3. Migration safety

### 3.1 What to apply

Do **not** re-submit `20260814160000_plat_002_authorization_hardening.sql` to Production. It will fail the same way.

| Environment | Action after this design is Approved |
|-------------|--------------------------------------|
| Production (`mpa-prod`) | Apply **one new timestamped** successor only (name at implement, e.g. `plat_002_production_compat`). It contains the approved helper/policy body **plus** this amendment. |
| DBs that already applied `20260814160000` | Successor must be idempotent: `CREATE OR REPLACE` helpers; `DROP POLICY IF EXISTS` / recreate named policies; conditional notifications; drop leftovers. |
| Repo | Keep `20260814160000` as the historical approved file. Do not silently rewrite it into a different contract. The successor is the Production retry artifact. |

Successor contents (design only — no SQL in this package):

1. Approved helpers and `REVOKE` / `GRANT` (docs/94 / `20260814160000`)
2. Approved work-order and comms policy replaces
3. Conditional `maintenance_notifications` stanza (§1)
4. `DROP POLICY IF EXISTS` for the four `*_authorized` work-order policies (§2)

No other migrations. No Stripe. No role catalog. No SKU writes.

### 3.2 Apply order

```
Pre-flight inventory
  → apply successor only (one transaction)
  → post-apply validation (§3.4)
  → STOP (no application deploy from this amendment)
```

1. Confirm ledger latest is still `20260814030010` (or later only if an unrelated approved migration landed — do not apply those from this program).
2. Re-count SKUs, subscriptions, memberships, work orders, conversations.
3. Confirm `maintenance_notifications` absence and leftover policy names still match §2.1.
4. Apply the successor. If it fails, the transaction must roll back (same as docs/96).
5. Do not deploy Vercel / application SHA. C1–C3 stay on PR #203 until a later Owner authorization.

docs/94 preferred app slices A+B before RLS. Product Owner already authorized a DB-first retry. This amendment does not reverse that; it also does not authorize the app deploy.

### 3.3 Rollback

| Step | Action | Data risk |
|------|--------|-----------|
| Helpers | Follow-up migration may `CREATE OR REPLACE` `can_access_tenant_conversation` back to `is_pm_staff` and drop unused new helpers | None |
| Named J6 / COM-002 policies | Restore Production text captured in docs/96 and §2.1 | Re-opens C4/C5 holes; no row loss |
| `*_authorized` | Recreate the four dropped policies from the docs/96 `pg_get_expr` snapshot | Re-opens surface bypass |
| Notifications | If skipped, nothing to restore. If applied on a DB that has the table, restore prior insert policy | None |
| Rows | **No DELETE / TRUNCATE / column drop** | None |

Paste exact Production `pg_policies` expressions into the implement PR description before apply (docs/94 appendix rule).

### 3.4 Production validation (after a later authorized apply)

Must all pass before a READY FOR APPLICATION DEPLOYMENT cert:

1. Ledger contains the successor version/name; **not** a failed `20260814160000` replay.
2. Helpers exist: `org_sku`, `org_allows_work_surface`, `can_select_work_order`, `is_pm_comms_staff`.
3. `can_access_tenant_conversation` calls `is_pm_comms_staff`, not `is_pm_staff`.
4. `anon` / `public` EXECUTE revoked on the new helpers; `authenticated` granted.
5. `maintenance_notifications` still absent on Production; no new notification table.
6. Four `*_authorized` policies gone.
7. `maintenance_work_orders_select` uses `can_select_work_order`; `manage_manager` includes `org_allows_work_surface`.
8. Child `maintenance_updates_select` uses `can_select_work_order(work_order_id)`.
9. Comms insert/select/update_staff use `is_pm_comms_staff` / updated `can_access_tenant_conversation`.
10. Row counts match pre-apply (SKUs, subscriptions, memberships, work orders by surface, conversations, messages, role grants).
11. Helper matrix on real orgs: UAT Property Demo residential ● / facility —; UAT Clinic Demo both ●; unknown surface false.
12. Authenticated RLS (JWT `sub` + `authenticated` role), not service role: PM sees residential; Complete sees union; technician is not comms staff; tenant own-thread still works.
13. FO surface deny via helpers (no FO subscription to use as a live tenant).
14. APIs: do **not** claim live www JSON 401/403 until the application is deployed. Unit tests on PR #203 remain the C3 evidence.

---

## 4. Governance

| Artifact | Role |
|----------|------|
| docs/94 + ADR-026 | Unchanged product rules (pipeline, SKU ↔ surface, comms desk) |
| docs/96 | BLOCKED apply evidence |
| **This record (docs/97)** | Production-compat design |
| **ADR-027** | Binding amendment: conditional relation DDL; drop leftover `*_authorized` |

ADR-027 is required: dropping Production policies and introducing conditional DDL change the authorization apply contract. They would surprise a new senior engineer if left only in chat.

### Approval checklist

Product Owner + Architect sign-off required on:

1. Do not create `maintenance_notifications`; skip that stanza when the relation is absent
2. Do not replay J6 / FO notification lineage
3. Drop the four leftover `*_authorized` work-order policies
4. Keep approved helper semantics and Complete union
5. Successor file is the only Production retry; do not re-apply `20260814160000` as-is
6. No application deploy, Stripe, billing, role, or SKU changes from the implement of this amendment

### After approval

Implement **only** the successor migration + tests that lock the conditional skip and the leftover drops. Then re-run a production migration certification (next record after implement). Material changes restart this gate.

---

## Explicitly not in this design

- SQL files or Production apply
- Application / Vercel deploy
- Creating or backfilling notification rows
- New roles, SKUs, Stripe products, entitlement keys
- Splitting `maintenance_work_orders` (ADR-020)
- Child `maintenance_updates_insert` surface tighten
- Live FO customer provisioning
- Revoking global `role_permission_grants` (docs/94 residual)

---

**STOP.** Design approved. Implementation is a separate package (docs/98). No Production apply from this record.
