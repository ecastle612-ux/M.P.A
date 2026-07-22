# 13 — Risk Assessment

**Package:** BILL-001  
**Status:** Draft — Ready for Approval

| ID | Risk | Mitigation |
|----|------|------------|
| R1 | Mixing SaaS with rent Customers | Separate tables + code paths + webhook routes |
| R2 | Two active subscriptions per org | Partial unique + service guard |
| R3 | Entitlement bypass | Central `assertEntitled`; tests on create paths |
| R4 | Webhook confusion | Dedicated secret + endpoint |
| R5 | Founder abuse | Invite-only codes; Master Admin audit |
| R6 | Past_due lockout of ops | Grace + billing-only escape hatch |
| R7 | Same Stripe account blast radius | Product naming + optional dual-account later |
| R8 | Scope into Connect fees | Explicit non-goals; ADR-024 |

---

## Residual

Commercial PASS still requires Phase E certification with live/sandbox Stripe Billing — design approval ≠ production go-live.
