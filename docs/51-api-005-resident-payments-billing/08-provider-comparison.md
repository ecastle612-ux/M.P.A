# 08 — Provider Comparison

**Package:** API-005  
**Status:** Draft — Ready for Approval

---

## Recommendation

**Phase 1 primary provider: Stripe.**

| Criterion | Stripe | Notes |
|-----------|--------|-------|
| Cards + wallets | Strong | Payment Element |
| ACH | Good | Improving; Plaid remains specialist option |
| Webhooks / idempotency | Mature | Matches M.P.A. ingress pattern |
| Connect / multi-party | Strong | Future owner/vendor payouts |
| Sandbox | Excellent | CI/dev |
| PM market familiarity | High | INT-101 already names Stripe |
| PCI tools | Strong | Elements reduces scope |

---

## Comparison matrix

| Capability | Stripe | Plaid ACH | Finix | Dwolla | Authorize.net |
|------------|--------|-----------|-------|-------|---------------|
| Cards | ✔ | — | ✔ | — | ✔ |
| ACH | ✔ | ✔✔ | ✔ | ✔✔ | △ |
| Bank verify | △ / FC | ✔✔ | △ | △ | — |
| Webhooks | ✔ | ✔ | ✔ | ✔ | ✔ |
| Connect/marketplace | ✔✔ | — | ✔ | △ | — |
| Legacy PM preference | Mid | Low | Mid | Low | High |
| Phase 1 fit | **Primary** | Future ACH specialist | Future | Future | Future |

Scores are directional for product design, not procurement.

---

## Why not Plaid-first?

Plaid excels at bank auth/ACH identity but is not a full card acquiring stack. Stripe covers Phase 1 card + ACH enough to ship resident portal; Plaid plugs in as INT-102/103 specialist without redesigning `PaymentProvider`.

---

## Adapter roadmap

1. `noop`  
2. `stripe` (Phase 1)  
3. `plaid_ach`  
4. `finix` / `dwolla` / `authorizenet` as demand appears  

**No provider failover mesh in Phase 1.**
