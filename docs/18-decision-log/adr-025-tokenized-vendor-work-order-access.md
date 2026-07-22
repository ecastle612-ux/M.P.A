# ADR-025: Tokenized Vendor Work-Order Access (No Login)

## Status
Accepted

## Date
2026-07-22

## Context
Vendors need to start and finish jobs from a phone camera QR scan without installing an app or creating an account. The existing `/portal/vendor` path requires authentication and blocks the “seconds to productive” experience. Property QR tokens (`building_qr_codes`) are for resident enrollment, not work orders.

## Decision
Introduce **capability tokens** scoped to a single maintenance work order. QR codes and share links resolve to a public browser surface that can Start Job and Finish Job after token verification. Account creation is **not** required before work. Payment profile collection is deferred until first invoice (Phase B) and never stores raw banking secrets in M.P.A.

**Arrival verification (Phase A):** Start Job always records a timestamp; GPS is recorded only when the vendor grants permission and never blocks Start.

This access plane is **additive** to authenticated vendor portal access (ADR-004 marketplace remains the long-term vendor identity domain).

## Consequences
**Easier:** Field vendors become productive immediately; PM share path is one QR.  
**More difficult:** Token security, revocation, and abuse controls must be first-class; status/audit must stay consistent with PM work-order state.

## Alternatives Considered
- **Require vendor login before Start:** Rejected — fails zero-friction objective.  
- **Reuse building QR enrollment tokens:** Rejected — wrong trust domain and lifecycle.  
- **SMS OTP every scan:** Deferred — optional hardening later; not Phase A default.
- **Require GPS for Start:** Rejected — must not block vendors who deny location.
