# BUG-010 — Stripe Verification Report

## Account

| Field | Value |
|-------|--------|
| Account id | `acct_1Tv5Lj8jGrZYUXDt` |
| Business name | M.P.A. |
| Country / currency | US / usd |
| Charges enabled | true |
| Payouts enabled | true |
| Details submitted | true |
| Mode | Live |

## Keys (agent env — shapes only)

| Variable | Status |
|----------|--------|
| `STRIPE_SECRET_KEY` | `sk_live_…` valid |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_…` shape OK |
| `STRIPE_WEBHOOK_SECRET` | `whsec_…` present |
| `STRIPE_SAAS_WEBHOOK_SECRET` | `whsec_…` present |
| `STRIPE_PRICE_PM_*` (×4) | **Missing on Production** (see Checkout report) |

## Webhook destinations

| Id | URL | Status | Notes |
|----|-----|--------|-------|
| `we_1Tv82j8jGrZYUXDtnLXnfgrQ` | `https://www.my-property-assistant.com/api/finance/webhooks/stripe` | enabled · live | Was 404 `/api/webhooks/payments/stripe` — **fixed** |
| `we_1Tw3Cg8jGrZYUXDtp2lv6gY0` | `https://www.my-property-assistant.com/api/commerce/webhooks/stripe` | enabled · live | Was 404 `/api/webhooks/saas/stripe` — **fixed** |

### Production path probes

| Path | Response without signature |
|------|----------------------------|
| `/api/finance/webhooks/stripe` | 400 Missing signature |
| `/api/commerce/webhooks/stripe` | 400 missing_signature |
| `/api/webhooks/payments/stripe` | 404 (legacy) |
| `/api/webhooks/saas/stripe` | 404 (legacy) |

## MCP

Stripe MCP remains `needsAuth` in this cloud agent (Desktop OAuth). API verification used restricted/live secret key in agent secrets — not MCP tools.

## Checkout session create

Verified via Stripe API with mapped Property Manager monthly price → open live Checkout Session URL (then expired).
