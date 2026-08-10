# Broken Route Report — Product Readiness v2

**Date:** 2026-08-10  
**Scope:** All App Router pages + LIVE HTTP probes  
**Code changes:** None

## LIVE auth gates (production)

All protected routes below returned **307 → /login** when unauthenticated. Public commercial routes returned **200**.

| Route | LIVE | Classification |
|-------|------|----------------|
| `/` `/modules` `/pricing` `/enterprise` `/checkout` `/login` `/demo` | 200 | Public OK |
| `/admin` + Owner Ops nav targets | 307→login | Gate OK |
| `/pm/*` aligned pages | 307→login | Gate OK |
| `/facility/*` including Planned modules | 307→login | Gate OK (pages exist) |
| `/shared/*` `/setup` `/billing` `/launcher` | 307→login | Gate OK |
| `/portal/tenant` `/portal/vendor` `/portal/owner` | 307→login | Gate OK |

## Redirect-only (not broken — intentional stubs)

| Route | Target | Finding ID |
|-------|--------|------------|
| `/dashboard` | `resolvePostAuthHome` | BR-01 |
| `/portal` | Role portal | BR-02 |
| `/portal/manager` | Staff home | BR-03 |
| `/facility/capital-projects` | `/facility/mission-control` | BR-04 |
| `/admin/commercial/entitlements` | `/admin/commercial/subscriptions` | BR-05 |
| `/admin/testing/product-matrix` | `/admin` | BR-06 |
| `/admin/workspaces/[moduleId]` | `/admin` | BR-07 |

## Navigable but incomplete (workflow dead-ends)

| Route | Behavior | Severity | ID |
|-------|----------|----------|-----|
| `/facility/operations` … `/facility/building-systems` (9) | `FacilityModulePage` “Planned — included, not implemented” | P1 | BR-08 |
| `/portal/tenant` Packages card | “Coming soon” | P1 | BR-09 |
| `/pm/vendors` | Hub/links only — no vendor directory CRUD | P2 | BR-10 |
| `/admin/launch-readiness`, catalog, capability-catalog, products/*, testing/demo | Reachable by URL; **not** in `MASTER_ADMIN_NAV` | P2 | BR-11 |

## Master Admin sidebar

Per `docs/61-owner-ops-master-admin/broken-route-report.md` + code: **all 12 nav items are functional** (no placeholder sidebar entries). Policy is correct for Owner Ops; FO staff nav does **not** follow the same policy.

## API surface

97 `route.ts` handlers across pm, admin, finance, commerce, shared, orgs, demo, portal, invitations, auth, profile, leasing webhook. No route-layer TODO/FIXME. Authenticated API behavior not LIVE-exercised (AUTH_BLOCKED).

## Verdict

No widespread 404/500 on public or gated entry points. The dominant “broken feeling” is **entitled + navigable Planned FO modules** and **resident Coming soon**, not missing files.
