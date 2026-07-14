# 30.08 — Accessibility Standards

## Status

**Proposed (awaiting implementation approval)**

## Objective

Harden accessibility behavior across existing Phase 1-4 surfaces while preserving
all current product functionality.

## Accessibility Baseline Targets

- WCAG 2.2 AA for core product surfaces
- Keyboard complete for all primary workflows
- Screen-reader comprehensible structure and status feedback

## Audit Focus Areas

1. Contrast
2. Focus states
3. Semantic landmarks
4. ARIA correctness
5. Keyboard navigation
6. Touch target sizing

## Standards

### Contrast

- Ensure text/background combinations meet AA contrast.
- Badge/status combinations must remain legible in all states.
- Do not rely on color alone for meaning.

### Focus

- Strong visible focus ring on every interactive control.
- No hidden focus indicators on custom button/link patterns.
- Logical tab order through all forms, nav, dialogs, and menus.

### Semantics

- One primary `main` landmark per page.
- Structural headings in descending order.
- Interactive collections use correct list/table semantics.

### ARIA

- Use ARIA only when native semantics are insufficient.
- `aria-expanded`, `aria-controls`, and labeling must stay synchronized.
- Active nav destination should expose `aria-current`.

### Keyboard Navigation

- Command palette fully keyboard-operable.
- Navigation menu and notification popover support ESC close.
- No keyboard traps outside intentional modal/dialog contexts.

### Touch Targets

- Minimum target size for critical controls on mobile/tablet.
- Adequate spacing between adjacent icon/ghost actions.

## Known Gaps from Current Audit

- Active-route semantics not consistently exposed in navigation links.
- Placeholder popovers/menus need stronger keyboard handling rigor.
- Dense table actions may need larger touch-friendly grouping on small screens.

## Remediation Checklist

- Add active-state semantics and visual parity.
- Standardize interactive trigger components.
- Validate keyboard-only pass on dashboard/properties/units/profile.
- Add accessibility regression checks to UX implementation reviews.

