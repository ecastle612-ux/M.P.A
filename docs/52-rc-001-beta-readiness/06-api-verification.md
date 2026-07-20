# 06 — API Verification

**Package:** RC-001  
**Date:** 2026-07-17  
**Mode:** Architecture + configuration verification. Live sandbox calls require partner/project credentials (not stored in repo).

---

## Provider matrix

| Provider | Integration | Code status | Default env | Live sandbox verified this run? |
|----------|-------------|-------------|-------------|----------------------------------|
| **Supabase Auth** | Session / memberships | Implemented | Required | Codepath + unit tests; live project assumed from prior phases |
| **Supabase Storage** | Media / vault (API-002A) | Implemented | Required | Codepath; live upload needs project buckets |
| **OneSignal** | Push (API-001) | Implemented | `NOTIFICATION_PROVIDER=noop` | Not live this run — flip to `onesignal` + keys for partner |
| **Checkr** | Screening (API-003) | Implemented | `SCREENING_PROVIDER=noop` | Not live this run — sandbox keys in `apps/web/.env.example` |
| **Dropbox Sign** | E-sign (API-004) | Implemented | `SIGNATURE_PROVIDER=noop` | Not live this run — sandbox mode without keys supported |
| **Stripe** | Payments (API-005) | Implemented | `PAYMENT_PROVIDER=noop` | Sandbox REST adapter + noop auto-settle; live keys not used this run |

---

## Webhook endpoints

| Path | Provider | Signature verify |
|------|----------|------------------|
| `/api/webhooks/screening/[provider]` | Checkr / noop | Yes |
| `/api/webhooks/signature/[provider]` | Dropbox Sign / noop | Yes |
| `/api/webhooks/payments/[provider]` | Stripe / noop | Yes |

Simulate PUT endpoints require non-production or explicit allow flags.

---

## Abstraction invariants (verified in code)

- Business modules do **not** import Checkr / Dropbox Sign / Stripe / OneSignal SDKs  
- Domain entrypoints: `ScreeningService`, `SignatureService`, `BillingService`, `NotificationService`  
- Unit tests cover noop (+ stripe sandbox) providers  

---

## Live sandbox checklist (before partner go-live)

| Step | Owner |
|------|-------|
| Create sandbox Checkr account; set `SCREENING_PROVIDER=checkr` | Admin |
| Create Dropbox Sign test app; set `SIGNATURE_PROVIDER=dropbox_sign` | Admin |
| Create Stripe test keys; set `PAYMENT_PROVIDER=stripe` | Admin |
| Optional: OneSignal app; set `NOTIFICATION_PROVIDER=onesignal` | Admin |
| Confirm webhook URLs on each provider dashboard | Admin |
| Run Scenario 2 end-to-end in sandbox | PM + Admin |
| Keep simulate flags false outside CI | Admin |

---

## Result

**Architecture verification: PASS**  
**Live provider sandbox this session: NOT EXECUTED (no secrets in agent context)** — required as production checklist item before first Design Partner activation.
