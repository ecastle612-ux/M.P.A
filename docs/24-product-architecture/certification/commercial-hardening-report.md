# Commercial Hardening Report (P0)

**Status:** Implemented + re-certified  
**Date:** 2026-08-06  
**Scope:** P0 blockers only. No Financial Operations. No Facility feature work. No CORE-004.

---

## Mission outcome

M.P.A. customer chrome now **fails closed** on commercial entitlements, locks subscription mutation to platform operators, provides entitlement-aware global search, forces Guided Setup into the purchased product home, and hides Master Admin from non-operators.

---

## Updated P0 checklist

| ID | Blocker | Status |
|----|---------|--------|
| P0-1 | Entitlement enforcement (routes/APIs/nav/launcher/deep links) | **Pass** |
| P0-2 | Commercial integrity (no customer SKU mutation) | **Pass** |
| P0-3 | Global Search production-ready + entitlement-aware | **Pass** |
| P0-4 | Guided Setup ends in purchased product home | **Pass** |
| P0-5 | Master Admin visible only to platform operators | **Pass** |

---

## What changed (implementation)

| Area | Change |
|------|--------|
| Shared | `evaluatePathEntitlement`, `searchCatalogForSku`, route map |
| Middleware | Deep-link entitlement redirects; Admin operator gate |
| RLS | Subscription UPDATE operator-only; operator org read |
| APIs | `PUT /subscription` 403 for non-operators; Admin org list |
| Search | Header `GlobalSearch` — entitled workspaces only |
| Setup | Billing ack + home confirm required; finish → product home |
| Billing | Read-only plan; no customer SKU editor |
| Profile / menus | Master Admin link operator-only |
| IA | Manager portal redirects into commercial product home |
| Nav | PM/Facility Mission Control labels disambiguated; Capital Projects removed from customer nav until entitled |

---

## Verification summaries

See companion docs in this folder:

- [Security verification](./hardening-security-verification.md)
- [Commercial verification](./hardening-commercial-verification.md)
- [Navigation verification](./hardening-navigation-verification.md)
- [Customer onboarding verification](./hardening-onboarding-verification.md)
- [GO / NO-GO Financial Operations](./go-no-go-financial-operations.md) (updated)

---

## Automated proof

- `pnpm --filter @mpa/shared test` — includes entitlement denial/search tests  
- `pnpm --filter @mpa/web typecheck`  
- `pnpm --filter @mpa/web lint`
