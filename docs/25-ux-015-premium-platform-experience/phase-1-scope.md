# UX-015 Phase 1 Scope Matrix

**Status:** Approved  
**Parent:** [UX-015 Index](./index.md)

## Screens / Surfaces In Scope

| Surface | Current location (indicative) | Polish goal |
|---------|-------------------------------|-------------|
| Auth — login / signup | `apps/web` auth + `LoginForm` | Premium calm auth composition; clearer hierarchy; polished feedback |
| Auth — forgot / reset password | auth routes + forms | Same DNA as login |
| Auth — accept invitation | invitation card/page | Trustworthy invite acceptance |
| Portal index / role entry | portal routes + portal shells | Clear role portal framing; no business chrome |
| Workspace loading | loading.tsx / skeletons | Smooth perceived load; skeleton fidelity |
| App shell | `ApplicationShell` | Desktop + mobile chrome polish |
| Sidebar | `Sidebar` | Ink nav clarity, hover/active, collapse/responsive |
| Top navigation | `TopNavigation` | Search/profile/org switcher alignment |
| Responsive nav | `ResponsiveNavigation` | Native-feeling mobile nav |
| Dashboard shell | `DashboardShellPlaceholder` | Visual standard for future ops console density |
| Profile / settings layout | profile page + form | Settings rhythm: sections, labels, spacing |
| Unauthorized / not-found | dedicated pages | Calm recovery states |
| Portal role shells | manager/owner/tenant/vendor | Consistent portal frame polish |

## Shared Components In Scope

| Primitive / pattern | Package | Audit focus |
|---------------------|---------|-------------|
| Button | `@mpa/ui` | variants, sizes, hover/focus/disabled, press feedback |
| Input / Textarea / Select | `@mpa/ui` | height, radius, focus ring, error affordance |
| Card | `@mpa/ui` | use only for interactive units; spacing/radius |
| Modal / Drawer | `@mpa/ui` | enter/exit motion, focus trap, scrim |
| Toast | `@mpa/ui` | enter motion, dismiss, stacking |
| Skeleton / Spinner | `@mpa/ui` | shimmer vs reduced-motion static |
| Table | `@mpa/ui` | header/row hover/empty/loading DNA |
| Badge / Avatar / Tabs / Switch / Checkbox / Tooltip | `@mpa/ui` | size/icon/state consistency |
| Command palette shell | `@mpa/ui` | elevation + motion |

## Shell Components In Scope

- Breadcrumbs
- Profile menu
- Organization switcher
- Role switcher / role context chrome
- Notification center (visual only; no new notification product)
- Portal shell / role portal frame

## Out of Scope (Phase 1)

| Item | Reason |
|------|--------|
| Marketing landing page | `/` currently redirects; new marketing surface is a separate design cycle |
| Business workflow UI | Not built; blocked by roadmap + gate |
| API / middleware behavior changes | Explicit constraint |
| Route map changes | Explicit constraint |
| Governance / ADR process changes | Explicit constraint |
| Token replacement | Canopy already approved; only gap-fill tokens if approved |
| SignWell / integration surfaces | Outside visual foundation polish unless already rendered as foundation chrome |

## Implementation Boundaries (After Approval)

Allowed:

- CSS / Tailwind class refinements using Canopy tokens
- Shared primitive visual/interaction polish in `packages/ui`
- Shell layout spacing, hierarchy, and motion wiring already cataloged in Canopy
- Empty/loading/error presentation improvements with same behavior

Forbidden without a new gate cycle:

- New routes or route semantics
- New APIs or contract fields
- Schema / RLS changes
- New product features or workflow steps
- Changing authorization or tenancy behavior
- Replacing Canopy with a different brand system
