# 11 — Edge Cases

**Package:** COM-001  
**Status:** Draft — Awaiting Approval

---

## Pre-customer

| Case | Expected |
|------|----------|
| Demo org confused with customer org | Forbidden; demo never becomes production via rename alone |
| Prospect demands login before pay | Offer trial SKU via Checkout only — still COM-001 Payment Successful |
| Duplicate leads same company | Merge in CRM; one commercial opportunity |
| Founder grant without Stripe | Master Admin audited activation still required; BILL-001 records grant |

## Purchase / provision

| Case | Expected |
|------|----------|
| Double webhook Payment Successful | Idempotent; one org |
| Payment success, provision fails | Ops queue; subscription exists; no silent Active Customer |
| Buyer email typo | Fix contact pre-welcome or resend via support; username unchanged after issue |
| Sales creates users pre-go-live | Only Org Admin may invite after provision; Sales must not |

## Implementation

| Case | Expected |
|------|----------|
| Chooses AI then stalls | CS alert; offer Professional convert |
| Professional specialist overstays | Access auto-expires; audit |
| Finish Setup without recovery contact | Blocked (AUTH-001) |

## Billing

| Case | Expected |
|------|----------|
| Past Due but Org Admin locked out | AUTH recovery (Master Admin) + Billing restore |
| Chargeback after Active | Suspend review; Finance + CS |
| Refund but customer still using | Cancel/Suspend enforced |

## Success / renew

| Case | Expected |
|------|----------|
| High usage + Past Due | Billing priority over expansion |
| Multi-org principal renews one org | Renewal scoped to that org’s subscription |
| Inactive but paid | CS inactive alert; do not auto-cancel without policy |

## Cancel / reactivate

| Case | Expected |
|------|----------|
| Cancel request from non-Org Admin | Reject; Org Admin or contracting authority only |
| Win-back after Archive | New organization lifecycle |
| Two Checkout purchases same buyer | BILL-001 one-subscription invariant; second blocked or new org only if intentional second workspace |

## Design defaults

See [15 — Open questions](./15-open-questions.md) for unresolved commercial policy numbers (SLAs, grace days, retention days).
