# ADR-022: Master Admin Command Center as Post-Stabilization Control Plane

## Status

Proposed

## Date

2026-08-11

## Context

Production Stabilization is complete on main (`bcc2455eca688b7048c743bb115599fbc817894d`). Sprint 5 delivered durable observability (`platform_error_events`) and a target architecture note for Master Admin Command Center surfaces, but Master Admin is not yet the full operational control plane.

Earlier packages define pieces of the mandate:

- ADR-015 — three commercial products + Master Admin OS  
- Package 24 — Master Admin capability map  
- Package 52 — Phase 4 Master Admin reports  
- Package 61 — Owner Operations Console (live simplified nav)  
- Package 28 — Command Center target architecture (Sprint 5 foundation)

Operators still lack a single, complete blueprint for fleet inspect surfaces (organizations, users, subscriptions, Stripe linkage, units/capacity, checkout/provisioning, webhooks, errors, operations, audit, system health), the Organization Detail diagnostic spine, permissions/mutation matrices, and gated implementation slices.

Without an approved blueprint, implementation risks include: building a vanity dashboard, duplicating logging/commercial/unit systems, over-broad admin bypasses, and unauthorized Production changes.

## Decision

1. Adopt **docs/70-master-admin-command-center/** as the authoritative product + implementation blueprint for Master Admin Command Center after Production Stabilization.  
2. Master Admin is the platform **control, observability, diagnostic, and administrative center** — not a reporting dashboard and not a customer product.  
3. **Reuse existing systems**; do not create parallel org/subscription/unit/WO/notification/webhook/error stores. Consume Sprint 5 observability.  
4. Enforce **explicit RBAC + capabilities + audit + org scope validation** for all mutations; no broad admin bypass.  
5. Implement only via **authorized slices** in the blueprint after this ADR is Accepted.  
6. Documentation-only until approval — no code, migrations, Stripe, Vercel, or Production deploy in the blueprint turn.

## Consequences

### Becomes easier

- Clear sequencing from inspect surfaces → governed mutations  
- Shared Organization Detail diagnostic model for support  
- Security and audit expectations defined before code  
- Reduced risk of duplicate platforms  

### Becomes harder / constrained

- Cannot “just build” admin panels without slice authorization  
- Some desired mutations (manual capacity, webhook replay) are deferred pending PO answers  
- Nav may need a migration plan from live Owner Ops IA  

## Alternatives considered

| Alternative | Why rejected |
|-------------|--------------|
| Treat package 61 Owner Ops as complete Command Center | Missing units/capacity, webhook health, unified audit, full org diagnostic spine, capability matrices |
| Build a new admin data platform / warehouse first | Violates reuse mandate; delays operational value |
| Expand customer Mission Control for operators | Wrong trust boundary; conflates tenant UX with fleet control |
| Implement immediately without ADR | Violates Implementation Gate (ADR-012) |

## References

- `docs/70-master-admin-command-center/index.md`  
- `docs/28-production-stabilization/master-admin-command-center-architecture.md`  
- `docs/24-product-architecture/master-admin-capability-map.md`  
- ADR-012, ADR-015, ADR-019, ADR-021  
