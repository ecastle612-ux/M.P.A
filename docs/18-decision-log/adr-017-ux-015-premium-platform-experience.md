# ADR-017: UX-015 Premium Platform Experience (Phase 1)

## Status

Proposed

> **Not approved. No application/UI/schema/routing/API/governance code may be
> written against this ADR until it is `Accepted` and the associated design
> package is `Approved`, per the
> [Implementation Gate](../00-governance/implementation-gate.md) and
> [ADR-012](./adr-012-design-document-approve-implement.md).**

## Date

2026-08-05

## Context

Phase 3 Identity Foundation is complete on `main` (ADR-014). Four portal shells,
authentication, organization context, and RBAC foundation exist, but foundation
UI craftsmanship is still uneven relative to the approved Canopy and Experience
Architecture quality bar.

UX-015 asks for a Phase 1 premium visual/UX refinement of existing foundation
surfaces — comparable in craft to Linear, Stripe, Ramp, Notion, Arc, and Apple
first-party apps — while explicitly forbidding business-logic, routing, API, and
governance changes.

Canopy (ADR-011) and Experience Architecture (ADR-013) are already approved.
This ADR does **not** replace them. It authorizes a bounded craftsmanship pass
that applies those approved systems more consistently.

## Decision

When Accepted:

1. Approve UX-015 Phase 1 as a **visual and interaction polish program** for
   existing foundation surfaces only.
2. Bind implementation to
   [`docs/25-ux-015-premium-platform-experience/`](../25-ux-015-premium-platform-experience/index.md).
3. Preserve Canopy tokens, typography, logo/wordmark, and accessibility baseline.
4. Allow spacing/hierarchy/elevation/radius/shadow/motion/responsiveness
   refinements that stay inside approved Canopy catalogs.
5. Forbid new features, workflows, routes, APIs, schema changes, and governance
   policy edits as part of UX-015 Phase 1.
6. Require the verification deliverables in the design package (before/after,
   component/screen lists, a11y, performance, remaining opportunities).

## Consequences

**Easier:** Foundation UI reaches a coherent premium baseline before business
modules arrive; less aesthetic debt for later workflow screens.

**More difficult:** Requires discipline to polish without inventing a second
design language or sneaking in product scope; approval gate adds a step before
coding.

## Alternatives Considered

- **Implement immediately from the chat brief:** Rejected — chat is not
  documentation; violates ADR-012 / Implementation Gate.
- **Replace Canopy with a blue/gray enterprise skin:** Rejected — Canopy green +
  ink + mist is the approved brand system (ADR-011).
- **Treat as tiny untracked CSS tweaks with no ADR:** Rejected — UX-015 is a
  named cross-surface program with motion/state standardization; it needs an
  explicit approved scope boundary.
- **Delay all polish until business modules ship:** Rejected — foundation shells
  are already user-facing; craftsmanship debt would multiply across portals.

## Implementation Notes (After Acceptance Only)

- Touch `packages/ui` primitives and `apps/web` shell/auth/portal presentation.
- Do not modify business logic, routing tables, API handlers, or governance docs
  as part of this initiative.
- PRs must cite this ADR and the Approved UX-015 package.
- Material scope expansion restarts Design → Document → Approve.
