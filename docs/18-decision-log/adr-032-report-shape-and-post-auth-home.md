# ADR-032: Shared Report Shape Isolation and Canonical Post-Auth Home

## Status
Accepted

## Date
2026-08-15

## Context

ADR-026 closed the customer API pipeline (auth → org → role → SKU entitlement → capability). It did not define:

1. Which **report shapes** a SKU may see on `/api/shared/reports`.
2. Which function is authoritative for **post-authentication landing**.

PLAT-004 recorded both gaps:

- H5 / N4 — `organization_admin` always becomes `organization_owner`; `?persona=` can switch a Complete admin into FO-shaped areas or an FO admin into PM/finance-shaped areas. `platform.reports` is granted to every SKU.
- M2 — `resolvePostAuthHome` is SKU-safe for `/dashboard`, but invitation accept and portal magic links still use `defaultHomeForRole`, which is PM-biased.

ADR-026 already says FO Organization Admin may *hold* `pm.finance:*` grants and is denied by SKU. Report **data shapes** still leak without a second contract. FAC-002 already isolates work-order registries by `work_surface`; that decision (ADR-025) stays.

Related: `docs/121-plat-006-finance-reports-routing-remediation` · ADR-003 · ADR-019 · ADR-026 · ADR-031 (trusted application mutation architecture).

## Decision

1. **Report shapes are authorized by intersection, not by query string.**  
   A caller receives only personas and areas allowed by **both** role/capability and SKU/module entitlement (`skuIncludesPropertyManager`, `skuIncludesFacilityOperations`, `pm.financial_operations`).  
   `?persona=` and `?area=` may narrow to a subset. They must never expand authority.

2. **Facility Operations does not receive legacy PM / finance / resident shared-report shapes.**  
   FO-only orgs resolve to `facility_manager` and FO areas only, or are denied the legacy snapshot. Finance facts are not loaded without `pm.financial_operations`. Complete receives the intended **union**. Property Manager does not receive FO product areas.

3. **Portal roles are not staff reporters.**  
   Tenant, vendor, and property_owner cannot call `/api/shared/reports`. Owner financial summaries stay on `/api/finance/reports/owner` under `pm.finance:reports.read`.

4. **One post-auth resolver.**  
   `resolvePostAuthHome` is the only function that may compute a staff or portal landing after login, invitation accept, magic link, Guided Setup (via `resolveProductWorkspaceHome`, which it already wraps for managers), or dashboard bounce.  
   `defaultHomeForRole` remains a role-only helper. It must not be used as a staff `homeHref` when a SKU is known.

5. **This ADR does not** add roles, SKUs, entitlement keys, or Stripe products; does not delete July `financial:*` grants; does not change FAC-002 `work_surface` filters; does not split `role_permission_grants` by SKU (H4 remains defense-in-depth).

## Consequences

**Easier:** FO cannot inherit PM executive report blocks; invitation links stop sending FO managers to `/pm/mission-control`; Complete can still switch persona **down** to a subset of the union.

**More difficult:** Shared-reports tests must assert SKU × role × persona, not only `platform.reports:read`. Every new post-auth entry path must call `resolvePostAuthHome`.

## Alternatives considered

- **New entitlement key for legacy shared reports.** Rejected — existing SKU helpers already distinguish products.
- **403 all FO callers of `/api/shared/reports`.** Acceptable fail-closed option; this ADR allows a FO-shaped snapshot instead so the URL does not become a dead end.
- **Make `defaultHomeForRole` SKU-aware.** Rejected — two resolvers will drift (M2 root cause).
- **Remove `defaultHomeForRole`.** Rejected for this package — portal defaults and existing tests still need a role-only helper.
- **Split finance grants by SKU now.** Rejected — ADR-026 already denies FO at entitlement; N1 requires adding `pm.finance:*`, not scoping them.

## Approval

Accepted with PLAT-006 (`docs/121` Approved). Implementation of Slices B and C is authorized.
