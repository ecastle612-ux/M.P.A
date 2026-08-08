# M.P.A. Product Constitution

**Status:** Binding — Product Owner approved  
**Established:** 2026-08-08  
**ADR:** [ADR-019](../18-decision-log/adr-019-product-constitution.md)

---

## Products

| Product | Status |
|---------|--------|
| Property Manager | ✓ Commercial product |
| Facility Operations | ✓ Commercial product |
| Complete Platform | ✓ Commercial product |

Capital Projects are **not** a commercial product.

---

## Enterprise

| Rule | Binding |
|------|---------|
| Sales motion only | ✓ |
| Not a product | ✓ |
| Not a pricing tier | ✓ |

Enterprise is an optional purchasing / onboarding path for organizations that need custom contracts, SSO, integrations, or dedicated onboarding. It must never replace a platform product in navigation, pricing, or Confirm Plan.

---

## Commercial Flow

```
Landing
  ↓
Choose Product
  ↓
Choose Monthly / Annual
  ↓
Stripe Checkout
  ↓
Create Account
  ↓
Guided Setup
  ↓
Mission Control
```

This sequence is the authoritative customer commercial path.

---

## Project Rule

**No agent may alter this flow without explicit Product Owner approval.**

Altering includes:

- Introducing SaaS tiers (Professional, Business, Starter, Pro, Teams, etc.) as customer-facing plans
- Presenting Enterprise as a product or pricing tier
- Replacing Choose Product → Monthly/Annual → Stripe with an Enterprise-first funnel for Facility Operations or Complete Platform
- Changing payment-before-account / Guided Setup / Mission Control order without Product Owner approval

Material changes require Design → Document → Approve (Implementation Gate) **and** explicit Product Owner approval of an amendment to this Constitution.

---

## Related

- [Implementation Gate](./implementation-gate.md)
- [ADR-015 — Three Commercial Products](../18-decision-log/adr-015-three-commercial-products-master-admin.md)
- [ADR-018 — COM-002](../18-decision-log/adr-018-self-service-commercial-platform.md) (amended by ADR-019 on tiers / Enterprise presentation)
- [ADR-019 — Product Constitution](../18-decision-log/adr-019-product-constitution.md)
- [BUG-006 — Restore Commercial Experience](../47-bug-006-restore-commercial-experience/index.md)
