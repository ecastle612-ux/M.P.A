# BUG-010 — Complete Stripe Checkout & Automated Customer Onboarding

| Field | Value |
|-------|--------|
| Status | **FAIL (final verify)** — Production tip still 503; PR #65 must merge+deploy (price defaults + cleanup) |
| Scope | COM-002 Slice C–E + Product Constitution (ADR-019) |
| Branch | `cursor/bug-010-stripe-checkout-onboarding-cf8a` |
| Products (customer) | Property Manager · Facility Operations · Complete Platform |
| Enterprise | Sales motion only — not a product / not a pricing tier |

## Binding commercial flow

```
Landing → Choose Product → Choose Monthly / Annual → Confirm Plan → Stripe Checkout
→ Create Account → Guided Setup → Mission Control
```

## Documents

| Report | Path |
|--------|------|
| BUG-010.1 Config Recovery (diagnosis) | [bug-010-1-production-config-recovery.md](./bug-010-1-production-config-recovery.md) |
| BUG-010 Report | [bug-010-report.md](./bug-010-report.md) |
| Stripe Verification | [stripe-verification.md](./stripe-verification.md) |
| Checkout Verification | [checkout-verification.md](./checkout-verification.md) |
| Provisioning Verification | [provisioning-verification.md](./provisioning-verification.md) |
| Regression Report | [regression-report.md](./regression-report.md) |
| Production Readiness | [production-readiness.md](./production-readiness.md) |
| Price Mapping | [price-mapping.md](./price-mapping.md) |

## Success criteria (PASS only if all true)

A brand-new customer can:

1. Choose Property Manager  
2. Select Monthly or Annual billing  
3. Complete a real Stripe Checkout  
4. Automatically provision an organization  
5. Create an account after payment  
6. Verify email  
7. Complete Guided Setup  
8. Reach Mission Control  
9. Appear correctly in Master Admin  

## Current blocker

Production `POST /api/commerce/checkout` still returns **503** `saas_checkout_not_configured` on deployment `dpl_8fzmKBqmDhumLWieQcaW8QapwAMz` (`main` @ `cd9a9fb`). Secret key is live; price IDs are not available to the running process.

See [final-verification.md](./final-verification.md). Fix ships in PR #65 (live price defaults + readiness gate). Merge + deploy, then re-run E2E with promo `BUG010E2E`.
