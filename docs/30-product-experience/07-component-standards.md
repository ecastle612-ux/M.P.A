# 30.07 — Component Standards & Audit

## Status

**Proposed (awaiting implementation approval)**

## Objective

Consolidate and normalize component behavior across existing surfaces for visual
consistency, accessibility, and maintainability.

## Audit Scope

- `apps/web/src/components/**`
- `packages/ui/src/primitives/**`
- `packages/ui/src/components/**`

## Key Findings

### Duplicate Pattern Groups

1. **Table action clusters** in properties/units use near-identical rendering.
2. **Form field composition** repeats label/input/error patterns without shared
   form-row abstractions.
3. **Card header structures** vary across pages with similar semantics.
4. **Inline feedback blocks** (error/notice) repeat ad hoc styling patterns.

### Visual Inconsistencies

- Mixed radius and spacing strategies across cards/forms.
- Inconsistent button hierarchy for equivalent actions.
- Placeholder modules (notifications/command palette) visually feel production
  complete despite non-operational behavior.

### Accessibility Gaps

- Nav links lack clear active-state semantics.
- Some menu/dialog-like patterns need stronger focus management guarantees.
- Table action groups risk crowded touch targets on smaller devices.

### Naming/Structure Inconsistencies

- Similar components use different semantic naming conventions.
- Some shell-level components mix concerns (state + view + behavior).

## Standardization Rules

1. Build reusable composition primitives before page-level restyling.
2. Normalize card/table/form section spacing via shared tokens.
3. Create shared `PageHeader`, `SectionHeader`, and `InlineFeedback` patterns.
4. Unify row actions into one reusable action-group component.
5. Introduce explicit placeholder styling variant for non-operational controls.

## Recommended Consolidations

- `PropertiesTable` + `UnitsTable`:
  - shared table shell
  - shared action button cluster
  - shared empty-state pattern
- `PropertyForm` + `UnitForm`:
  - shared form section layout
  - shared field wrapper (label/help/error)
- Shell controls:
  - common trigger style for command palette, notifications, and switchers

## Implementation Priority

1. Primitive consistency pass (button/input/card/table/badge)
2. Shell consistency pass (sidebar/topnav/mobile nav)
3. Dashboard/card composition pass
4. Form/table consolidation pass

## Guardrails

- No domain logic extraction into UI primitives.
- No route-level behavior changes.
- No permission/auth flow changes.

