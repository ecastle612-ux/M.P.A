# RC1 — Stripe SaaS Operator Runbook

**Type:** Ops attestation checklist (Critical **C3**)  
**Date:** 2026-07-28  
**Environment:** Production (or designated prod-beta)  
**Webhook path:** `POST /api/webhooks/saas/stripe`  
**Do not** share secrets with rent (`/api/webhooks/payments`) or Connect (`/api/webhooks/connect`) rails.

Engineering certification: [ACQ-001 §27](../115-acq-001-self-service-customer-acquisition/27-slice-c-implementation.md) — **READY**; this runbook must be signed for commercial go-live.

---

## Preflight (C4 env)

Confirm on Vercel Production (values, not placeholders):

| Variable | Required value / note | ☐ |
|----------|----------------------|---|
| `NEXT_PUBLIC_APP_URL` | `https://www.my-property-assistant.com` | ☐ |
| `SAAS_BILLING_PROVIDER` | `stripe` | ☐ |
| `STRIPE_SECRET_KEY` | Live or dedicated test key for this env | ☐ |
| `STRIPE_SAAS_WEBHOOK_SECRET` | Endpoint signing secret for SaaS webhook only | ☐ |
| `STRIPE_SAAS_PRICE_*` | Founder / Professional / Business / Enterprise monthly+annual as sold | ☐ |
| `STRIPE_SAAS_TRIAL_DAYS` | e.g. `14` | ☐ |
| `EMAIL_PROVIDER` | `resend` | ☐ |
| `RESEND_API_KEY` | Production key | ☐ |
| `EMAIL_FROM` | Verified domain sender | ☐ |
| `EMAIL_ENVIRONMENT` | `production` | ☐ |
| `STRIPE_ALLOW_SIMULATE` / SaaS simulate | `false` when live | ☐ |
| `DEV_MASTER_ADMIN_PASSWORD` | **Unset** | ☐ |

Stripe Dashboard webhook endpoint:

`https://www.my-property-assistant.com/api/webhooks/saas/stripe`

Events: at minimum Checkout / subscription lifecycle events consumed by `applySaasProviderWebhook`.

---

## Run (record date, operator, Stripe event ids)

| Step | Action | Pass criteria | ☐ |
|------|--------|---------------|---|
| 1 | Trial Checkout from `/pricing` with test/live card | Session completes; webhook accepted once; org provisioned | ☐ |
| 2 | Replay same webhook delivery | Duplicate ignored; no second org | ☐ |
| 3 | Paid Professional Checkout | Org + admin credential email + entitlements | ☐ |
| 4 | Cancel mid-Checkout | No org created | ☐ |
| 5 | Decline card | No org; pricing recovery works | ☐ |
| 6 | Sign in with emailed credentials | Guided Setup → mark active → dashboard | ☐ |
| 7 | Settings → Billing | Snapshot + Customer Portal open | ☐ |

---

## Sign-off

| Field | Value |
|-------|-------|
| Environment URL | |
| Git SHA deployed | |
| Operator | |
| Date (UTC) | |
| Result | ☐ PASS · ☐ FAIL |
| Notes / event ids | |

**C3 closes only on PASS.** Failures block Limited Production; beta may continue with ops-supervised invites only.
