# ADR-021 — Production Stabilization Sprint 5

**Status:** Accepted (Product Owner Sprint 5 authorization)  
**Date:** 2026-08-11  
**Related:** ADR-012, ADR-015, ADR-019, ADR-020, `docs/28-production-stabilization/sprint-5-design.md`

## Context

Sprint 4 (STAB-004 FO + Complete) is merged and certified on `main`. Remaining stabilization gaps from the audit: observability (STAB-006), critical notifications (STAB-007), and smaller STAB-010–016 hygiene items. Master Admin must become an operational control center, but not all at once.

## Decision

Authorize Sprint 5 to:

1. Replace console-only production error handling with a real sink (structured logs + durable critical feed + optional Sentry).
2. Extend the existing maintenance notification path for critical work-order lifecycle events with honest email delivery status.
3. Defer automated screening (STAB-008); keep manual honesty.
4. Apply smallest production-grade fixes for STAB-010–016 as audited.
5. Establish Master Admin Command Center architecture and ship only the critical error feed slice.

## Consequences

- Local development remains unblocked without Sentry or Resend.
- Production configuration of Sentry/Resend is an operator step outside this sprint.
- Schema additions are additive (`platform_error_events`, notification delivery columns).
- Commercial pricing, Stripe, Production env, and `mpa-prod` are unchanged by this authorize.
