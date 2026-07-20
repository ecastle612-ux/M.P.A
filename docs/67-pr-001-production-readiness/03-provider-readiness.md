# 03 — Provider Readiness Audit

**Package:** PR-001  
**Status:** Approved (EP-006)  
**Note:** Live credentials are operator-owned. This matrix documents required posture; Settings → Integrations surfaces runtime status.

---

## Matrix

| Provider | Env keys | Sandbox OK for DP? | Production ready when | Callback / webhook / origin |
| --- | --- | --- | --- | --- |
| **Supabase** | `NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY` | Dev project only | Dedicated prod project + Auth URLs | Auth redirect allow-list; Storage CORS |
| **Stripe** | `PAYMENT_PROVIDER=stripe`, `STRIPE_*`, `STRIPE_MODE` | Yes (`sandbox`) | Live keys + `STRIPE_ALLOW_SIMULATE=false` | Webhook: `https://www…/api/…/stripe` (see app routes); Checkout success/cancel = app URL |
| **OneSignal** | `NOTIFICATION_PROVIDER=onesignal`, `ONESIGNAL_*`, `NEXT_PUBLIC_ONESIGNAL_APP_ID` | Separate test app OK | Prod app + origin `https://www.my-property-assistant.com` | Site URL / allowed origins; SW under `/` |
| **Resend** | `EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, `RESEND_MODE` | Test domain OK | Verified domain + SPF/DKIM | From-domain DNS records |
| **Twilio** | `TWILIO_*` / `SMS_PROVIDER` | Trial OK | Approved numbers + consent | Status callbacks if used |
| **Dropbox Sign** | `SIGNATURE_PROVIDER=dropbox_sign`, `DROPBOX_SIGN_*` | Yes (`sandbox`) | Live + simulate off | Webhook + redirect URLs on prod host |
| **Checkr** | `SCREENING_PROVIDER=checkr`, `CHECKR_*` | Yes (`sandbox`) | Live + simulate off | Webhook secret on prod host |
| **Google Maps** | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Restrict by HTTP referrer | Referrer = prod host | API key HTTP referrer restrictions |

## Design Partner recommended posture

| Provider | Recommendation for first cohort |
| --- | --- |
| Supabase | Production project |
| Stripe | Sandbox acceptable until first paid rent collection |
| OneSignal | Production app with prod origin |
| Resend | Required for invite/password email (or document waive) |
| Dropbox Sign / Checkr | Sandbox acceptable |
| Twilio / Maps | Optional; show disconnected professionally |

## Operator verification

1. Open Settings → Integrations — confirm status labels match intent.
2. Re-run `pnpm trust:certify` / `pnpm launch:certify` after credentials are loaded.
3. Send one password-reset and one invite email from production.
4. Complete one sandbox Stripe webhook delivery to the production host (or staging first).
