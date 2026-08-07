# ADR-018: Self-Service Commercial Platform (COM-002)

## Status

Proposed  
*(Amendments A1–A7 incorporated into COM-002 Draft — ready for Accept upon APPROVE COM-002)*

## Date

2026-08-07  
**Amended:** 2026-08-07

## Context

M.P.A. currently sells three commercial products (ADR-015) with a public Confirm Plan funnel (BUG-003/004) but **white-glove** SaaS payment. That model cannot scale. Architecture review required amendments for honesty, identity bind, demo scale, lifecycle completeness, provisioning reliability, Enterprise separation, and binding defaults.

FIN-OPS-001 (ADR-016) uses Stripe for resident rent — must stay separate from SaaS billing.

Capital Projects remain deferred. Facility Operations operational depth is not FO-READY for self-serve.

## Decision

Adopt **COM-002** ([docs/37-com-002-self-service-commercial](../37-com-002-self-service-commercial/index.md)) as the authoritative commercial blueprint, including amendment package A1–A7:

1. Preserve three commercial products (ADR-015).  
2. Plan tiers: Professional & Business (self-service) and Enterprise (high-touch only).  
3. **Self-serve Checkout v1:** Property Manager × Professional/Business only.  
4. **FO / Complete:** Enterprise path until **FO-READY**; then optional future self-serve.  
5. Sequence: Checkout → checkpointed provision → **email-verified** account bind → Guided Setup → Mission Control.  
6. **No self-serve trials** — Live Demo is try-before-buy.  
7. Live Demo: shared snapshot + session overlay; separate demo DB/project (no full clones).  
8. Enterprise forks **before** Checkout; Checkout API rejects Enterprise/FO/Complete offers pre–FO-READY.  
9. Binding defaults: seats Pro 5 / Business 25; properties Pro 25 / Business 150; 7-day past-due grace; pay-then-verify.  
10. Dedicated SaaS Stripe webhook endpoint vs FIN-OPS.  
11. Implement only after **APPROVE COM-002**, **Accept ADR-018**, and per-slice authorize (A–G).

## Consequences

### Becomes easier

- Honest, scalable PM self-serve acquisition.  
- Clear Enterprise motion without Checkout accidents.  
- Safer identity and provisioning.  
- Demo that can survive traffic.

### Becomes harder / constrained

- FO/Complete revenue remains high-touch until FO-READY.  
- Dual Stripe endpoints and checkpoint ops discipline required.  
- Confirm Plan cutover must be managed at Slice G.

## Alternatives Considered

| Alternative | Why rejected |
|-------------|--------------|
| Keep white-glove forever | Does not scale |
| Self-serve FO/Complete immediately | Commercial oversell vs FO depth |
| Account-before-pay default | More abandoned half-orgs |
| Self-serve card trials | Abuse + complexity; Demo suffices |
| Full per-session demo DB clones | Does not scale |
| Enterprise on public Checkout | Breaks high-touch motion |
| Shared FIN-OPS/SaaS webhook handler | Cross-talk risk |

## References

- [COM-002](../37-com-002-self-service-commercial/index.md)  
- [Amendment Package](../37-com-002-self-service-commercial/amendment-package.md)  
- [Architecture Review](../38-com-002-architecture-review/index.md)  
- [ADR-015](./adr-015-three-commercial-products-master-admin.md)  
- [ADR-016](./adr-016-financial-operations-operational-finance.md)  
- [ADR-012](./adr-012-design-document-approve-implement.md)  
