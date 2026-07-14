# 30.03 — Navigation System

## Status

**Proposed (awaiting implementation approval)**

## Objective

Reframe navigation around operator workflows while strictly limiting navigation
to currently implemented modules.

## Current Route Reality (Phase 1-4)

Implemented operator surfaces:

- Dashboard (`/dashboard`)
- Properties (`/properties`, detail/edit/new)
- Units (`/units`, detail/edit/new)
- Profile (`/profile`)
- Portals (`/portal`, role-specific portal routes)

Not currently implemented as product modules:

- Residents
- Financials
- Reports
- Settings (as a distinct module surface)

## Workflow-Oriented IA (Within Existing Scope)

### Primary

- Dashboard
- Properties
- Units

### Platform Utilities

- Profile
- Portals

## Navigation Architecture Rules

1. One primary left-nav model for authenticated app surfaces.
2. Mobile and desktop nav contain equivalent destinations.
3. Command palette destinations mirror top-level nav exactly.
4. No placeholder destinations for unimplemented modules.
5. Labels reflect jobs-to-be-done, not table names.

## Sidebar Taxonomy (Proposed)

- **Operations**
  - Dashboard
  - Properties
  - Units
- **Workspace**
  - Profile
  - Portals

## Top Navigation Roles

- Global context and switchers
- Quick command invocation
- Notifications
- Identity menu

Top navigation should not duplicate left-nav hierarchy beyond necessary mobile
fallback.

## Command Palette Standards

- Navigation actions only for implemented routes
- Action commands only for implemented capabilities (create property/unit)
- Shortcut map consistency with visible affordances
- No non-functional placeholder commands

## Breadcrumb Strategy

- Required on deep routes:
  - Property detail/edit
  - Unit detail/edit
- Pattern:
  - Parent list -> record -> mode

## Mobile Navigation Standards

- Trigger opens full-width sheet/drawer with clear close behavior
- Focus trapped while open
- Escape closes (keyboard), outside click closes (pointer)
- Current route highlighted

## Accessibility Requirements

- `aria-current="page"` on active destination
- Landmark clarity (`nav`, `header`, `main`)
- Keyboard reachability and deterministic focus order
- Visible focus states on all nav controls

