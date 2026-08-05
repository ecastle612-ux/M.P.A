# 07 — Implementation Record

**Package:** NAV-001  
**Status:** Implemented (awaiting merge)  
**Date:** 2026-08-05  
**Authorization:** [06](./06-implementation-authorization.md)  
**Architecture:** [ARCH-001](../122-arch-001-capability-consolidation/README.md)

---

## Shipped

| Item | Detail |
|------|--------|
| Reusable `WorkspaceLauncher` | `apps/web/src/components/workspace/workspace-launcher.tsx` |
| Mission Control embed | Below Insights in `OperationsCenterView` (`#workspace-launcher`) |
| Catalog reuse | Existing `PORTAL_LAUNCHER_GROUPS` — Open · View As · Test Mode unchanged |
| `/portal` (Master Admin) | Redirect → `/master-admin#workspace-launcher` |
| `/master-admin/dashboards` | Redirect → `/master-admin#workspace-launcher` |
| Nav cleanup | Removed Surface Switcher · Portal Testing · Portals (when `master_admin`) |
| Non-MA `/portal` | Preserved availability hub |
| Portal destinations | `/portal/tenant\|owner\|manager` preserved |
| ADR-034 | Accepted |
| ARCH-001 | Accepted permanent principle |

---

## Verification

| Check | Result |
|-------|--------|
| Catalog card wiring tests | Existing portal-launcher-catalog suite |
| Nav consolidation tests | `navigation-config.nav001.test.ts` |
| No API / permission / session contract changes | Yes |
| Bookmarks redirect | `/portal` (MA) · `/master-admin/dashboards` |

---

## Follow-ups (not in this authorize)

- Future Support / CS / Internal workspaces can host `WorkspaceLauncher` with filtered `groups` visibility rules (ARCH-001 reuse).
