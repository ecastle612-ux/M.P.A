# 06 — Implementation Authorization

**Package:** NAV-001  
**Status:** ✅ **Authorized**  
**Date:** 2026-08-05  
**Approval:** [05](./05-approval-record.md)  
**Architecture:** [ARCH-001](../122-arch-001-capability-consolidation/README.md)

---

## Authorized scope

| ID | Work |
|----|------|
| N-I1 | Create reusable `WorkspaceLauncher` (reuse Portal Launcher behavior/catalog) |
| N-I2 | Embed Workspace Launcher on `/master-admin` below Insights |
| N-I3 | Redirect Master Admin `/portal` → `/master-admin#workspace-launcher` |
| N-I4 | Redirect `/master-admin/dashboards` → `/master-admin#workspace-launcher` |
| N-I5 | Remove Surface Switcher / Portal Testing / MA Portals synonym nav |
| N-I6 | Preserve non-MA `/portal` availability + portal destinations |
| N-I7 | No permission / API / Test Mode / Impersonation contract changes |

---

## Explicit excludes

- New launcher UX / new card anatomy  
- Expanding `portal-test` enum  
- Deleting `/portal/tenant|owner|manager`  
- Business logic changes beyond presentation + redirects + nav
