# UX & Interaction Standards

## Status

**Accepted and implemented**

## Purpose

Set production-grade interaction standards for Phase 4 so the application feels
intentional, trustworthy, and enterprise-ready.

## Visual Identity Standards (Phase 4 Surface)

- Brand palette application:
  - Primary Navy `#102B4E`
  - Emerald `#1FA971`
  - Background `#F8FAFC`
  - Surface `#FFFFFF`
  - Text `#1B2430`
  - Muted `#6B7280`
  - Borders `#E5E7EB`
- Typography baseline: Inter across product surfaces.
- No temporary branding artifacts in production surfaces.

## Form Interaction Standards

All forms must provide:

- Inline validation with clear, field-level messaging
- Deterministic loading states
- Recoverable error states with user-action guidance
- Positive success confirmation without blocking modals
- Unsaved-change protection where edits are long-lived
- Keyboard-first interaction support

## Empty, Loading, and Error State Standards

### Empty States

- Must explain the value of the next action.
- Must provide direct CTA to resolve emptiness.
- Must preserve page structure and orientation.

### Loading States

- Use skeletons/placeholders aligned to final layout shape.
- Avoid layout shifts during hydration.

### Error States

- No raw stack traces shown to users.
- Distinguish validation errors, permission errors, and transient system errors.
- Provide retry or fallback paths.

## Feedback Standards

- Replace browser alerts with designed feedback components.
- Toasts/banners must be non-blocking and meaningful.
- Long-running actions require progress affordances.

## Accessibility Standards

- WCAG-focused color contrast and focus visibility.
- Semantic landmarks on every major page.
- Accessible names for controls and icon-only actions.
- Screen-reader compatible status updates for async actions.

## Responsive Standards

- Desktop-first operations layout with mobile functional parity.
- Tables/grids must have responsive alternatives.
- Critical actions must remain reachable on small viewports.

## Quality Bar

Interactions must feel consistent with enterprise PM platforms:

- predictable
- low-friction
- low-cognitive-load
- no dead controls
- no ambiguous system state
