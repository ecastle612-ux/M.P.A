# PLAT-006 FINANCE, REPORT SURFACE & ROUTING IMPLEMENTATION CERTIFICATION

**Title:** PLAT-006 FINANCE, REPORT SURFACE & ROUTING IMPLEMENTATION CERTIFICATION  
**Status:** READY FOR PRODUCTION MIGRATION CERTIFICATION  
**Date:** 2026-08-15  
**Program:** PLAT-006  
**Authority:** [docs/121](../121-plat-006-finance-reports-routing-remediation/index.md) Approved · [ADR-032](../18-decision-log/adr-032-report-shape-and-post-auth-home.md) Accepted  
**Related:** [ADR-026](../18-decision-log/adr-026-authorization-hardening-pipeline.md) remains authoritative for the authorization pipeline · ADR-031 remains authoritative for trusted application mutation architecture (accepted on the PLAT-005 package; not required to land in this branch)  
**Gate:** Design → Document → Approve → **Implement** (ADR-012)  
**Production:** **No Production migration apply. No Production deploy.**  
**Billing / Stripe / SKUs / subscriptions:** No changes  
**Roles / entitlement keys:** No additions  

---

## Verdict

**READY FOR PRODUCTION MIGRATION CERTIFICATION.**

Slices A, B, and C are implemented and certified in this branch. **Do not apply `20260815190000` to Production. Do not deploy. Do not merge without separate authorization.**

---

## Production baseline (unchanged by this package)

| Layer | Value |
|-------|--------|
| App SHA | `e56a330facf21d548815e95ff2e4c82e3c6077bd` |
| Ledger tip | `20260815170604` / `plat_005_privileged_rpc_execute_hardening` |
| This package | Implementation + certification only |

---

## Slice A — finance capability catalog

**Migration:** `supabase/migrations/20260815190000_plat_006_finance_capability_grants.sql`

Additive / idempotent. Successor after Production tip `20260815170604`. Inserts the existing source-defined `FINANCE_CAPABILITIES` keys. No table DDL. No RLS. No subscription/SKU/customer/billing writes.

### Exact capability keys

| Key |
|-----|
| `pm.finance:read` |
| `pm.finance:charge.write` |
| `pm.finance:payment.refund` |
| `pm.finance:late_fee.manage` |
| `pm.finance:vendor_invoice.review` |
| `pm.finance:vendor_payment.release` |
| `pm.finance:reports.read` |
| `pm.finance:settings.manage` |

### Exact grant matrix

| Role | Keys |
|------|------|
| `organization_admin` | all eight |
| `property_manager` | all eight |
| `leasing_agent` | `pm.finance:read` only |
| `property_owner` | `pm.finance:read`, `pm.finance:reports.read` |
| `maintenance_technician` | none |
| `tenant` | none |
| `vendor` | none |

Narrow revoke: `DELETE` tenant/vendor `pm.finance:read` only (S0 hole under ADR-026 org-SKU entitlement). Resident billing and checkout keep their own routes.

### Runtime pipeline (unchanged)

```
Authentication → Organization → Role → SKU entitlement pm.financial_operations → pm.finance:* → action
```

| SKU | Staff with grants |
|-----|-------------------|
| Property Manager | allowed per matrix |
| Complete | allowed per matrix |
| Facility Operations | **denied at SKU entitlement** even if the role holds `pm.finance:*` |

### Legacy `financial:*`

**Unchanged.** July catalog and grant rows are not deleted or rewritten. July RLS on `expenses` / `financial_activity` / peers still uses `has_org_capability(..., 'financial:*')`.

### Rollback

Delete only PLAT-006-created `pm.finance:*` catalog/grant rows using the exact keys and role combinations above. Do not delete `financial:*`.

---

## Slice B — shared report SKU / persona / shape

Allowed report = role/capability ∩ SKU/module. Query-string `persona` / `area` may **narrow** only.

Authorization runs **before** loading source-domain facts. FO snapshots do not fetch PM/finance/resident data and hide it afterward.

### Report SKU / persona matrix

| SKU | Role | Default persona | Allowed personas | Areas | Finance facts |
|-----|------|-----------------|------------------|-------|:---:|
| Property Manager | `organization_admin` | `organization_owner` | `organization_owner`, `property_manager` | PM set | yes |
| Property Manager | `property_manager` | `property_manager` | `property_manager` | PM set | yes |
| Property Manager | `leasing_agent` | `property_manager` | `property_manager` | PM set minus finance reports | no |
| Property Manager | `maintenance_technician` | — | — | **deny** | no |
| Facility Operations | any staff | `facility_manager` | `facility_manager` only | FO set only | **no** |
| Complete | `organization_admin` | `organization_owner` | owner, PM, FO | **PM ∪ FO** | yes |
| Complete | `property_manager` | `property_manager` | PM, FO | PM ∪ FO (narrows with persona) | yes unless FO-narrowed |
| Complete | `leasing_agent` | `property_manager` | `property_manager` | PM set; no finance reports | no |
| Complete | `maintenance_technician` | `facility_manager` | `facility_manager` | FO set | no |
| Any | tenant / vendor / `property_owner` | — | — | **403** staff `/api/shared/reports` | — |
| Unauthenticated | — | — | — | JSON **401** | — |

`organization_admin` on Facility Operations does **not** inherit PM `organization_owner` shapes.

Owner finance remains on `/api/finance/reports/owner`. No separate owner shared-report route is defined in docs/121.

### FAC-002

**Not altered.** `apps/web/src/lib/work-order-reports/service.ts` and FAC-002 `/api/pm|facility/reports/work-orders` still isolate by `work_surface`. Shared-report snapshot filtering is local to `buildOrganizationReportingSnapshot`.

---

## Slice C — canonical post-auth routing

`defaultHomeForRole` remains a role-only utility. Staff entry paths delegate to `resolvePostAuthHome` (and `resolveProductWorkspaceHome` beneath it for Guided Setup / Billing).

### Routing matrix

| Actor | SKU | Home |
|-------|-----|------|
| organization_admin / property_manager | Property Manager | `/pm/mission-control` |
| organization_admin / property_manager | Facility Operations | `/facility/mission-control` |
| organization_admin / property_manager | Complete | `/launcher` |
| leasing_agent | Property Manager or Complete | `/pm/leasing` |
| leasing_agent | Facility Operations | `/facility/mission-control` |
| maintenance_technician | Property Manager | `/pm/maintenance` |
| maintenance_technician | Facility Operations | `/facility/mission-control` |
| maintenance_technician | Complete | `/pm/maintenance` |
| tenant | any | `/portal/tenant` |
| vendor | any | `/portal/vendor` |
| property_owner | any | `/portal/owner` |
| platform operator, no membership | — | `/admin` |
| staff, no SKU / setup incomplete | — | `/setup` |

### Paths updated

| Entry | Resolver |
|-------|----------|
| Login (`next` absent) | `/dashboard` → `resolvePostAuthHome` |
| Login stale staff `?next=/pm/*` `/facility/*` `/launcher` | deferred to `/dashboard` via `resolveLoginNextPath` |
| Login portal / setup / invitation / commerce `next` | kept |
| `/dashboard` | `resolvePostAuthHome` (unchanged) |
| Guided Setup completion | `resolveProductWorkspaceHome` (unchanged) |
| Invitation create / accept `homeHref` | `resolveInvitationHomeHref` → `resolvePostAuthHome` |
| Portal magic-link `redirectTo` / `homeHref` | `resolvePostAuthHome` |
| `/portal` index | `resolvePostAuthHome` |
| Complimentary / Master Admin, no membership | `resolvePostAuthHome` → `/admin` |

A stale role-only `homeHref` can no longer override the product-aware destination after password login.

---

## Automated test evidence

| Suite | Result |
|-------|--------|
| `@mpa/shared` `vitest run` | **50 files / 305 tests passed** |
| `@mpa/web` PLAT-006 + auth/report/routing files | **all passed** |
| `@mpa/web` full `vitest run` | **78 files / 383 tests passed**; 1 unrelated commerce checkout env assertion (see below) |
| `@mpa/shared` lint | passed |
| `@mpa/web` lint | passed |
| `@mpa/shared` typecheck | passed |
| `@mpa/web` typecheck | passed |
| `@mpa/web` `next build` | passed (173 routes) |

### Slice coverage

- **A:** migration contract (keys, matrix, no SKU/billing/RLS/`financial:*` deletes); pipeline tests for PM/Complete allow, FO SKU deny, leasing read/write, tenant/vendor/technician deny
- **B:** SKU × persona matrix; malicious/invalid `?persona=`; FO no finance/residents/PM-only areas; Complete union + narrowing; portal 403; unauthenticated 401; selected-area cannot expand
- **C:** invitation/magic-link source contract (no `defaultHomeForRole` `homeHref`); login next deferral; FO technician / Complete technician / tenant homes

### Unrelated full-suite note

`src/app/api/commerce/checkout/checkout.route.test.ts` expected 503/502/400 when unit-volume Stripe Prices are absent and received **200** in this environment (Prices/keys present). PLAT-006 did not modify checkout, Stripe, SKUs, or subscriptions. Not a PLAT-006 regression.

---

## Confirmations

| Check | Result |
|-------|--------|
| Legacy `financial:*` catalog/grants | **unchanged** — no deletes, no RLS rewrite |
| FAC-002 `work_surface` isolation | **not altered** |
| New roles or entitlement keys | **none** |
| Subscription / SKU / Stripe / billing writes | **none** |
| Production migration apply | **not performed** |
| Production deploy | **not performed** |

---

## Production status

| Item | Status |
|------|--------|
| App | still `e56a330f` — this branch is not deployed |
| Ledger | still `20260815170604` — `20260815190000` is **not applied** |
| Next Owner step | Production migration certification, then separate apply authorization |

**STOP. No Production migration. No Production deployment.**
