# 02 — Environment Matrix

**Package:** PR-002  
**Updated:** 2026-07-28 (RC1 Critical **C4**)  
**Companion:** [RC1 Stripe SaaS runbook](../00-governance/rc1-stripe-saas-operator-runbook.md) · [RC1 closeout](../00-governance/rc1-critical-blocker-closeout.md)

---

## Production required (set on Vercel)

| Variable | RC1 requirement |
| --- | --- |
| `NEXT_PUBLIC_APP_URL` | `https://www.my-property-assistant.com` |
| `NEXT_PUBLIC_MPA_ENV` | `production` |
| `NEXT_PUBLIC_DESIGN_PARTNER_MODE` | `true` (beta chrome until Commercial Launch) |
| `NEXT_PUBLIC_MPA_VERSION` | `1.0.0-rc1` |
| `NEXT_PUBLIC_MPA_BUILD` | Deploy SHA or `rc1` |
| `NEXT_PUBLIC_APP_NAME` | Set |
| `NEXT_PUBLIC_SUPABASE_URL` | `mpa-prod` project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Set |
| `SUPABASE_SERVICE_ROLE_KEY` | Set |
| `SESSION_COOKIE_NAME` | Set |
| `NOTIFICATION_PROVIDER` | `onesignal` (push commercial cert abandoned — keep enrollment path) |
| `ONESIGNAL_APP_ID` | Set |
| `ONESIGNAL_API_KEY` | Set |
| `NEXT_PUBLIC_ONESIGNAL_APP_ID` | Set |

### RC1 Critical — SaaS billing + credential email (must be live for self-serve)

| Variable | RC1 requirement |
| --- | --- |
| `SAAS_BILLING_PROVIDER` | `stripe` (not `noop`) |
| `STRIPE_SECRET_KEY` | Live or env-dedicated test key |
| `STRIPE_SAAS_WEBHOOK_SECRET` | SaaS endpoint secret only |
| `STRIPE_SAAS_TRIAL_DAYS` | e.g. `14` |
| `STRIPE_SAAS_PRICE_FOUNDER_MONTHLY` / `_ANNUAL` (and aliases) | Catalog IDs |
| `STRIPE_SAAS_PRICE_PROFESSIONAL_MONTHLY` / `_ANNUAL` | Catalog IDs |
| `STRIPE_SAAS_PRICE_BUSINESS_MONTHLY` / `_ANNUAL` | Catalog IDs |
| `STRIPE_SAAS_PRICE_ENTERPRISE_MONTHLY` / `_ANNUAL` | Catalog IDs (if sold) |
| `EMAIL_PROVIDER` | `resend` (not `noop`) |
| `RESEND_API_KEY` | Production |
| `EMAIL_FROM` | Verified domain |
| `EMAIL_REPLY_TO` | Optional |
| `EMAIL_ENVIRONMENT` | `production` |

Webhook URL (Stripe SaaS rail):

`https://www.my-property-assistant.com/api/webhooks/saas/stripe`

## Present but disabled / noop (Design Partner cohort)

| Variable / provider | Classification |
| --- | --- |
| `PAYMENT_PROVIDER` / Stripe rent | May remain constrained until rent ops cert |
| `SIGNATURE_PROVIDER` / SignWell | Enable when signing sold |
| `SCREENING_PROVIDER` / Checkr | Optional for beta |
| `SMS_PROVIDER` / Twilio | Not in production send path |
| `FIN003_TRANSFERS_ENABLED` | Keep off until destination readiness (H3) |
| Google Maps key | Optional |

## Rules

- Do not set `DEV_MASTER_ADMIN_PASSWORD` in Production.
- Keep `*_ALLOW_SIMULATE=false` when a live provider is enabled.
- Prefer a dedicated production Supabase project before paid GA (current: `mpa-prod`).
- Never reuse SaaS webhook secret with rent or Connect webhooks.

## C4 attestation

| Check | ☐ |
|-------|---|
| All RC1 Critical SaaS + Resend vars set on Vercel Production | ☐ |
| Webhook endpoint registered and delivering | ☐ |
| Operator: ________________ Date: ________ | ☐ |
