# BUG-010 — Checkout Verification Report

## Exact production failure (do not guess)

| Check | Result |
|-------|--------|
| `POST https://www.my-property-assistant.com/api/commerce/checkout` | **503** |
| Body | `{"error":"saas_checkout_not_configured","message":"Stripe SaaS prices/keys not configured."}` |
| Payload tested | `productSku=mpa_property_manager`, `planTier=professional`, `billingCycle=monthly` (and annual) |

**Root cause:** `isSaasCheckoutReady()` requires `STRIPE_SECRET_KEY` **and** all four `STRIPE_PRICE_PM_*` env vars. Production is missing the price IDs.

## Direct Stripe API proof (agent, live key)

| Step | Result |
|------|--------|
| Retrieve four mapped prices | All `active=true` |
| `checkout.sessions.create` (subscription, PM professional monthly) | **200** · `cs_live_…` · `checkout.stripe.com` URL |
| Probe session | Expired after verification (`/expire`) |

## App path audit

| Step | Status |
|------|--------|
| Publishable key shape (`pk_live_`) | Present in agent secrets |
| Secret key (`sk_live_`) | Valid against `/v1/account` |
| SaaS webhook secret | Present |
| Price lookup (`resolveSaasPriceId`) | Env-backed; fails closed when unset |
| Session create (`createSaasCheckoutSession`) | Implemented; success/cancel URLs correct |
| Success URL | `/checkout/success?session_id={CHECKOUT_SESSION_ID}` |
| Cancel URL | `/checkout/cancel?offer=…` |
| Confirm Plan CTA | Posts to `/api/commerce/checkout` then `window.location.assign(url)` |

## Customer-facing language (this PR)

- Removed Professional / Business from Billing & Plan CTAs and copy
- Customer `planLabel` returns Product Constitution name (`Property Manager`)
- Funnel URLs no longer carry `plan=professional`
- Checkout 503 message is customer-safe (operator code retained)

## Remaining to green Checkout in Production

1. Set the four price env vars on Vercel `m-p-a-web` Production (see [price-mapping.md](./price-mapping.md))  
2. Confirm Stripe keys / webhook secrets on Production  
3. Redeploy  
4. Re-probe `POST /api/commerce/checkout` → expect `200` + `url`
