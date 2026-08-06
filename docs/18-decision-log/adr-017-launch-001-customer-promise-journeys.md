# ADR-017: LAUNCH-001 Customer Promise Journeys

## Status
Accepted

## Date
2026-08-06

## Context

Commercial Experience Hardening clarified what customers buy. FIN-OPS-001 S0–S3 delivered an operational money loop. Neither made Property Manager launch-ready: advertised modules still could not be completed unaided.

LAUNCH-001 was reframed from engineering slices (L0–L6) to a **Customer Promise** roadmap with outcome journeys (J0–J8). The package was reviewed and approved.

## Decision

1. **LAUNCH-001 is Approved** as the governing launch program until Customer #1 completes onboarding and daily operations without assistance.
2. **Governing launch rule:** If we advertise it, a customer must be able to discover it, complete it, and understand it without friction.
3. **Customer Journey model** replaces implementation-driven sequencing for launch readiness.
4. **Journey-driven implementation** is authorized: no feature work may bypass an incomplete customer journey.
5. Journeys are authorized individually (`AUTHORIZE LAUNCH-001 JOURNEY Jn`). **J0** (Purchase → First Login / trusted home) is the first authorized journey.
6. FIN-OPS-001 remains paused after S3; Facility Operations feature work remains out of scope.

## Consequences

### Easier
- Launch sequencing follows customer outcomes, not module ownership charts.
- Incomplete journeys block premature feature work elsewhere.
- Master Admin certification has a clear Pass bar per journey.

### Harder
- Teams cannot “ship the module” without closing the journey script.
- Advertising a capability before its journey Pass is a governance failure.

## Alternatives Considered

1. **Resume engineering slices L0–L6** — Rejected; module order does not guarantee unaided customer completion.
2. **Finish FIN-OPS S4+ before onboarding** — Rejected; money loop alone does not make Property Manager launch-ready.
3. **Authorize all journeys at once** — Rejected; gate requires per-journey authorize → deliver → certify.

## Related

- [LAUNCH-001 package](../26-launch-001-onboarding/index.md)
- [Customer Journeys](../26-launch-001-onboarding/customer-journeys.md)
- [Launch Readiness Gate](../26-launch-001-onboarding/launch-readiness-gate.md)
- [ADR-012](./adr-012-design-document-approve-implement.md)
- [ADR-015](./adr-015-three-commercial-products-master-admin.md)
- [ADR-016](./adr-016-financial-operations-operational-finance.md)
