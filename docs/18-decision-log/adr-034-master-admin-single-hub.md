# ADR-034: Master Admin Uses a Single Operational Hub for Portal Launch

## Status
Accepted

## Date
2026-08-05

## Approved
2026-08-05 — `APPROVE NAV-001 – Master Admin Hub Consolidation`

## Context
UX-016 Slice B shipped an expanded Portal Launcher on `/portal` (Master Admin path) and mirrored it on `/master-admin/dashboards`, while remounting Mission Control on `/master-admin`. Operators faced multiple launcher entry points.

STD-001 / ADR-033 establish Mission Control as the permanent Master Admin home. ARCH-001 (Capability Consolidation) requires one capability, one authoritative home.

## Decision
1. **Mission Control (`/master-admin`) is the single Master Admin operational hub** for workspace/portal launch as well as UDF command work.  
2. Embed a reusable **Workspace Launcher** component (certified Portal Launcher behavior + catalog) on Mission Control below Insights.  
3. **Deprecate** Master Admin use of standalone `/portal` as a launcher page (redirect to hub).  
4. **Deprecate** `/master-admin/dashboards` as a primary nav destination (redirect to hub).  
5. **Preserve** `/portal/tenant`, `/portal/owner`, `/portal/manager` destinations; preserve non–Master Admin `/portal` availability hub; preserve Impersonation Center and `portal-test` contracts.  
6. Adopt **ARCH-001** permanent preference: Extend → Reuse → Consolidate → Create.

## Consequences
**Easier:** One hub, fewer nav synonyms, fewer clicks, one launcher framework to maintain and reuse for future workspaces.  
**More difficult:** Requires careful non-MA `/portal` behavior and temporary redirects for bookmarks.

## Alternatives Considered
- **Keep Portals + Surface Switcher + Mission Control link:** Rejected — redundant.  
- **Delete `/portal` entirely:** Rejected — breaks destinations and non-MA availability.  
- **Claim Mission Control already had Open / View As / Test Mode:** Rejected — embed required.  
- **Merge Impersonation into launcher without Impersonation Center:** Rejected — security boundary must remain.

## References
- [NAV-001](../121-nav-001-master-admin-hub-consolidation/README.md)
- [ARCH-001](../122-arch-001-capability-consolidation/README.md)
- [STD-001](../119-std-001-ux016-platform-standards/README.md)
- [ADR-033](./adr-033-ux016-platform-standards-mandatory.md)
- [ADR-012](./adr-012-design-document-approve-implement.md)
