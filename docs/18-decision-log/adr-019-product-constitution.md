# ADR-019: M.P.A. Product Constitution

## Status

Accepted

## Date

2026-08-08

## Context

ADR-015 established three commercial products. ADR-018 (COM-002) added self-service Stripe commerce but also introduced customer-facing Professional/Business tiers and routed Facility Operations / Complete Platform through Enterprise as a substitute path. BUG-006 restored the public experience toward the three-platform model. The Product Owner now records a permanent Product Constitution so agents cannot reintroduce conflicting commercial models.

## Decision

1. Accept [Product Constitution](../00-governance/product-constitution.md) as binding.
2. Commercial products are only: **Property Manager**, **Facility Operations**, **Complete Platform**.
3. **Enterprise** is a sales motion only — not a product, not a pricing tier.
4. Binding commercial flow:

   ```
   Landing → Choose Product → Choose Monthly / Annual → Stripe Checkout
   → Create Account → Guided Setup → Mission Control
   ```

5. No agent may alter this flow without explicit Product Owner approval.
6. Amend ADR-018 customer-facing packaging: Professional/Business must not be presented as customer plan choosers; Enterprise must not be presented as the product substitute for Facility Operations or Complete Platform. Stripe/provisioning internals may retain internal offer identifiers until a separate approved migration removes them.
7. Capital Projects remain excluded from commercial offers.

## Consequences

**Easier:** One permanent commercial truth for landing, pricing, Confirm Plan, and agent work.  
**Harder:** COM-002 docs and any remaining Pro/Business / Enterprise-as-SKU UI must stay aligned with the Constitution; FO/Complete Stripe price configuration remains an infrastructure concern separate from product identity.

## Alternatives Considered

- **Keep ADR-018 Professional/Business as customer tiers:** Rejected by Product Owner — not the agreed product model.
- **Treat Enterprise as a fourth product:** Rejected — Enterprise is sales motion only.
- **Chat-only rule without docs/ADR:** Rejected — violates Implementation Gate documentation standard.
