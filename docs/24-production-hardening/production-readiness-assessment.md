# Production Readiness Assessment (EP-008 Phase 1)

**Status:** Updated 2026-07-19 (post Phase 1 implementation)
**Parent:** [24 Production Hardening](./index.md) · [ADR-015](../18-decision-log/adr-015-production-hardening-operational-excellence.md)

Scores are directional readiness indicators (0–100) for expanded Design Partner usage.
This is a **phased program**; scores reflect only what is actually implemented and are
re-reported per approved increment. Commercial readiness remains bounded by unbuilt
business modules on the [roadmap](../17-development-roadmap/index.md).

---

## Scores

| Dimension | Before EP-008 | After Phase 1 | Rationale |
|---|---|---|---|
| **Design Partner Readiness** | 55 | **70** | Errors observable; auth abuse throttled + audited; security headers + reviewed session posture; documented recovery/deploy procedures. |
| **Production Readiness** | 50 | **68** | Fail-open error monitoring foundation, HSTS + CSP reporting, request-id correlation, resilient middleware, backup/deploy runbooks. Bounded by strict-CSP and cookie-fix follow-ups still open. |
| **Commercial Readiness** | 35 | **40** | Marginal — commercial readiness is gated by business modules (properties, maintenance, payments, reporting) that do not exist yet; hardening cannot substitute for missing product surface. |

> Numbers are qualitative assessments, not measured SLOs. They intentionally avoid
> over-claiming: much of EP-008 is Deferred, so large jumps would be inaccurate.

## What moved the needle (Phase 1, implemented)

- **Observability:** standard PII-scrubbed error envelope (`timestamp, organization, user,
  module, request_id, environment, severity`); global + browser-runtime + API capture;
  request-id propagation across middleware/routes.
- **Rate limiting:** per-IP fixed-window limits on app-owned auth endpoints; login-attempt
  outcomes audited + throttled.
- **Audit events:** append-only `recordAuditEvent()` foundation wired to
  `auth.login_succeeded/login_failed/logout/rate_limited` (log-sink backed; DB store Deferred).
- **Security:** HSTS added; CSP violation reporting; full headers/CSP/cookie/session review
  documented; middleware auth made fail-open.
- **Operations:** backup/recovery and deployment runbooks.

## What still limits readiness (Deferred / follow-up, gated)

- Strict nonce-based CSP (remove `'unsafe-eval'`, reduce `'unsafe-inline'`).
- Cookie storage-key alignment so browser sign-in is recognized server-side.
- Durable append-only audit **table** (separate DB design + RLS approval).
- Distributed rate-limit store; negative-path authz tests + dependency scan in CI.
- All module-specific hardening (webhooks, background jobs, reporting/facility/financial
  health, provider connectivity) — blocked until those modules exist.

## Recommendation

Phase 1 materially improves resilience and observability without regressions. The
highest-value next gated increments are the **cookie storage-key fix** and **strict CSP**,
followed by the **durable audit store**. Commercial readiness advances only as business
modules are delivered on the roadmap.
