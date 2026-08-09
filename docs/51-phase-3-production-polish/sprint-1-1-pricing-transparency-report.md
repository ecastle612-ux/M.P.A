# Sprint 1.1 — Pricing Transparency Report

| Field | Value |
|-------|--------|
| Date | 2026-08-09 |
| Source of truth | Configured Stripe Price IDs via `resolveSaasPriceId` → `stripe.prices.retrieve` |
| Hardcoded amounts | **None** |

## Problem

Pricing/Confirm Plan deferred cost to Checkout without showing dollars (“amount confirmed in Stripe”), creating purchase friction.

## Solution

1. Server loader `loadPublicCatalogPrices()` reads **Property Manager professional** monthly/annual Stripe Prices from env-mapped IDs.  
2. Pricing + Confirm Plan RSC pages pass the catalog into the client UI.  
3. When amounts load: show formatted price, `/month` or `/year`, and renewal cadence.  
4. When amounts cannot load: show an **explicit system warning** (never invent $).  
5. FO / Complete: clear “self-service Stripe pricing is not configured” notice (FO_READY / no Price IDs) — no invented amounts.  
6. Optional public GET `/api/commerce/catalog-prices` for the same payload.

## Files

- `apps/web/src/lib/saas-stripe/public-prices.ts`  
- `apps/web/src/lib/saas-stripe/public-prices-server.ts`  
- `apps/web/src/app/api/commerce/catalog-prices/route.ts`  
- `apps/web/src/app/(marketing)/pricing/page.tsx`  
- `apps/web/src/app/(marketing)/checkout/page.tsx`  
- `apps/web/src/components/marketing/pricing-page.tsx`  
- `apps/web/src/components/marketing/checkout-page.tsx`  

## Local verification note

This agent environment lacks `STRIPE_PRICE_PM_*` / secret key → catalog returns `status: unavailable` with warning text. That is the required failure mode. Production with configured Price IDs will display live amounts without code changes.

## Checkout architecture

Unchanged: Confirm Plan still `POST /api/commerce/checkout` with offer → env Price ID → Stripe Checkout Session `line_items.price`.

## Screenshots

- After Pricing (warning mode): `screenshots-1-1/after/desktop-pricing.png`  
- After Confirm Plan (warning mode): `screenshots-1-1/after/desktop-confirm-plan.png`  
- Before Pricing (no live amount UI): `screenshots-1-1/before/desktop-pricing.png`  
