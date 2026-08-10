# 65 — Production Pricing & Product Readiness Audit

**Date:** 2026-08-10  
**Mode:** Read-only inventory + readiness (no production billing mutation)  
**Companion:** [Pricing migration preparation](./65-production-pricing-migration-preparation/index.md)

## Scope

Confirm live commercial pricing state and readiness for an authorized **$40 subscription list-price reduction** using **NEW Stripe Prices** (existing customers unchanged).

## Validation already recorded

| Check | Result |
|-------|--------|
| Shared tests | 131 passed (pre-prep baseline) |
| Web tests | 27 passed (pre-prep baseline) |
| Production build | PASS |
| TypeScript | PASS |
| Production billing state changed | **NO** |

## Live public display (www)

Pricing page loads Stripe-backed amounts. Observed public figures:

| Product | Monthly (live) | Annual (live) | Purchase motion |
|---------|----------------|---------------|-----------------|
| Property Manager | **$99** | **$990** | Self-serve |
| Facility Operations | **$99** | **$990** | EARLY ACCESS · NOT ONLINE YET |
| Complete Platform | **$149** | **$1,490** | CONSULTATION · NOT ONLINE YET |

Annual live figures are **10× monthly** on current Stripe Prices (not $630 / $1,130).

## Stripe account inventory (read-only)

Active SaaS Prices include:

| Role | Product name | Amount | Interval | Price ID | Notes |
|------|--------------|--------|----------|----------|-------|
| PM Professional (provisional) | M.P.A. Professional | $99 | month | `price_1Tw3Cb8jGrZYUXDtQwHvaXFW` | Likely `STRIPE_PRICE_PM_PROFESSIONAL_MONTHLY` |
| PM Professional (provisional) | M.P.A. Professional | $990 | year | `price_1Tw3Cc8jGrZYUXDtoMZ4ypxU` | Likely `STRIPE_PRICE_PM_PROFESSIONAL_ANNUAL` |
| PM Business (provisional) | M.P.A. Business | **$249** | month | `price_1Tw3Cd8jGrZYUXDtQTEZdC4G` | `STRIPE_PRICE_PM_BUSINESS_MONTHLY` |
| PM Business (provisional) | M.P.A. Business | **$2,490** | year | `price_1Tw3Cd8jGrZYUXDt8nQgBomF` | `STRIPE_PRICE_PM_BUSINESS_ANNUAL` |
| FO | Facility Operations | $99 | month | `price_1U2O9M8jGrZYUXDtuoUU9jVQ` | Official lookup key |
| FO | Facility Operations | $990 | year | `price_1U2O9N8jGrZYUXDt28S1FwxK` | Official lookup key |
| Complete | Complete Platform | $149 | month | `price_1U2O9N8jGrZYUXDtqwDqgobS` | Official lookup key |
| Complete | Complete Platform | $1,490 | year | `price_1U2O9N8jGrZYUXDtsAhAkcTD` | Official lookup key |

**Vercel env → Price ID binding:** not readable from this agent (Vercel MCP unauthenticated). Operator must confirm dashboard mappings before cutover.

## PM Business

| Field | Value |
|-------|-------|
| Current monthly | **$249** (24,900¢) — Stripe-verified |
| Current annual | **$2,490** (249,000¢) — Stripe-verified |
| Billing intervals | month / year |
| Stripe Price IDs | `price_1Tw3Cd8jGrZYUXDtQTEZdC4G` / `price_1Tw3Cd8jGrZYUXDt8nQgBomF` |
| Required after $40 reduction | **$209** / **$2,450** |
| Vercel binding | Confirm `STRIPE_PRICE_PM_BUSINESS_*` → these IDs |

## Checkout / gates

- PM self-serve: allowed when Price env configured  
- FO / Complete POST checkout: **409 `enterprise_required`** while `FO_READY === false`  
- Availability labels must remain until products are authorized online  

## Entitlements

Price amounts are independent of seat/property limits and entitlement keys. No entitlement change is required for a list-price reduction.

## Existing customers

No automatic Price migration job exists for bulk cutover. Lifecycle `changePlanTier` only updates a subscription when a customer explicitly changes plan — it uses **current** env Price IDs (future new IDs after cutover). Existing subscriptions remain on their Stripe Price until an explicit future migration is authorized.

## Application Price ID mapping (env-centralized)

| Offer | Env key | Usage |
|-------|---------|-------|
| PM Pro monthly/annual | `STRIPE_PRICE_PM_PROFESSIONAL_*` | Checkout + display |
| PM Business monthly/annual | `STRIPE_PRICE_PM_BUSINESS_*` | Checkout (internal) |
| FO Pro monthly/annual | `STRIPE_PRICE_FO_PROFESSIONAL_*` | Display only |
| Complete Pro monthly/annual | `STRIPE_PRICE_COMPLETE_PROFESSIONAL_*` | Display only |

Source: `packages/shared/src/commercial/saas-checkout.ts` (`SAAS_PRICE_ENV_KEYS`, `SAAS_DISPLAY_PRICE_ENV_KEYS`).

## Authorized targets (Owner)

| Plan | Monthly | Annual |
|------|---------|--------|
| Property Manager | $59 | $590 |
| Facility Operations | $59 (not online) | $590 (not online) |
| Complete Platform | $109 (not online) | $1,090 (not online) |
| PM Business (internal) | $209 | $2,450 |

## Conclusion

Ready for **preparation** in code/docs. Not ready to claim production pricing changed. Next phase: controlled Stripe operator migration after Owner authorization.
