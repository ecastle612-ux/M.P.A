# PX-003A — Enterprise UX Hotfix Sprint

**Status:** Complete (presentation layer)  
**Purpose:** Prepare M.P.A. for real property manager usability testing  
**Scope:** Clarity over minimalism — no backend, API, or workflow changes

## Summary

PX-003A addresses usability blockers identified after PX-003: icon-only navigation confusion, internal org IDs in greetings, always-visible ⌘K shortcut, cramped tables, and constrained desktop layouts.

## Fixes (prioritized)

| Priority | Issue | Fix |
|----------|-------|-----|
| P0 | Icon-only sidebar by default | Labels + icons always visible; icon-only only after intentional collapse; reset storage key to expanded default |
| P0 | Weak branding | Full lockup: logo + **M.P.A.** + **My Property Assistant**; larger crisp SVG mark |
| P0 | Search ⌘K confusing | Removed always-visible badge; shows on hover/focus only; placeholder → "Search properties, tenants, leases…" |
| P0 | Desktop whitespace / max-width | Removed search bar `max-w-2xl` cap; widened sidebar to 16.5rem |
| P1 | Internal org IDs in greeting | Greeting uses profile first name; org name on separate line with numeric IDs stripped |
| P1 | Navigation clarity | Wider nav items, larger icons, section labels, tooltips when collapsed |
| P1 | Table scanability | Increased row height (min 3.25rem), cell padding px-5 py-4 |
| P2 | Mobile nav touch targets | Increased drawer item padding |

## Key files

- `apps/web/src/components/shell/sidebar.tsx`
- `apps/web/src/components/branding/mpa-brand.tsx`
- `apps/web/src/components/shell/command-center.tsx`
- `apps/web/src/components/operations-center/operations-center-view.tsx`
- `apps/web/src/lib/format/display-labels.ts`
- `packages/ui/src/primitives/table.tsx`

## Verification

| Check | Result |
|-------|--------|
| `pnpm lint` | Pass |
| `pnpm typecheck` | Pass |
| Playwright audit | 30/30 routes OK (10 routes × 3 viewports) |

Screenshots: [`screenshots/`](./screenshots/)

## Usability testing readiness

A first-time property manager can now:

- Read every sidebar item without guessing icons
- See professional branding immediately
- Search without developer jargon in the default UI
- Greet by name instead of database-style org IDs
- Work comfortably on 1280–1920px+ displays with fluid layouts
- Scan tables with improved row spacing

## Known follow-ups (non-blocking)

- Org names ending in " Org" from test data (e.g. "PMX Workflow Org") — cosmetic
- Entity create/edit forms still use Card sections vs `FormSection`
- ⌘K documented in Command Center footer hint when palette is open
