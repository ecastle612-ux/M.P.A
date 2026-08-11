# COM-002 Slice 5 — Pricing UI + commercial lifecycle integration

**Status:** Implemented in application code  
**Safety:** No Production Stripe / Vercel / env mutations for this UI slice · no PM Business tiers  

**Transparency completion (2026-08-11):** [pricing-page-complete-transparency-2026-08-11.md](./pricing-page-complete-transparency-2026-08-11.md)

## Customer journey

```
Pricing → Get Started → Questionnaire → Product recommendation → Unit count → Quote → Confirm Plan → Checkout
```

Managed unit count entered on the pricing calculator is carried into the questionnaire via `units` query param and `sessionStorage`.

## Public model

| Product | Status | Display |
|---------|--------|---------|
| Property Manager | Available | $59/mo · $708/yr includes 500 units; +$39/mo or +$468/yr per additional 500 |
| Facility Operations | Available | $59/mo · $590/yr includes 500 units; +$39/mo or +$468/yr per additional 500 |
| Complete Platform | Available | $109/mo · $1,308/yr includes 500 units; +$39/mo or +$468/yr per additional 500 |

No Professional / Business / Enterprise product cards. No legacy $99/$249 list prices on the pricing page. Enterprise is documented as sales motion only — not a fourth product.

## Calculator

Uses shared `quoteUnitVolume` + debounced `POST /api/commerce/quote` for server-authoritative amounts. Operational need selects the recommended product (PM / FO / Complete).
