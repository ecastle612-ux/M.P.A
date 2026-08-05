# 25 — UX-015 Premium Platform Experience (Phase 1)

## Status

**Approved**

Implementation authorized for Phase 1 visual and interaction polish only.
Governing decision: [ADR-017](../18-decision-log/adr-017-ux-015-premium-platform-experience.md) (Accepted).

## Purpose

Raise the craftsmanship of the existing M.P.A. foundation so the product feels
comparable to modern enterprise platforms (Linear, Stripe, Ramp, Notion, Arc,
Apple first-party apps) **without changing workflows, architecture, APIs, routing,
or governance**.

This is a visual and interaction refinement of surfaces that already exist after
Phase 3 Identity Foundation. It is **not** a redesign of Canopy, Experience
Architecture, or product scope.

## Binding Constraints

| Must preserve | Must not change |
|---------------|-----------------|
| Official M.P.A. logo / wordmark | Business logic |
| Approved Canopy brand colors (Canopy green `#0F6B56`, ink, mist grays) | Routing |
| Existing typography system (Satoshi + IBM Plex) | APIs / Edge contracts |
| Existing design tokens (extend only if gap is documented + approved) | Governance / Implementation Gate |
| Accessibility baseline (WCAG AA) | Schemas / RLS policies |
| Existing workflows and copy intent | New features or workflows |

**Brand note:** Canopy’s approved accent is forest-teal / Canopy green with cool gray
neutrals — not generic SaaS blue. Phase 1 polish must not introduce a blue brand
palette.

## Phase 1 Scope (Foundation Surfaces Only)

Priority polish targets:

1. Auth entry experience (login as branded landing entry; `/` redirect unchanged)
2. Auth surfaces (signup mode, forgot/reset password, accept invitation)
3. Portal selection / role portal entry shells
4. Workspace loading
5. Global navigation, sidebar, top navigation
6. Dashboard shell
7. Empty, loading, error, and skeleton states
8. Toasts, dialogs/modals
9. Shared primitives: cards, buttons, inputs, tables, search
10. Settings / profile layout
11. Mobile / PWA first-class responsiveness

**Explicitly out of scope for Phase 1**

- New marketing landing route (current `/` redirects; no routing changes)
- New business modules (properties, leases, maintenance, payments, documents, messaging)
- Token system replacement or new design language
- Architecture, routing, API, or governance changes
- Dark mode productization beyond existing token placeholders

## Documents

| Document | Purpose |
|----------|---------|
| [Craftsmanship Standard](./craftsmanship-standard.md) | What “premium” means inside Canopy |
| [Phase 1 Scope Matrix](./phase-1-scope.md) | Screens and components in/out of scope |
| [Component Audit Checklist](./component-audit-checklist.md) | Standardization pass for shared UI |
| [Motion and State Patterns](./motion-and-states.md) | Allowed motion and state treatments |
| [Verification Plan](./verification-plan.md) | A11y, performance, before/after deliverables |

## Related Approved Foundations

- [06 Design Language — Canopy](../06-design-language/index.md) (Approved v1.0)
- [07 UX Principles](../07-ux-principles/index.md)
- [12 Component Standards](../12-component-standards/index.md)
- [21 Experience Architecture](../21-experience-architecture/index.md) (Approved v1.0)
- [23 Phase 3 Identity Foundation](../23-phase-3-identity-foundation/index.md) (Accepted and implemented)
- [ADR-011](../18-decision-log/adr-011-canopy-design-system.md), [ADR-013](../18-decision-log/adr-013-experience-architecture-before-ui.md), [ADR-014](../18-decision-log/adr-014-phase-3-identity-multitenant-foundation.md)

## Gate Condition

| Stage | Status |
|-------|--------|
| Design | Complete |
| Document | Complete |
| Approve | **Approved** (2026-08-05) |
| Implement | Authorized for Phase 1 scope |
