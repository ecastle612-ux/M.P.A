# BUG-010 — Final Verification (Production)

| Field | Value |
|-------|--------|
| Verified at | 2026-08-08 |
| Production deployment id | `dpl_8fzmKBqmDhumLWieQcaW8QapwAMz` |
| `origin/main` SHA at probe | `cd9a9fb33b45ed6b112427beaa3ef3ddb989e07d` |
| BUG-010 branch SHA | _see PR #65 tip_ |
| Verdict | **FAIL** — Checkout still 503 on Production tip of `main` |

## Journey checkpoints

| # | Step | Result | Evidence |
|---|------|--------|----------|
| 1 | Landing | Pass | 200 `/` · artifact `01-landing.webp` |
| 2 | Pricing | Pass | 200 `/pricing?intent=mpa_property_manager` · `03-pricing.webp` |
| 3 | Confirm Plan | Pass (page) | 200 `/checkout?intent=…` · `04-confirm-plan-error.webp` |
| 4 | Stripe Checkout launches | **Fail** | API + UI: `saas_checkout_not_configured` |
| 5 | Customer completes payment | Blocked | Step 4 |
| 6 | SaaS webhook received | Blocked | Destination URL healthy (400 without sig) |
| 7 | Provisioning completes | Blocked | Step 4 |
| 8 | Organization created | Blocked | Step 4 |
| 9 | Claim account | Blocked | Step 4 |
| 10 | Email verification | Blocked | Step 4 |
| 11 | Guided Setup | Blocked | Step 4 |
| 12 | Mission Control | Blocked | Step 4 |

## Master Admin

| Surface | Result |
|---------|--------|
| Checkout sessions | Not exercised (no purchase) |
| Subscription | Not exercised |
| Provisioning job | Not exercised |
| Customer | Not exercised |
| Organization | Not exercised |

Consoles exist under `/admin/commercial/*` (code audit). Runtime visibility pending a successful paid/promo Checkout.

## Exact root cause (step 4)

```http
POST /api/commerce/checkout
→ 503 {"error":"saas_checkout_not_configured",…}
```

Running Production process does not resolve `STRIPE_PRICE_PM_*` (env missing or not redeployed). `STRIPE_SECRET_KEY` is present (finance/SaaS webhook routes authenticate signature verification path).

Browser Confirm Plan error (Production `main`, pre–BUG-010 deploy):

> Stripe SaaS prices/keys not configured.

## Remediation in PR #65 (must merge + deploy)

1. Live Price ID defaults for known `acct_1Tv5Lj8jGrZYUXDt` mapping (env still wins)  
2. `isSaasCheckoutReady()` requires secret + resolvable PM professional prices only  
3. Constitution cleanup (no customer Professional/Business; no `plan=` in continue URLs)  
4. Webhook destination URLs already corrected in Stripe live  

## E2E payment aid (live)

| Item | Value |
|------|--------|
| Coupon | `bug010_e2e_100_once` (100% once) |
| Promotion code | `BUG010E2E` (max 10 redemptions) |

Use at Stripe Checkout after session launch to complete a $0 live subscription for provisioning verification.

## Required operator action now

1. Merge PR #65  
2. Ensure Production deploy of that SHA (auto-deploy or Redeploy)  
3. Reply — agent re-probes Checkout and continues paid/promo E2E through Mission Control  

## Final PASS/FAIL

**FAIL** against BUG-010 success criteria until Production serves a Checkout `url` and the post-payment journey completes.
