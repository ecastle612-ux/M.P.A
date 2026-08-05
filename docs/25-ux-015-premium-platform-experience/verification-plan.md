# UX-015 Verification Plan

**Status:** Approved  
**Parent:** [UX-015 Index](./index.md)

After approval and implementation, Phase 1 is complete only when the following
verification artifacts exist.

## 1. Before / After Screenshots

Capture desktop and mobile for:

- Login
- Portal / role shell entry
- Dashboard shell
- Sidebar + top navigation
- Empty state example
- Loading / skeleton example
- Error state example
- Modal + toast example
- Profile / settings layout

Store under an artifacts path for the PR walkthrough (not committed binary bloat
unless the repo already has an agreed screenshot convention).

## 2. Components Updated

PR description must list every `@mpa/ui` primitive and shell component touched,
with a one-line craftsmanship note each.

## 3. Screens Updated

PR description must list every route/surface visually refined.

## 4. Accessibility Verification

| Check | Pass criteria |
|-------|---------------|
| WCAG AA contrast | Text/icon/border against surfaces meet AA |
| Keyboard | All interactive controls reachable; focus order logical |
| Focus management | Modals/drawers trap and restore focus |
| Screen reader | Landmark roles, labels, live regions for status |
| Reduced motion | Catalog behaviors collapse correctly |
| Touch targets | Mobile interactive targets meet comfortable hit areas |

## 5. Performance Verification

| Check | Pass criteria |
|-------|---------------|
| No regression | Lint/typecheck/build remain green |
| Bundle discipline | No heavy animation libraries unless already approved |
| Lazy load | Heavy UI only where already appropriate; no eager bloat |
| Runtime | Avoid layout thrash; prefer CSS transitions/tokens |
| PWA feel | Mobile scroll/safe-area/nav remain smooth |

## 6. Remaining UI Refinement Opportunities

Ship a short backlog of Phase 2 polish opportunities discovered during the audit
(for example: marketing landing, deeper ops-console density once business widgets
exist, dark mode productization). These remain gated separately.
