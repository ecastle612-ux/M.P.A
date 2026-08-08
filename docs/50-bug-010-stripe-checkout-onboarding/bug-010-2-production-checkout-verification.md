# BUG-010.2 — Production Checkout Verification

| Field | Value |
|-------|--------|
| Mode | Verify only (no code / env / merge) |
| Verified at | 2026-08-08 |
| Verdict | **FAIL** (Checkout PASS; journey fails at provisioning) |

## Production identity

| Item | Value |
|------|--------|
| Deployment ID | `dpl_7jHkUnv6YjVsgd8SqxhpNMabCorz` |
| Production SHA | `cd9a9fb33b45ed6b112427beaa3ef3ddb989e07d` (`origin/main`, BUG-009 tip; PR #65 not merged) |
| Host | `https://www.my-property-assistant.com` |

## Checkpoint results

| # | Step | Result | Evidence |
|---|------|--------|----------|
| 1 | Landing | Pass | 200 `/` |
| 2 | Pricing | Pass | 200 `/pricing?intent=mpa_property_manager…` |
| 3 | Confirm Plan | Pass | 200 `/checkout?intent=…` |
| 4 | Checkout API | **Pass** | `POST /api/commerce/checkout` → **200** + `checkout.stripe.com` URL (monthly + annual) |
| 5 | Stripe Checkout launch | **Pass** | Hosted Checkout opens; promo `BUG010E2E` applies ($99 → $0) |
| 6 | Successful payment | **Pass** | Session `cs_live_a1ccnkdNKoTvJ22hJfmSD3hWD4EIdqIA2gFq1wDM57rXVr47WaH3kty3J9` → `status=complete`, `payment_status=paid`, amount `0`; sub `sub_1U2IkL8jGrZYUXDtLrlgum1x`; customer `cus_V2NVLiNyJhg8fw` |
| 7 | SaaS webhook / app sees purchase | **Pass (partial)** | Stripe event `checkout.session.completed` `evt_1U2IkM8jGrZYUXDtPc0bHMnJ`; app session API `status=checkout_completed` |
| 8 | Provisioning checkpoint machine | **Fail** | `checkpoint=failed_retryable` |
| 9 | Organization | Partial | API returned `organizationId=5b0154d4-983a-4728-b8c5-fa352c7ff439` name `bug010.2.e2e Organization` before hard fail |
| 10 | Claim account | Not completed | Sign-up reachable; blocked by failed provision / email inbox |
| 11 | Email verification | Not reached | — |
| 12 | Guided Setup | Not reached | — |
| 13 | Mission Control | Not reached | — |

## Exact failure point

**Provisioning** after paid Checkout:

```text
checkpoint: failed_retryable
lastError: Could not find the table 'public.organization_subscriptions' in the schema cache
```

Production Supabase is missing (or PostgREST schema-cache unaware of) `public.organization_subscriptions` — COM-002 Slice E migration not applied / not exposed.

## Master Admin

| Surface | Result |
|---------|--------|
| `/admin/commercial/checkout` | Redirect → `/login` (auth required; no anonymous visibility) |
| `/admin/commercial/provisioning` | Redirect → `/login` |
| `/admin/commercial/subscriptions` | Redirect → `/login` |

Runtime Admin contents not verified without Master Admin credentials. Stripe-side objects exist: Checkout session, Customer, Subscription.

## Screenshots

Artifacts under `/opt/cursor/artifacts/bug-010-2/`:

- `01-landing.webp`
- `02-pricing.webp`
- `03-confirm-plan.webp`
- `04-stripe-checkout-promo.webp`
- `05-stripe-checkout-zero.webp`
- `06-purchase-success.webp` / `06b-purchase-success.webp`
- `07-provisioning-failed.webp` / `07b-provisioning-failed.webp`
- `08-claim-signup.webp`
- `09-admin-checkout-login.webp`

## Notes

- Confirm Plan → API Checkout (app path) returns 200; env redeploy fixed BUG-010.1.
- $0 completion used promo coupon `bug010_e2e_100_once` / `BUG010E2E` with `payment_method_collection=if_required` (live mode; no test cards).
- No code, env, or PR merges performed in this verification.

## PASS / FAIL

**FAIL** against full customer journey success criteria.

**Checkout configuration: PASS.**  
**End-to-end onboarding: FAIL at provisioning DB schema (`organization_subscriptions`).**
