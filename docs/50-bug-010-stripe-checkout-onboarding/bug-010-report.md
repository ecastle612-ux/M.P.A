# BUG-010 Report — Stripe Checkout & Automated Onboarding

| Field | Value |
|-------|--------|
| Opened | 2026-08-08 |
| Status | **FAIL (final verify)** — Production Checkout still 503; PR #65 must merge+deploy |
| Constitution | ADR-019 binding |
| Related | COM-002 Slices C–E · BUG-008 constitution pass on marketing |

## Summary

“Continue to secure checkout” fails in Production with a precise API error: **503 `saas_checkout_not_configured`**. Stripe account, keys, and mapped Price IDs are valid; Checkout Sessions create successfully when prices are supplied. Two webhook destinations pointed at 404 URLs and were corrected to the live finance/commerce routes. Customer-facing Professional/Business tier language was removed from Billing and funnel URLs.

## Root cause (Checkout)

`isSaasCheckoutReady()` in `apps/web/src/lib/saas-stripe/client.ts` requires:

- `STRIPE_SECRET_KEY`
- `STRIPE_PRICE_PM_PROFESSIONAL_MONTHLY`
- `STRIPE_PRICE_PM_PROFESSIONAL_ANNUAL`
- `STRIPE_PRICE_PM_BUSINESS_MONTHLY`
- `STRIPE_PRICE_PM_BUSINESS_ANNUAL`

Production is missing the four price IDs → Confirm Plan cannot launch Stripe Checkout.

Evidence: `POST /api/commerce/checkout` → 503 with `saas_checkout_not_configured`.

## Fixes applied

| Fix | Where |
|-----|--------|
| Finance webhook URL | Stripe `we_1Tv82j…` → `/api/finance/webhooks/stripe` |
| SaaS webhook URL | Stripe `we_1Tw3Cg…` → `/api/commerce/webhooks/stripe` |
| Remove customer Professional/Business Billing CTAs + copy | `billing-plan-page.tsx` |
| Customer plan labels = product names | subscription API + lifecycle emails |
| Drop `plan=` from public funnel URLs | `acquisition.ts` + marketing chrome/pages |
| Customer-safe Checkout 503 message | checkout API |
| Price mapping + verification docs | `docs/50-bug-010-stripe-checkout-onboarding/` |

## Price mapping (Property Manager)

See [price-mapping.md](./price-mapping.md). Confirm Plan maps to historical Stripe “Professional” prices internally; customer never sees that name.

## End-to-end checkpoints

| Checkpoint | Result |
|------------|--------|
| Landing → Choose Platform → Pricing → Confirm Plan | Marketing constitution path present |
| Continue to secure checkout (Production) | **Fail** — 503 prices not configured |
| Stripe Hosted Checkout (direct API) | Pass (session created, then expired) |
| Webhook → Provisioning → Claim → Setup → Mission Control | Pending successful paid Checkout |
| Master Admin visibility | Consoles present; runtime pending |

## Constitution compliance notes

| Topic | Status |
|-------|--------|
| Three products only in marketing | Pass |
| Enterprise as sales motion | Pass (`/enterprise`) |
| No Founder/Starter/Teams in UI | Pass |
| No Professional/Business in customer Billing | Pass (this PR) |
| FO/Complete self-serve vs Enterprise fallback | Known debt (`FO_READY=false`) — not changed without PO approval |

## Required operator action

Set Production env vars (see price-mapping) and redeploy, then re-run paid E2E.

## Pass/Fail

**FAIL** against BUG-010 success criteria until Production Checkout returns a live session URL and provisioning completes without operator involvement.
