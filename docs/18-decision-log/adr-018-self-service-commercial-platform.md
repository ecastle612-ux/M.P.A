# ADR-018: Self-Service Commercial Platform (COM-002)

## Status

Proposed

## Date

2026-08-07

## Context

M.P.A. currently sells three commercial products (ADR-015) with a public Confirm Plan funnel (BUG-003/004) but **white-glove** SaaS payment and often manual activation for Facility Operations / Complete Platform. That model cannot scale to thousands of organizations and conflicts with the goal of operating as an enterprise SaaS platform.

FIN-OPS-001 (ADR-016) already uses Stripe for **resident rent collection**. SaaS plan billing must not be conflated with that money domain.

Capital Projects remain deferred.

## Decision

Adopt **COM-002** ([docs/37-com-002-self-service-commercial](../37-com-002-self-service-commercial/index.md)) as the authoritative commercial blueprint:

1. Preserve three commercial products (Property Manager, Facility Operations, Complete Platform).  
2. Introduce plan tiers: **Professional** and **Business** (self-service) and **Enterprise** (high-touch).  
3. Professional / Business: Product → Plan → Billing cycle → Stripe Checkout → automatic org provisioning → module activation → Guided Setup → Mission Control — **no employee interaction**.  
4. Provide isolated **Live Demo** experiences (no account, no payment, auto-reset) per product, with conversion into paid Checkout.  
5. Enterprise: Request → consultation → sales → proposal → contract → implementation → production (operator-gated).  
6. Keep SaaS Stripe Billing strictly separated from FIN-OPS resident Stripe.  
7. Implement only after **APPROVE COM-002**, **Accept ADR-018**, and per-slice authorize (Slices A–G).

## Consequences

### Becomes easier

- Scalable customer acquisition without manual provisioning for Pro/Business.  
- Clear Enterprise premium motion.  
- Predictable commerce lifecycle (upgrade, cancel, past_due).  
- Demo-led conversion comparable to modern SaaS.

### Becomes harder / constrained

- Requires robust webhook idempotency and reconciliation.  
- Dual Stripe domains must stay disciplined.  
- Interim Confirm Plan path must be carefully retired after certification.  
- Pricing, seat, and property limits must be decided at Approve (open decisions in COM-002 risk assessment).

## Alternatives Considered

| Alternative | Why rejected |
|-------------|--------------|
| Keep white-glove forever | Does not scale; blocks SaaS positioning |
| Account-first then pay only | Higher abandoned orgs; package prefers pay/trial-first bind |
| Single plan tier (no Pro/Business) | Insufficient packaging for SMB vs mid-market |
| Enterprise on public Checkout | Undermines high-touch security/commercial review |
| Merge SaaS billing into FIN-OPS Stripe code | Violates ADR-016 boundary; high regression risk |

## References

- [COM-002 Design Package](../37-com-002-self-service-commercial/index.md)  
- [ADR-015](./adr-015-three-commercial-products-master-admin.md)  
- [ADR-016](./adr-016-financial-operations-operational-finance.md)  
- [ADR-012](./adr-012-design-document-approve-implement.md)  
