# ADR-015: Three Commercial Products + Master Admin OS

## Status
Accepted

## Date
2026-08-06

## Context

Blueprint docs and foundation code treat M.P.A. as a single Property Manager operating system. Commercially, M.P.A. is sold as three offerings — Property Manager, Facility Operations, and Complete Platform — with Master Admin as an internal operator OS. Maintenance (PM) and Facility Operations are not the same product. Continuing CORE-004, LAUNCH-001, or Financial Operations implementation without resetting product architecture would deepen drift.

## Decision

1. Adopt the commercial model documented in `docs/24-product-architecture/` as the authoritative product packaging.
2. Categorize every capability as Property Manager, Facility Operations, Shared Platform, Master Admin, or Unknown.
3. Enforce one capability → one workflow → one home for Complete Platform composition.
4. Introduce subscription + entitlement layers distinct from role permissions.
5. Stop CORE-004, LAUNCH-001, and Financial Operations implementation until this ADR is Accepted and dependent designs are Approved.
6. Treat Master Admin as a mandatory operator OS that exposes every platform capability — not a customer SKU.

## Consequences

**Easier:** Clear SKU boundaries; honest nav/billing; Facility can be designed as a peer; launch clarity for Customer #1; entitlement fail-closed.

**More difficult:** Existing Vision/Roadmap/Workflow docs must be reconciled; work-order domain needs product context; more authz layers (SKU → entitlement → permission); Facility is a full product design program, not a module bolt-on.

## Alternatives Considered

- **Keep single PM product; Facility as Maintenance add-on:** Rejected — contradicts commercial packaging and conflates products.
- **Sell modules à la carte without product SKUs:** Rejected — unclear ownership and navigation; weak launch story.
- **Implement first, document packaging later:** Rejected — violates ADR-012 Implementation Gate and caused the present drift.
