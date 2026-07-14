# Phase 5 UX Standards

## Status

**Proposed**

## Objective

Deliver tenant and lease workflows using existing M.P.A. visual and interaction
standards without introducing parallel UI systems.

## UX Composition Rules

1. Reuse existing shell/layout patterns.
2. Reuse shared form primitives and table patterns.
3. Reuse existing empty/loading/error interaction model.
4. Avoid net-new visual patterns unless required by domain semantics.

## Tenant Surface Standards

### Tenant List

- Searchable, organization-scoped table.
- Status badges aligned with existing badge semantics.
- Row actions: view, edit, archive/restore as allowed by capability.

### Tenant Detail

- Clear identity block (name, email, phone).
- Emergency contact and notes sections.
- Lease association summary section (current + historical placeholders where data exists).

### Tenant Form

- Required and optional sections clearly separated.
- Inline validation with actionable messages.
- Save/cancel interaction consistent with existing forms.

## Lease Surface Standards

### Lease List

- Filter by status.
- Show property/unit/tenant, dates, rent, status.
- Include expiration visibility for operational scanning.

### Lease Detail

- Contract period block.
- Financial terms block.
- Linked unit and tenant references.
- Status timeline context for operators.

### Lease Form

- Property and unit selectors constrained by organization context.
- Tenant selector constrained by organization context.
- Date and currency validation before submission.

## Dashboard UX Extension Rules

- Extend existing dashboard cards; do not redesign card system.
- Keep typography, spacing, and interaction density aligned with Phase 4.
- Add metrics only where existing card architecture supports them.

## Accessibility Requirements

- Keyboard navigation across all forms/tables/actions.
- Focus visibility and logical tab order.
- Semantic labels for all controls.
- Touch target and contrast compliance with existing standards.

## Non-Goals

- New global navigation taxonomy.
- New design language tokens.
- Placeholder buttons or non-operational controls.
