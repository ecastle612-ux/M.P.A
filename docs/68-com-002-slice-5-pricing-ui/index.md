# COM-002 Slice 5 — Pricing UI + commercial lifecycle integration

**Status:** Implemented in application code  
**Safety:** No Production Stripe / Vercel / env mutations · FO/Complete gated · no PM Business  

## Customer journey

```
Pricing → Get Started (questionnaire) → Server Quote → Confirm Plan → Checkout
```

Managed unit count entered on the pricing calculator is carried into the questionnaire via `units` query param and `sessionStorage`.

## Public model

| Product | Status | Display |
|---------|--------|---------|
| Property Manager | Available | $59/mo includes 500 units; +$39/mo per additional 500 |
| Facility Operations | Not online / gated | $59/mo or $590/yr list (not purchasable) |
| Complete Platform | Not online / gated | $109/mo base + unit blocks (not purchasable) |

No Professional / Business / Enterprise product cards. No legacy $99/$249 list prices on the pricing page.

## Calculator

Uses shared `quoteUnitVolume` + debounced `POST /api/commerce/quote` for server-authoritative amounts.
