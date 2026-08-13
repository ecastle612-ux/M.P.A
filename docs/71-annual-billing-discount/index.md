# Annual billing 20% discount — investigation (blocked)

**Status:** **BLOCKED — Stripe Price action required**  
**Date:** 2026-08-13  
**Safety:** No Production deploy · No Stripe mutations · No env changes · No subscription changes · No database migration · No application pricing-code changes in this record  

This note records the investigation required before implementing annual prepaid billing at **20% off monthly**. Application pricing was **not** changed, because Checkout charges Stripe Price IDs whose documented amounts do **not** match the 20% model. Updating display or quote math first would make Confirm Plan totals disagree with Stripe line items.

---

## Verdict

**ANNUAL BILLING DISCOUNT — BLOCKED**

Do not implement application constants, customer copy, or tests until the Product Owner approves and ops create the Stripe Prices listed below, then maps the existing env keys to the new Price IDs.

---

## ROOT CAUSE

Shared unit-volume math is the authoritative quote source (`quoteUnitVolume` in `packages/shared/src/commercial/unit-volume.ts`). Checkout does **not** send dollar amounts to Stripe; it attaches env-mapped Price IDs.

Current annual rules in that module:

| Product | Annual base (code) | Formula |
|---------|-------------------:|---------|
| Property Manager | **$708** | monthly × 12 (`$59 × 12`) — **no discount** |
| Facility Operations | **$590** | hardcoded approved FO annual Price — **not** 20% (`$59 × 12 × 0.80 = $566.40`) |
| Complete Platform | **$1,308** | monthly × 12 (`$109 × 12`) — **no discount** |
| Additional Unit Capacity | **$468** / 500-unit block | monthly × 12 (`$39 × 12`) — **no discount on blocks** |

FO `$590` is “10 months prepaid” (`$59 × 10`), about **16.7%** off `$708`, not 20%.

Customer-facing copy was written to match that model, including:

> Annual equals monthly × 12 — no discount.

There is **no** existing Blueprint/ADR that documents a 20% annual discount. Slice 5 pricing transparency (`docs/68-com-002-slice-5-pricing-ui`) still lists `$708` / `$590` / `$1,308`.

---

## CURRENT ANNUAL PRICING SOURCE

### Quote / display (application)

| Concern | Source |
|---------|--------|
| Base annual amounts | `baseAnnualUsdForModule()` — `packages/shared/src/commercial/unit-volume.ts` |
| Quote `annual_amount` / `selected_amount` | `buildCommercialQuote()` — `packages/shared/src/commercial/acquisition-quote.ts` (delegates to `quoteUnitVolume`) |
| Pricing page headlines + “no discount” notes | `PUBLIC_PRICING_MODEL_COPY` — `packages/shared/src/commercial/pricing-display.ts` |
| Product-card explanations | `publicPurchaseMotionForSku()` — `packages/shared/src/commercial/public-purchase-motion.ts` |
| Confirm Plan totals | Server quote via `GET /api/commerce/quote`; UI in `apps/web/src/components/marketing/checkout-page.tsx` |
| Capacity-gate annual labels | `recurringSelectedUsd()` — `packages/shared/src/commercial/unit-capacity.ts` |

### Checkout (Stripe)

Checkout Session line items are **Price IDs only** (`buildCheckoutLineItemPlan` in `packages/shared/src/commercial/unit-volume-stripe.ts`). Charged amounts are whatever those Prices hold in Stripe — not the quote’s `selected_amount`.

| Role | Env key | Documented amount (code / Slice 5) |
|------|---------|------------------------------------|
| PM base annual | `STRIPE_PRICE_PM_BASE_ANNUAL` | $708.00 / year |
| FO base annual | `STRIPE_PRICE_FO_PROFESSIONAL_ANNUAL` | $590.00 / year |
| Complete base annual | `STRIPE_PRICE_COMPLETE_BASE_ANNUAL` | $1,308.00 / year |
| Additional Unit Capacity annual | `STRIPE_PRICE_UNIT_BLOCK_ANNUAL` | $468.00 / year per block |

Legacy catalog key `STRIPE_PRICE_PM_PROFESSIONAL_ANNUAL` is **not** used by customer Checkout (unit-volume path is authoritative). Display catalog uses the unit-volume keys above (`SAAS_DISPLAY_PRICE_ENV_KEYS`).

Stripe MCP was **not authenticated** in this environment. Amounts above are from application constants and Slice 5 / production-release docs (`docs/68-com-002-slice-5-pricing-ui`, `docs/69-final-commercial-production-release`). Those docs state Production Prices were verified at the expected (pre-discount) amounts.

**Do current annual Prices already reflect 20%?** **No.**

| Product | Current annual (500 units) | Required (`monthly × 12 × 0.80`) | Match? |
|---------|---------------------------:|----------------------------------:|:------:|
| Property Manager | $708.00 | $566.40 | No |
| Facility Operations | $590.00 | $566.40 | No |
| Complete Platform | $1,308.00 | $1,046.40 | No |

---

## REQUIRED STRIPE ACTION

Stripe Price `unit_amount` cannot be edited in place. **Create new yearly Prices**; do **not** mutate existing Price objects or live subscriptions.

This task must **not** create those Prices. Product Owner / ops must do so, then remap env vars (a separate, explicit env change — also out of scope here).

### New Prices to create (recurring, interval `year`, currency `usd`)

| Product | Env key to remap **after** creation | New `unit_amount` (cents) | Customer amount |
|---------|-------------------------------------|--------------------------:|-----------------|
| Property Manager annual base | `STRIPE_PRICE_PM_BASE_ANNUAL` | `56640` | **$566.40 / year** |
| Facility Operations annual base | `STRIPE_PRICE_FO_PROFESSIONAL_ANNUAL` | `56640` | **$566.40 / year** |
| Complete Platform annual base | `STRIPE_PRICE_COMPLETE_BASE_ANNUAL` | `104640` | **$1,046.40 / year** |

Keep existing monthly Prices unchanged:

| Product | Env key | Amount |
|---------|---------|--------|
| Property Manager monthly | `STRIPE_PRICE_PM_BASE_MONTHLY` | $59 / month |
| Facility Operations monthly | `STRIPE_PRICE_FO_PROFESSIONAL_MONTHLY` | $59 / month |
| Complete Platform monthly | `STRIPE_PRICE_COMPLETE_BASE_MONTHLY` | $109 / month |

### Additional Unit Capacity (not in the 20% product table)

The approved product table lists **base** annual totals at 500 included units only. Block annual remains **$39 × 12 = $468** (`STRIPE_PRICE_UNIT_BLOCK_ANNUAL`) unless the Product Owner separately extends the 20% to capacity blocks (`$39 × 12 × 0.80 = $374.40`).

**Do not change `STRIPE_PRICE_UNIT_BLOCK_ANNUAL` in this discount unless that extension is approved.**

If 20% were applied to the **entire** monthly quote (base + blocks), 501-unit PM annual would be `$98 × 12 × 0.80 = $940.80`. If 20% applies to **base only**, it would be `$566.40 + $468 = $1,034.40`. Those are different commercial models. This record assumes **base only**, matching the listed product prices.

### After Prices exist (out of scope for this record)

1. Owner-approved Production/preview env remap of the three annual base keys to the new Price IDs.  
2. Leave old annual Prices in Stripe (existing subscriptions keep billing on them).  
3. **Do not** migrate existing annual subscriptions in the pricing-consistency slice (`SUBSCRIPTIONS: NO CHANGES`).  
4. Then implement application constants, copy, cents formatting, and tests (checklist below).

Optional: if `STRIPE_PRICE_PM_PROFESSIONAL_ANNUAL` or `STRIPE_PRICE_COMPLETE_PROFESSIONAL_ANNUAL` are still set in any environment for display/legacy, create matching 20% Prices or point those keys at the new unit-volume annual Prices so leftover surfaces cannot show `$708` / `$1,308`.

---

## Why application code was not changed

Checkout integrity rule: **displayed totals must match Stripe line items.**

Changing `FO_ANNUAL_USD` / `baseAnnualUsdForModule()` to `$566.40` while env still points at `$708` / `$590` / `$1,308` Prices would show a 20% discount on Pricing, questionnaire, and Confirm Plan, then charge the old amount at Stripe Checkout.

This record therefore **stops** after investigation, per the implementation brief.

---

## Surfaces that would change after Stripe Prices exist

Do **not** treat the list below as implemented.

| Surface | Current inaccurate copy / amount |
|---------|----------------------------------|
| Pricing page annual note | `PUBLIC_PRICING_MODEL_COPY.annualNote` — “monthly × 12 (no discount)” + FO `$590` |
| Pricing billing transparency | `PUBLIC_PRICING_MODEL_COPY.billingAnnual` |
| PM / Complete product cards | “Annual = monthly × 12 (example: $59 → $708/year…)” / “$109 → $1,308/year” |
| FO product card | `foHeadlineAnnual` `$590/year` |
| Get Started questionnaire | “Annual equals monthly × 12 — no discount.” |
| Product explanations | `publicPurchaseMotionForSku` — PM/Complete “Annual = monthly × 12”; FO `$590/year`; Complete `$1,308/year` |
| Confirm Plan | Server `annual_amount` / `selected_amount` from `quoteUnitVolume` |
| Pricing calculator | Same quote helpers |
| JSON-LD | Complete annual advertised as `monthly × 12` |
| Billing plan page | Cycle label only; capacity gate uses `baseAnnualUsdForModule` |
| Landing pricing note | `PUBLIC_PRICING_MODEL_COPY.annualNote` |

Replacement copy (when unblocked): **“Save 20% when billed annually.”**

USD formatting today uses `maximumFractionDigits: 0` (`formatUsdAmount`, Confirm Plan `formatUsd`). **`$566.40` and `$1,046.40` require cents** (2 fraction digits) or they will render as `$566` / `$1,046`.

---

## Follow-up implementation checklist (after Stripe + env remap)

Application-only; still no Production deploy from the pricing-consistency slice unless separately authorized.

1. `ANNUAL_DISCOUNT_MULTIPLIER = 0.80`  
   `baseAnnualUsdForModule(module) = round(baseMonthlyUsdForModule(module) * 12 * 0.80, 2)`  
   → PM/FO `$566.40`, Complete `$1,046.40`. Remove special-case `FO_ANNUAL_USD = 590`.  
2. Keep monthly constants `$59` / `$109` and block annual `$468` unless Owner extends discount to blocks.  
3. Replace all “no discount” / “monthly × 12” customer copy with “Save 20% when billed annually.”  
4. Fix currency formatters to show cents when needed.  
5. Tests: monthly unchanged; annual `= monthly × 12 × 0.80` for each product at 500 units; savings 20%; Checkout still uses annual Price env keys; quote recovery preserves `billing_interval`; forbidden client price fields unchanged.  
6. Run shared tests, web tests, TypeScript, lint, build.

---

## Tests inspected (current expectations — do not change until unblocked)

| File | Current annual assertion |
|------|--------------------------|
| `packages/shared/src/commercial/unit-volume.test.ts` | PM/Complete `annual = monthly × 12`; FO `$590` |
| `packages/shared/src/commercial/pricing-display.test.ts` | PM `$708`, FO `$590`, Complete `$1,308` |
| `packages/shared/src/commercial/acquisition-quote.test.ts` | PM annual `monthly × 12`; Complete `$1308` at 500 |
| `packages/shared/src/commercial/unit-capacity.test.ts` | FO gate `$590/year` |
| `apps/web/src/app/api/commerce/quote/quote.route.test.ts` | Regenerated PM annual `selected_amount` `708` |
| `packages/shared/src/commercial/unit-volume-stripe.test.ts` | Annual Checkout uses `STRIPE_PRICE_*_ANNUAL` env keys (IDs, not amounts) |

Checkout tests already prove: monthly Price IDs unchanged by cycle selection; annual cycle selects annual Price env keys; server quote is authoritative; clients cannot supply price fields.

---

## FINAL REPORT

### ROOT CAUSE

Annual quotes and copy implement **monthly × 12** (PM/Complete) and a **$590 FO** Price. They do not implement **monthly × 12 × 0.80**. Checkout charges Stripe Price IDs that match those older amounts.

### CURRENT ANNUAL PRICING SOURCE

`baseAnnualUsdForModule()` for quotes/display; Stripe env Price IDs (`STRIPE_PRICE_PM_BASE_ANNUAL`, `STRIPE_PRICE_FO_PROFESSIONAL_ANNUAL`, `STRIPE_PRICE_COMPLETE_BASE_ANNUAL`) for Checkout charges.

### IMPLEMENTATION

| Check | Result |
|-------|--------|
| Annual discount | **FAIL** (not implemented — blocked) |
| PM annual `$566.40` | **FAIL** (code/docs `$708`; Stripe Price must be created) |
| FO annual `$566.40` | **FAIL** (code/docs `$590`; Stripe Price must be created) |
| Complete annual `$1,046.40` | **FAIL** (code/docs `$1,308`; Stripe Price must be created) |

### CUSTOMER COPY

| Surface | Result |
|---------|--------|
| Pricing | **FAIL** (still “no discount” / `$708` / `$590` / `$1,308`) |
| Checkout / Confirm Plan | **FAIL** (quote still undiscounted / FO `$590`) |
| Billing | **FAIL** (capacity annual still uses `$590` FO base) |

### CHECKOUT

| Check | Result |
|-------|--------|
| Monthly unchanged | **PASS** (no code change; monthly Prices not in required Stripe action) |
| Annual preserved | **PASS** (annual cycle still maps to annual Price env keys) |
| Server authoritative | **PASS** (unchanged; client still cannot set amounts) |

### TESTS

| Check | Result |
|-------|--------|
| Shared | **NOT RUN** (no application change) |
| Web | **NOT RUN** |
| TypeScript | **NOT RUN** |
| Lint | **NOT RUN** |
| Build | **NOT RUN** |

### SAFETY

| Check | Result |
|-------|--------|
| Production | **NO DEPLOYMENT** |
| Stripe | **NO CHANGES** (required action documented only) |
| Billing / subscriptions | **NO CHANGES** |
| Database | **NO MIGRATION** |
| Environment | **NO CHANGES** |

### FINAL VERDICT

**ANNUAL BILLING DISCOUNT — BLOCKED**

**Required Stripe action:** create three new yearly Prices at **$566.40**, **$566.40**, and **$1,046.40**; remap `STRIPE_PRICE_PM_BASE_ANNUAL`, `STRIPE_PRICE_FO_PROFESSIONAL_ANNUAL`, and `STRIPE_PRICE_COMPLETE_BASE_ANNUAL` after Owner approval. Then implement application quote math, cents formatting, customer copy, and tests.

**STOP.**
