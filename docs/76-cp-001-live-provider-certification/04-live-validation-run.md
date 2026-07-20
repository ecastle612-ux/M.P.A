# 04 — Live Provider Validation Run

**Package:** CP-001  
**Date:** 2026-07-19 (local env: `apps/web/.env.local`)  
**Scope:** Validate existing providers only — no new adapters, no workflow changes  
**DocuSign:** Deferred (no adapter)  
**Screening vendor in codebase:** **Checkr** (not TransUnion)

---

## Method

1. Load env from `apps/web/.env.local` (plus fallbacks) without printing secrets  
2. `buildProviderHealthDashboard()` — Integrations status + read-only probes  
3. `runProviderCertification()` — PT-001 trust checks  
4. Webhook routes confirmed from source (no live Stripe Dashboard event in this run)

---

## Summary matrix

| Provider | Integrations status | Env/creds | Auth / API | Webhook | Commercial note |
| --- | --- | --- | --- | --- | --- |
| **Stripe** | **Production Ready** | Pass (live) | Pass (balance + createCustomer) | Secret set; live delivery not proven this run | P0: prove webhook delivery on prod host |
| **OneSignal** | **Sandbox** | Pass | Pass (App API health) | Optional | P1: set prod `NEXT_PUBLIC_APP_URL` |
| **Dropbox Sign** | **Disabled** | Fail (missing) | N/A | Missing | P0 if e-sign in pilot |
| **Checkr** | **Disabled** | Fail (missing) | Noop simulator only | Missing | P0 if screening in pilot |
| **Resend** | **Disabled** | N/A | Delivery **not in path** (INT-303) | N/A | P0 email path / waive |
| **Twilio** | **Disabled** | N/A | Delivery **not in path** (INT-302) | N/A | Waive SMS or ship INT-302 |
| **Google Maps** | **Disabled** | Optional missing | N/A | N/A | P2 optional |
| **Supabase** | **Production Ready** | Pass | Pass (env) | N/A | Confirm Auth redirects on prod |

---

## Per-provider pass/fail

### Stripe

| Step | Result | Detail |
| --- | --- | --- |
| 1. Env vars | **PASS** | `PAYMENT_PROVIDER=stripe`, `STRIPE_MODE=live`, `STRIPE_ALLOW_SIMULATE=false`, live secret + publishable + `whsec_` |
| 2. Credentials load | **PASS** | Loaded from `apps/web/.env.local` |
| 3. Authentication | **PASS** | Live secret accepted |
| 4. Real API call | **PASS** | Balance probe OK; cert `createCustomer` → live customer id |
| 5. Webhook config | **PARTIAL** | `STRIPE_WEBHOOK_SECRET` set; endpoint `/api/webhooks/payments/stripe`. Live Stripe event delivery **not** verified this run. Cert simulate parse fails under live+secret (expected — use Dashboard/CLI signed event) |
| 6. Integrations health | **PASS** | Production Ready |
| 7. Status label | **PASS** | Production Ready / Production |

**Endpoint to use:** `https://www.my-property-assistant.com/api/webhooks/payments/stripe`

---

### Dropbox Sign

| Step | Result | Detail |
| --- | --- | --- |
| 1. Env vars | **FAIL** | `SIGNATURE_PROVIDER` unset; no `DROPBOX_SIGN_API_KEY` / webhook secret |
| 2. Credentials load | **FAIL** | Missing |
| 3. Authentication | **FAIL** | Not configured |
| 4. Real API call | **FAIL** | Provider resolves to noop |
| 5. Webhook config | **FAIL** | Secret missing; route exists: `/api/webhooks/signature/dropbox_sign` |
| 6. Integrations health | **PASS (accurate)** | Shows Disabled |
| 7. Status label | **PASS (accurate)** | Disabled |

---

### OneSignal

| Step | Result | Detail |
| --- | --- | --- |
| 1. Env vars | **PASS** | `NOTIFICATION_PROVIDER=onesignal`, App ID + `os_v2_app_` API key |
| 2. Credentials load | **PASS** | Present |
| 3. Authentication | **PASS** | App API health OK |
| 4. Real API call | **PASS** | `GET /notifications?limit=1` authenticated |
| 5. Webhook config | **N/A / WARN** | Delivery webhooks optional; in-app idempotency used |
| 6. Integrations health | **PASS** | Status reflects non-prod app URL |
| 7. Status label | **Sandbox** | Because `NEXT_PUBLIC_APP_URL=http://localhost:3000` (not prod HTTPS) |

---

### Resend

| Step | Result | Detail |
| --- | --- | --- |
| 1–4 | **SKIP / FAIL for delivery** | No `RESEND_API_KEY`; **no send adapter** (INT-303) |
| 5. Webhook | **N/A** | |
| 6–7. Integrations | **PASS (accurate)** | Disabled — must not claim Production Ready |

---

### Twilio

| Step | Result | Detail |
| --- | --- | --- |
| 1–4 | **SKIP / FAIL for delivery** | No Twilio creds; **no SMS adapter** (INT-302) |
| 5. Webhook | **N/A** | |
| 6–7. Integrations | **PASS (accurate)** | Disabled |

---

### Google Maps

| Step | Result | Detail |
| --- | --- | --- |
| 1–4 | **FAIL (optional)** | No maps API key |
| 5. Webhook | **N/A** | |
| 6–7. Integrations | **PASS (accurate)** | Disabled — core workflows unaffected |

---

### Checkr (screening — not TransUnion)

| Step | Result | Detail |
| --- | --- | --- |
| 1. Env vars | **FAIL** | `SCREENING_PROVIDER` unset / noop; no `CHECKR_API_KEY` |
| 2. Credentials load | **FAIL** | Missing |
| 3. Authentication | **FAIL** | Not configured for live Checkr |
| 4. API call | **PARTIAL** | Noop simulator `createOrder` works locally — not a live Checkr call |
| 5. Webhook | **FAIL** | Secret missing; route: `/api/webhooks/screening/checkr` |
| 6–7. Integrations | **PASS (accurate)** | Disabled |

---

### Supabase (platform — included for completeness)

| Step | Result | Detail |
| --- | --- | --- |
| Env + service role | **PASS** | URL, anon, service role present |
| Integrations | **PASS** | Production Ready |

---

## Remaining blockers to commercial launch

| ID | Blocker | Severity | Owner action |
| --- | --- | --- | --- |
| CL-01 | Prove Stripe webhook delivery on production host (signed `payment_intent.*` event) | **P0** | Stripe Dashboard → endpoint URL above → Send test event; confirm 2xx |
| CL-02 | Outbound email not productionized (Resend INT-303 **or** verified Supabase Auth SMTP for invite/reset) | **P0** | Configure Auth SMTP / waive email / approve INT-303 |
| CL-03 | Dropbox Sign credentials + webhook if e-sign required for pilot | **P0** (if in scope) | Set `SIGNATURE_PROVIDER=dropbox_sign` + API key + webhook secret |
| CL-04 | Checkr credentials + webhook if screening required for pilot | **P0** (if in scope) | Set `SCREENING_PROVIDER=checkr` + keys |
| CL-05 | OneSignal production origin | **P1** | `NEXT_PUBLIC_APP_URL=https://www.my-property-assistant.com` + OneSignal allowed origin |
| CL-06 | Twilio SMS | **P2 / waive** | Keep Disabled unless INT-302 approved |
| CL-07 | Google Maps | **P2 / optional** | Add key only if address UX required |
| CL-08 | Rotate any Stripe live secret previously pasted in chat | **P0 security** | Roll key in Stripe Dashboard if not already done |
| CL-09 | Vercel Production env parity | **P0** | Ensure production env matches local Stripe/OneSignal/Supabase (not only local `.env.local`) |

---

## Commercial Pilot recommendation (this run)

| Path | Call |
| --- | --- |
| Design Partner (sandbox e-sign/screening OK; push + Supabase + Stripe live if webhook proven) | **CONDITIONAL GO** after CL-01 + CL-05 + CL-09 |
| Full commercial (live rent + email + e-sign + screening) | **NO-GO** until CL-01, CL-02, CL-03, CL-04, CL-09 close |

---

## Explicit non-changes

- No new providers  
- No DocuSign  
- No Resend/Twilio delivery adapters  
- No business workflow edits  
