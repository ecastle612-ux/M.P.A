# 213 — App-Wide Sidebar Visual + UX Refinement

**Title:** Authenticated M.P.A. sidebar visual + navigation refinement  
**Status:** **RECONCILED ONTO SLICE 2 PRODUCTION LINEAGE — Production release in [docs/214](../214-app-wide-sidebar-production-release/index.md)**  
**Date:** 2026-08-18  
**Authority:** Owner authorized design + in-repo implement; later authorized Production of this sidebar only  
**Companion:** [docs/208](../208-mpa-app-wide-simplicity-navigation-audit/index.md) simplicity principles · [docs/202](../202-complete-scoped-staff-handoff-remediation/index.md) effective surfaces · Canopy ([docs/06](../06-design-language/index.md)) · Slice 2 Production [docs/212](../212-fo-eff-slice2-production-release/index.md)  
**Gate:** Design → Document → Approve → Implement (Owner authorized this package)  
**Numbering:** Originally drafted as `docs/212-app-wide-sidebar-visual-refinement` on a `main`-based branch. **docs/212 is reserved for FO-EFF Slice 2 Production.** This record is the unique sidebar refinement number. Do not rewrite Slice 2 docs/212.  
**Production:** Sidebar-only Production release is recorded in docs/214. **Do not resume FO-EFF Slice 3.**

---

## Verdict

**RECONCILED ONTO SLICE 2 PRODUCTION LINEAGE**

Authenticated staff, Master Admin, and portal navigation share one Canopy ink-rail language: branded lockup, grouped destinations, distinctive active state (tint + stronger type/icon + left accent), consistent icons, compact org/surface context, account footer, optional desktop collapse, and a left mobile drawer. Role, SKU, and Complete operating-scope rules are unchanged.

Implement SHA **`0823bae2`** is cherry-picked onto Slice 2 tip **`c692c888`** (Production baseline **`27657c6b`** is an ancestor). Conflict resolution was documentation-only (`docs/README.md`). `packages/shared/src/commercial/index.ts` keeps both `nav-presentation` and Slice 2 `rent-collection-copy`. No `modules.ts` / entitlement / RBAC / Stripe / migration change.

---

## 1. Implementation SHA

**`0823bae2`** (`feat(nav): refine authenticated sidebars with Canopy depth`)

Reconciled onto `cursor/sidebar-production-release-6821` from Slice 2 tip `c692c888`. Production release SHA is recorded in docs/214.

## 2. Sidebar components changed

| Component | Change |
|-----------|--------|
| `apps/web/src/components/shell/app-nav-rail.tsx` | Shared visual foundation (brand, groups, items, collapse, footer) |
| `apps/web/src/components/shell/sidebar.tsx` | Staff rail + Complete surface switcher |
| `apps/web/src/components/shell/mobile-nav-drawer.tsx` | Left ink drawer (not a shrunken desktop rail) |
| `apps/web/src/components/shell/responsive-navigation.tsx` | Delegates to the drawer |
| `apps/web/src/components/shell/application-shell.tsx` | Compact mobile brand + org context |
| `apps/web/src/components/shell/account-menu.tsx` | Shared account menu (sidebar + header) |
| `apps/web/src/components/shell/profile-menu.tsx` | Thin header wrapper |
| `apps/web/src/components/shell/profile-provider.tsx` | Single `/api/profile` fetch |
| `apps/web/src/components/admin/master-admin-shell.tsx` | Same rail + admin mobile drawer |
| `apps/web/src/components/portal/portal-shell.tsx` | Shared active-state + icons; portal pattern kept |

## 3. Navigation definitions changed

`navigationGroupsForSku` **hrefs, entitlements, and group IDs are unchanged**. Presentation is layered in `packages/shared/src/commercial/nav-presentation.ts` (icons, sections, technician rail filter, active-state, Complete surface options). `MASTER_ADMIN_NAV` items are unchanged.

## 4. Shared-vs-specific architecture

One visual foundation (`AppNavRail`) consumed by:

- Property / Facility / Complete / complimentary staff (`ApplicationShell`)
- Master Admin (`MasterAdminShell`)
- Technician / tenant / owner / vendor portals (`PortalShell` — light rail + existing mobile bottom nav, not the ink staff drawer)

SKU, role, and `effectiveSurfaces` still decide **which** items exist. Presentation never adds a destination the source nav did not authorize.

## 5. Branding treatment

Compact dark-surface lockup using approved `/branding/logo-light.*` assets. Wordmark is **My Property Assistant**. Logo is 36px, not a hero lockup. Collapsed desktop shows mark only with an accessible name.

## 6. PM sidebar

Sections: Overview (Mission Control) · Portfolio (Properties, Residents, Leasing, Maintenance, Work order reports) · Finance (Financial Operations) · Partners (Vendors) · Workspace / Insights / Manage from shared. Header shows organization name + Property Manager (or Property Operations on Complete).

## 7. FO manager sidebar

Sections: Overview · Work (Operations, My Work, Reports) · Facilities (Assets + category queues, Request Forms, Work Templates) · Partners (Vendors) · shared Manage. Slice 1 destinations (`/facility/my-work`, `/facility/settings/request-forms`, `/facility/settings/work-templates`) are present in `navigationGroupsForSku` on this lineage and are mapped in presentation.

## 8. Technician sidebar

When membership staff roles are **only** `maintenance_technician`, the rail keeps My Work (when present), Operations, Maintenance, Properties, Documents, Tables, and Communications. Manager admin (category queues, vendors, reports, team) stays authorized on the server and is not shown on the rail. Dual-role manager+technician still sees the manager rail.

## 9. Complete both-surface sidebar

Both Property Operations and Facility Operations groups remain visible (no extra click to switch). A compact surface control jumps **directly** to the other Mission Control — not `/launcher`. The current path’s product group is visually emphasized.

## 10. Complete scoped behavior

`effectiveSurfaces` is unchanged. Complete + `property_operations` does not receive FO options. Complete + `facility_operations` does not receive PM options. The surface switcher only renders when both Mission Control hrefs are already entitled.

## 11. Master Admin sidebar

Same ink rail. Operations / Customers / Commercial unchanged. Operator email in the footer. No customer-product destinations.

## 12. Organization / workspace context

Header shows organization **name** (never id) and the current surface label (Property Operations / Facility Operations / product label / Owner Operations).

## 13. Active-state behavior

Longest-prefix match among entitled hrefs, plus exact `/admin` so Support does not light Command Center.

| Path | Active item |
|------|-------------|
| `/facility/my-work/...` | My Work |
| `/facility/settings/request-forms/...` | Request Forms (not Work Templates) |
| `/pm/financial-operations/online-payments` | Financial Operations |

Active treatment: Canopy-tinted surface + stronger type + stronger icon + left accent. Not color alone.

## 14. Icon system

One stroke-icon set (`packages/ui/src/icons/nav-icon.tsx`). Every major destination has a mapped icon. No emoji. No mixed libraries.

## 15. Navigation grouping

Logical sections inside existing product groups. Single-item **Finance** is kept because it separates money from portfolio. Technician sections collapse to the remaining daily destinations.

## 16. Desktop collapse

Implemented. Operational tables (properties, operations, finance) gain ~180px. Preference stored in `mpa_sidebar_collapsed` via `useSyncExternalStore`. Collapsed mode is icon-only with tooltip + `aria-label` + `sr-only` text. Active accent remains. Collapse does not remove destinations.

## 17. Mobile navigation

Left ink drawer (sheet), 44px targets, org + surface visible, closes on route change, focus-trapped, Escape/backdrop close, no horizontal overflow. Technician drawer uses the same simplified list. Portals keep the existing bottom-nav pattern.

## 18. User / account area

Sidebar footer: avatar/initials, display name, role, compact menu. Existing actions only: Profile, Billing & Plan, Guided Setup, Owner Operations (operators), Sign out. Header avatar remains. One `/api/profile` fetch via `ProfileProvider`.

## 19. Badges

None. Slice 2 Mission Control remains the Needs Attention surface. No new count queries.

## 20. Accessibility

Keyboard links, visible focus (Canopy ring on ink offset), `aria-current="page"`, collapse `aria-expanded` / `aria-controls`, mobile `role="dialog"` + focus trap, collapsed tooltips, contrast on ink + Canopy tint, `motion-reduce` for width/color transitions, `min-h-11` tap targets.

## 21. Performance impact

No new request waterfalls. Profile fetch is shared. Navigation is still computed from existing commercial context. Icons are inline SVG (no icon-font bundle). Collapse preference is localStorage only.

## 22. Click-count / navigation comparison

| Workflow | Before | After |
|----------|--------|-------|
| PM manager → Properties | 1 | 1 |
| PM manager → Financial Operations | 1 | 1 |
| FO manager → Operations | 1 | 1 |
| FO manager → Request Forms (when entitled) | 1 | 1 |
| FO manager → Work Templates (when entitled) | 1 | 1 |
| Technician → My Work (when entitled) | 1 | 1 (and first in the rail) |
| Complete both-surface → other Mission Control | 1 | 1 (sidebar item or surface control) |

No workflow gained a click. Launcher is no longer required for routine Complete switching.

## 23. Screenshot / visual QA

Representative rails were inspected at 1440, 1280, 768, and 390 for PM manager, FO manager, technician, Complete both-surface, Complete PM-only, Complete FO-only, and Master Admin. Look-fors: no clip/wrap of labels in the expanded rail, collapse mark remains, active accent visible, no cross-surface leakage, mobile drawer does not overflow.

## 24. RBAC regression

`STAFF_NAV_HREFS_BY_ROLE`, entitlements, and route evaluation are unchanged. Technician rail filtering is presentation-only.

## 25. docs/202 scope regression

Complete `property_operations` / `facility_operations` still hide the other product group at the source `navigationGroupsForSku` layer.

## 26. Slice 1 regression

This overlay does not modify work templates or My Work services. Slice 1 hrefs remain in `navigationGroupsForSku`. No Slice 1 code path was edited.

## 27. Slice 2 regression

Mission Control attention logic was not touched. No new nav badges compete with Needs Attention. Production baseline `27657c6b` remains an ancestor.

## 28. Typecheck / lint / tests / build

Recorded on the implement branch. Shared nav-presentation tests cover grouping, technician filter, Complete scope, active-state, click counts, and Master Admin isolation.

## 29. Production safety proof

No migrations. No RLS. No Stripe. No env vars. No deploy scripts. No Production apply. Complimentary users keep their granted product surface through the existing commercial context.

## 30. Known limitations

- Desktop collapse hydrates from localStorage after first paint (`useSyncExternalStore` server snapshot is expanded).
- Portal experiences keep a light rail; they do not use the staff ink drawer.
- No Help destination was added because none exists.
- Collapse preference is localStorage only and is not authorization state.

## 31. Production-release gate

Owner authorized Production of this sidebar refinement only. Release certification is [docs/214](../214-app-wide-sidebar-production-release/index.md).

Do **not** resume FO-EFF Slice 3 from this package.

---

## STOP

Do not begin Slice 3, Asset QR, Preventive Maintenance, Global Search, Quick Create, Recent Items, or deterministic routing without a separate Owner authorization.
