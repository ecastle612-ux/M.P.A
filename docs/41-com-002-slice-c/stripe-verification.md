# Stripe Verification — Slice C

| Item | Design / code |
|------|----------------|
| Mode | `subscription` |
| UI | Stripe-hosted Checkout |
| Eligible | PM Pro/Business only |
| Trials | None |
| Tax | `STRIPE_SAAS_AUTOMATIC_TAX=true` when registration active |
| Coupons / promo codes | `allow_promotion_codes: true` |
| Payment methods | Dynamic (omit `payment_method_types`) — card, Apple Pay, Google Pay, Link, ACH if Dashboard-enabled |
| Customer / Subscription | Created by Stripe Checkout; metadata `mpa_money_domain=saas_billing` |
| Invoices / receipts | Stripe-hosted (Billing) |
| Idempotency | Stripe `idempotencyKey` on session create |
| Webhook verify | `constructEvent` with `STRIPE_SAAS_WEBHOOK_SECRET` |
| FIN-OPS separation | Separate endpoint from `/api/finance/webhooks/stripe` |

## Env

`STRIPE_SECRET_KEY`, `STRIPE_SAAS_WEBHOOK_SECRET`, four `STRIPE_PRICE_PM_*` ids.
