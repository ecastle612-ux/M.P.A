# ADR-037: App-Wide Simplicity and Navigation Efficiency

## Status
Proposed

## Date
2026-08-18

## Context

M.P.A. spans public commercial flows, Guided Setup, PM, FO (including certified Request Forms + public `/request` portal from ADR-034 / docs/204–206), Complete scoped members, tenant portal, and Master Admin. Users lose time in sidebars, duplicate entry, and module hunting. FO efficiency (docs/207) must not be built into deep navigation.

A prior draft incorrectly claimed ADR-035 and docs/189 for this topic against stale `main`. **docs/189 remains tenant Stripe certification. ADR-034 remains public-request intake.** This ADR uses the next free number after ADR-034 on the certified line.

Authoritative audit: [docs/208](../208-mpa-app-wide-simplicity-navigation-audit/index.md). Companion: [docs/207](../207-fo-operational-efficiency/index.md), [ADR-036](./adr-036-fo-operational-efficiency-system.md).

## Decision

1. Authorize **SIM-001** as cross-product efficiency architecture (not a product/tier): fewer clicks, less duplicate entry, clearer next actions, role-appropriate homes — preserving Canopy.

2. Role-specific homes (technician → My Work; managers → attention Mission Control; tenant → balance/pay; Complete → ADR-033).

3. Mission Control = “what needs my attention?” including **new public facility requests**, with deep links.

4. After Approve: Global Search, Quick Create, contextual actions, Recent, Saved views (optional Favorites) — all server-side RBAC filtered. Search must include FR numbers and intake-origin work orders.

5. Prefill over re-entry; never treat prefill as authorization. Preserve docs/204 locked QR context as the duplicate-entry gold standard.

6. Notifications deep-link to records (including `work_order.public_submitted`).

7. Do not reorder commercial checkout flow; do not change Stripe/pricing; do not authorize a cosmetic redesign.

8. Implementation requires docs/208 Approved and this ADR Accepted, then sequenced slices — not a big-bang rewrite.

## Consequences

**Easier:** See → act → complete; FO-EFF features land discoverably; public intake stays simple.

**More difficult:** Search authz and Complete scope tests; attention queues must stay honest; click reduction must not weaken payment/security confirms.

## Alternatives Considered

- **Cosmetic redesign:** Rejected.  
- **Client-only search filtering:** Rejected.  
- **Ignore certified request surfaces in the audit:** Rejected — Owner required coverage.  
- **Reuse ADR-034/035 numbers:** Rejected — collisions with Accepted public intake / void drafts.  
- **Implement before Approve:** Rejected — ADR-012.
