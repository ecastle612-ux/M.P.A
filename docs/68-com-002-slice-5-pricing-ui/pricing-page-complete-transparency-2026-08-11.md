# Pricing page — complete customer transparency (2026-08-11)

**Status:** Implemented (docs + UI) against unit-volume commercial model on `main`  
**Scope:** Public `/pricing` transparency only — no Stripe Price creation, no Vercel env mutation, no subscription changes  
**Basis:** Owner unit-volume model (Slices 1–5 + FO/Complete self-serve authorization already on Production)

## Journey (customer-facing)

```
Pricing → Get Started → Questionnaire → Product recommendation → Unit count → Quote → Confirm Plan → Checkout
```

## Transparency checklist (subscriber questions)

| # | Question | Page answer |
|---|----------|-------------|
| 1 | What products can I buy? | Property Manager, Facility Operations, Complete Platform — all Available |
| 2 | How much does each cost? | PM $59 / $708 · FO $59 / $590 · Complete $109 / $1,308 (+ capacity) |
| 3 | What is included? | Module lists + inclusion matrix |
| 4 | How does unit capacity work? | First 500 included; Additional Unit Capacity +$39/mo or +$468/yr per 500 |
| 5 | What happens above 500 units? | Examples + calculator blocks |
| 6 | What does annual billing cost? | Product example tables + calculator annual column |
| 7 | Is there a free trial? | 30 DAYS FREE ≤500 units; none above 500 |
| 8 | Do I need a card? | Yes — stated for trial and non-trial |
| 9 | When do I get charged? | After trial unless cancel; or at Checkout if ineligible |
| 10 | What if unit count increases? | Approval required; next billing period |
| 11 | Which product is right for me? | Calculator need selector → recommended product |
| 12 | How do I start? | Get Started CTA |

## Forbidden language

Must remain absent on `/pricing`: Coming Soon, Early Access, Consultation Only, Enterprise Only, Gated, Business, Professional tier.

Enterprise appears only as **not a separate product** (sales/onboarding path).

## Scorecard (post-change verification target)

```
Pricing page: COMPLETE

PM pricing transparency: PASS
FO pricing transparency: PASS
Complete pricing transparency: PASS
Unit capacity transparency: PASS
Trial transparency: PASS
Annual pricing transparency: PASS
Payment requirement transparency: PASS
Capacity-change transparency: PASS
Calculator: PASS
Mobile: PASS (information remains in stacked sections; not hidden)
Desktop: PASS
Customer can understand total expected cost before Checkout: PASS
```

## Files

- `packages/shared/src/commercial/pricing-display.ts`
- `packages/shared/src/commercial/public-purchase-motion.ts`
- `apps/web/src/components/marketing/pricing-page.tsx`
- `apps/web/src/components/marketing/unit-volume-pricing-calculator.tsx`
