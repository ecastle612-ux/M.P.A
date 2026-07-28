# ADR-025: Tokenized Vendor Work-Order Access (No Login)

## Status
Accepted

## Date
2026-07-22

## Context
Vendors need to start and finish jobs from a phone camera QR scan without installing an app or creating an account. An authenticated Vendor Portal previously required login and blocked the “seconds to productive” experience; that portal has since been **retired** (product correction 2026-07-26). Property QR tokens (`building_qr_codes`) are for resident enrollment, not work orders.

## Decision
Introduce **capability tokens** scoped to a single maintenance work order. QR codes and share links resolve to a public browser surface that can Start Job and Finish Job after token verification. Account creation is **not** required before work. Payment profile collection is deferred until first invoice (Phase B) and never stores raw banking secrets in M.P.A.

**Arrival verification (Phase A):** Start Job always records a timestamp; GPS is recorded only when the vendor grants permission and never blocks Start.

**Amendment (2026-07-26):** Tokenized `/v/[token]` access is the **sole** vendor participation plane. The authenticated Vendor Portal (`/portal/vendor`) is retired. Vendors are not M.P.A. signed-in users. ADR-004 marketplace identity remains a separate long-term domain and does not restore a Vendor Portal.

## Consequences
**Easier:** Field vendors become productive immediately; PM share path is one QR.  
**More difficult:** Token security, revocation, and abuse controls must be first-class; status/audit must stay consistent with PM work-order state.

## Alternatives Considered
- **Require vendor login before Start:** Rejected — fails zero-friction objective.  
- **Reuse building QR enrollment tokens:** Rejected — wrong trust domain and lifecycle.  
- **SMS OTP every scan:** Deferred — optional hardening later; not Phase A default.
- **Require GPS for Start:** Rejected — must not block vendors who deny location.
