# ADR-034: Master Admin Uses a Single Operational Hub for Portal Launch

## Status
Proposed

## Date
2026-08-05

## Context
UX-016 Slice B shipped an expanded Portal Launcher on `/portal` (Master Admin path) and mirrored it on `/master-admin/dashboards`, while remounting Mission Control on `/master-admin`. Operators now face multiple launcher entry points (Portals, Portal Testing, Surface Switcher, Support synonym, and a Mission Control Quick Action that only links out).

STD-001 / ADR-033 establish Mission Control as the permanent Master Admin home. Maintaining parallel full launcher pages increases clicks and maintenance without adding capability. Open Portal, View As, and Test Mode must remain, with Impersonation Center and `portal-test` as the security boundaries.

## Decision (Proposed — activates on Approve)

1. **Mission Control (`/master-admin`) is the single Master Admin operational hub** for portal/surface launch as well as UDF command work.  
2. Embed the existing certified `PortalLauncher` (catalog + Open / View As / Test Mode) on Mission Control below the STD-001 fold (workspace or post-Insights section).  
3. **Deprecate** Master Admin use of standalone `/portal` as a launcher page (redirect to hub).  
4. **Deprecate** `/master-admin/dashboards` as a primary nav destination (redirect to hub).  
5. **Preserve** `/portal/tenant`, `/portal/owner`, `/portal/manager` destinations; preserve non–Master Admin `/portal` availability hub; preserve Impersonation Center and `portal-test` contracts.  
6. Do **not** reopen UX-016; execute as NAV-001 under Design → Document → Approve → Implement.

## Consequences
**Easier:** One hub, fewer nav synonyms, fewer clicks, one launcher mount to maintain.  
**More difficult:** Requires careful non-MA `/portal` behavior and temporary redirects for bookmarks.

## Alternatives Considered
- **Keep Portals + Surface Switcher + Mission Control link:** Rejected — redundant.  
- **Delete `/portal` entirely:** Rejected — breaks destinations and non-MA availability.  
- **Claim Mission Control already has Open / View As / Test Mode:** Rejected — today it only links out; embed is required.  
- **Merge Impersonation into launcher without Impersonation Center:** Rejected — security boundary must remain.

## References
- [NAV-001 review](../121-nav-001-master-admin-hub-consolidation/01-navigation-simplification-review.md)
- [NAV-001 design package](../121-nav-001-master-admin-hub-consolidation/02-design-package.md)
- [UX-016 Slice B Master Admin experience](../118-ux-016-dashboard-navigation-optimization/18-master-admin-experience.md)
- [STD-001](../119-std-001-ux016-platform-standards/README.md)
- [ADR-033](./adr-033-ux016-platform-standards-mandatory.md)
- [ADR-012](./adr-012-design-document-approve-implement.md)
