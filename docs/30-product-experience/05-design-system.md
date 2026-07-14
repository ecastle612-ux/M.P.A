# 30.05 — Design System Foundation

## Status

**Proposed (awaiting implementation approval)**

## Objective

Standardize a production-ready visual system for all existing Phase 1-4 surfaces
without changing business behavior.

## Current Baseline Findings

- Inconsistent radius usage (`rounded-sm`, `rounded-md`, `rounded-lg`) without
  semantic rules
- Mixed spacing decisions between similar surfaces
- Primitive and feature components duplicate visual logic
- Logo appears at large sizes in repeated contexts
- Placeholder interactions share production visual weight

## Token System (Proposed)

### Spacing Scale

- `2` (8), `3` (12), `4` (16), `5` (20), `6` (24), `8` (32), `10` (40), `12` (48)
- Use semantic spacing aliases for page/card/form/table

### Radius

- `sm`: controls (inputs, small buttons, badges)
- `md`: cards and panels
- `lg`: modals/drawers

### Elevation

- Level 0: flat surface
- Level 1: interactive cards/dropdowns
- Level 2: overlays/dialogs

### Color Usage

- Brand color for primary actions and key signal accents only
- Neutrals for structure, separators, and secondary controls
- Semantic colors for status and feedback; avoid ad hoc hexes

## Typography Hierarchy

- `h1`: page title
- `h2`: section title
- `h3`: card/subsection heading
- `body-sm`: helper/meta text
- `label-sm`: form labels and data labels

Enforce consistent line-height and tracking for headings and table headers.

## Primitive Standards

### Buttons

- Variants: primary, secondary, ghost, danger
- Standardize min height and horizontal padding per size
- Focus ring tokenized and visible on all backgrounds

### Cards

- One base card shell with optional density modifiers
- Standard heading/body/footer composition

### Inputs/Select/Textarea

- Uniform control heights and radius
- Clear invalid and focus states
- Label + helper + error structure standardized

### Tables

- Sticky header optional utility
- Density tokens (`comfortable`, `compact`)
- Row action strategy consistent across tables

### Badges/Alerts

- Semantic mapping:
  - success, warning, danger, neutral, info
- Ensure text/background contrast compliance

### Empty + Loading States

- Reusable empty-state and skeleton components
- Remove one-off empty card copy and layout drift

## Iconography Guidance

- Single icon set and stroke style
- Icons supplement text labels, not replace them for critical actions
- Icon-only buttons require accessible labels

## Implementation Constraints

- Keep current primitives API stable where possible
- No business logic in primitive layer
- No visual regressions that obscure status meaning

