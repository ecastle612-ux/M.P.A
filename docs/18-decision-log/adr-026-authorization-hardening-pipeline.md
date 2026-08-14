# ADR-026: Authorization Hardening Pipeline (SKU + Surface + Comms Staff)

## Status
Accepted

## Date
2026-08-14

## Accepted
2026-08-14 — Product Owner + Architect authorization for PLAT-002 Authorization Hardening (docs/94 Approved).

## Context

ADR-015 introduced subscription + entitlement as a layer distinct from role permissions. Page middleware enforces entitlements on `/pm`, `/facility`, and `/shared`. PLAT-001 (docs/93) showed that this layer is missing or incomplete where it matters:

1. Finance and property APIs check RBAC only (C1, C2).
2. Middleware treats `/api/*` as entitlement-exempt (C3).
3. Work-order RLS grants SELECT to any org member and ignores `work_surface` (C4).
4. Tenant conversation RLS treats `maintenance_technician` as PM staff regardless of SKU (C5).

ADR-003’s four planes remain correct for tenant / owner / vendor vs staff, but **org membership is not a sufficient SELECT grant** on shared operational tables. ADR-024 says Facility Operations does not gain a tenant inbox; the database helper `is_pm_staff` contradicts that.

Implementing a patch per helper without a single pipeline would recreate the drift. Changing Stripe, SKUs, or entitlement key names is out of scope and forbidden by the Product Constitution for this work.

Related:

- Design: `docs/94-plat-002-authorization-hardening/index.md`
- Audit: `docs/93-plat-001-platform-mismatch-audit/index.md`
- ADR-003 four-plane authorization
- ADR-012 Implementation Gate
- ADR-015 three commercial products + entitlements
- ADR-019 Product Constitution
- ADR-020 shared work-order table + `work_surface`
- ADR-024 Tenant Communication Center

## Decision

1. **One customer authorization pipeline**, fail closed, in this order:

   Authentication → Organization (verified membership or portal plane) → Role / plane → SKU entitlement (`entitlementsForSku`) → Module permission (RBAC capability) → Action (surface, assignment, lease, vendor link).

2. **One shared API helper** implements that pipeline. Domain wrappers (`requireFinancePermission`, `requirePropertyPermission`, `requireMaintenancePermission`, `requireFacilityOperation`, and the communications / reports helpers) call it. Finance requires `pm.financial_operations`. Property requires `pm.properties`. No new entitlement keys.

3. **Middleware is a coarse API gate**, not a redirector. Catalogued `/api/finance`, `/api/pm/*`, `/api/facility/*`, and `/api/shared/{reports,documents,communications}` prefixes return JSON 401/403. Pages keep today’s redirects. Helpers remain mandatory (defense in depth).

4. **Work-order RLS is SKU- and surface-aware.** Add SQL helpers that map:

   - `mpa_property_manager` / `mpa_complete_platform` → `work_surface = residential`
   - `mpa_facility_operations` / `mpa_complete_platform` → `work_surface = facility`

   Remove `is_org_member` as a standalone SELECT/ALL grant on `maintenance_work_orders` and `maintenance_work_order_updates`. Keep resident, requester, assigned technician, and linked-vendor predicates. Complete is the union of both surfaces.

5. **Tenant comms staff is a PM desk, not a technician role.** Database helper (new name, e.g. `is_pm_comms_staff`) allows `organization_admin`, `property_manager`, `leasing_agent` only, and only when the org SKU is Property Manager or Complete. `maintenance_technician` is denied on all SKUs. The Next.js staff allowlist must match. Tenant self-access is unchanged.

6. **This ADR does not** add roles, SKUs, Stripe products, or entitlement keys; does not split the work-order table; does not move mutations to Edge Functions (ADR-007 remains a separate discussion). Implementation is authorized while this ADR is **Accepted** and docs/94 is **Approved**. No Production deploy without Owner authorization.

## Consequences

**Easier:** One reviewable path for every customer API; UI and PostgREST can no longer disagree on FO vs PM vs Complete; COM-002 staff desk matches ADR-024.

**More difficult:** FO Organization Admin still *holds* `pm.finance:*` grants but is denied by SKU (grants stay global until a later ADR). Complete technicians lose tenant-inbox API access they have today (intentional). RLS migrations must be written against Production’s applied names (lineage drift). New SQL helpers must revoke `anon` EXECUTE.

## Alternatives Considered

- **SKU-check only in finance/property helpers; leave middleware and RLS.** Rejected — C3 and C4 remain; the next new route repeats C1.
- **Middleware-only API entitlements.** Rejected — defense in depth; impersonation and future routes need the helper.
- **Split `maintenance_work_orders` into PM and FO tables.** Rejected — violates ADR-020; FAC-002 and MEDIA-001 assume one table.
- **Filter RLS by role only (no SKU).** Rejected — there is no Facility Manager role; FO and PM managers share `property_manager` / `organization_admin`.
- **Keep technicians on tenant comms when SKU is Complete.** Rejected for P0 — one technician role serves both surfaces; ADR-024 and C5 require FO technicians out. Align API and RLS by excluding the role everywhere.
- **New entitlement keys or Stripe changes.** Rejected — constitution and PLAT-002 constraints.
- **Implement before approval.** Rejected — ADR-012.
