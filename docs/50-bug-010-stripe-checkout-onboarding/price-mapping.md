# BUG-010 — Stripe Price Mapping

**Rule:** Do **not** rename Stripe Products. Map Product Constitution platforms to existing Price IDs. Customers must never see historical tier names.

## Customer products → internal offer → env → live Price ID

| Customer product | Billing cycle | Internal offer id (not shown) | Env var | Live Price ID | Stripe Product (do not rename) |
|------------------|---------------|-------------------------------|---------|---------------|--------------------------------|
| Property Manager | Monthly | `mpa_property_manager__professional__monthly` | `STRIPE_PRICE_PM_PROFESSIONAL_MONTHLY` | `price_1Tw3Cb8jGrZYUXDtQwHvaXFW` | M.P.A. Professional (`prod_Uvv2MKES5pzHva`) · $99/mo |
| Property Manager | Annual | `mpa_property_manager__professional__annual` | `STRIPE_PRICE_PM_PROFESSIONAL_ANNUAL` | `price_1Tw3Cc8jGrZYUXDtoMZ4ypxU` | same · $990/yr |
| Property Manager (capacity path) | Monthly | `mpa_property_manager__business__monthly` | `STRIPE_PRICE_PM_BUSINESS_MONTHLY` | `price_1Tw3Cd8jGrZYUXDtQTEZdC4G` | M.P.A. Business (`prod_Uvv2tEAKkUCwKU`) · $249/mo |
| Property Manager (capacity path) | Annual | `mpa_property_manager__business__annual` | `STRIPE_PRICE_PM_BUSINESS_ANNUAL` | `price_1Tw3Cd8jGrZYUXDt8nQgBomF` | same · $2490/yr |

Confirm Plan UI always posts internal `planTier: "professional"` so self-serve Checkout uses the Professional price row while the customer sees **Property Manager** + Monthly/Annual only.

## Stripe Products present but not mapped to self-serve constitution products

| Stripe Product | Prices | Disposition |
|----------------|--------|-------------|
| M.P.A. Founder | $49 / $490 | Not used by Confirm Plan. Do not expose. |
| M.P.A. Enterprise | $499 / $4990 | Not a purchasable product. Enterprise = sales motion (`/enterprise`). |

## Facility Operations / Complete Platform

`FO_READY=false`. Self-serve Stripe Checkout rejects non-PM SKUs with `enterprise_required`. Enabling FO/Complete Checkout requires Product Owner approval + new price mapping (out of BUG-010 success path for Property Manager).

## Account

- Stripe account: `acct_1Tv5Lj8jGrZYUXDt` (M.P.A.)
- Live mode verified 2026-08-08
