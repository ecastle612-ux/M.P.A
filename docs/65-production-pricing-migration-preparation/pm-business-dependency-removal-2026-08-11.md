# PM Business readiness dependency removal — 2026-08-11

**Status:** Implemented in application code (await Owner auth before Production deploy / Vercel env changes)  
**Constitution:** Unchanged (ADR-019)  
**Enterprise fee:** Not implemented (still sales motion only)

---

## Approved customer products

1. Property Manager  
2. Facility Operations  
3. Complete Platform  

There is **no** customer-facing Professional vs Business tier structure.

---

## PM Business

| Classification | LEGACY / IMPLEMENTATION ARTIFACT |
|----------------|----------------------------------|
| Customer-facing tier | **No** |
| Required for Checkout readiness | **No** (removed) |
| Vercel variables deleted | **No** (remain until Production cutover verified) |

---

## Six approved Stripe Price mappings (internal env names)

| Module | Env keys |
|--------|----------|
| Property Manager | `STRIPE_PRICE_PM_PROFESSIONAL_MONTHLY` · `STRIPE_PRICE_PM_PROFESSIONAL_ANNUAL` |
| Facility Operations | `STRIPE_PRICE_FO_PROFESSIONAL_MONTHLY` · `STRIPE_PRICE_FO_PROFESSIONAL_ANNUAL` |
| Complete Platform | `STRIPE_PRICE_COMPLETE_PROFESSIONAL_MONTHLY` · `STRIPE_PRICE_COMPLETE_PROFESSIONAL_ANNUAL` |

The word `PROFESSIONAL` in these names is an **internal mapping label**, not a customer plan chooser (ADR-019).

---

## Code changes (this PR)

| Area | Change |
|------|--------|
| `isSaasCheckoutReady()` | Requires PM PROFESSIONAL monthly/annual only |
| `validateSaasCheckoutRequest` | Rejects `planTier: business` |
| Catalog PM Business offers | `selfServeEligible: false` |
| `getSelfServeSaasOffers` | Professional monthly/annual only |
| Billing UI | Removed “Upgrade to Business” |
| `changePlanTier` / API | Rejects upgrades onto Business; legacy remediation → professional remains |
| `.env.example` | Marks Business keys as legacy / not required for readiness |

---

## Explicitly unchanged

- Product Constitution / ADR-019 text  
- Stripe Prices / Products / subscriptions  
- FO_READY / Complete availability  
- No priced multiple-property Enterprise fee  
- No Production deploy / Vercel env mutations in this change  

---

## Related

- [Authoritative commercial reconciliation](./authoritative-commercial-reconciliation-2026-08-11.md) (PR #117)  
