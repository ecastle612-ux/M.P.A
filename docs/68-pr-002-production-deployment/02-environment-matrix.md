# 02 — Environment Matrix

**Package:** PR-002

---

## Production required (set on Vercel)

| Variable | Status (PR-002 push) |
| --- | --- |
| `NEXT_PUBLIC_APP_URL` | Set → `https://www.my-property-assistant.com` |
| `NEXT_PUBLIC_MPA_ENV` | Set → `production` |
| `NEXT_PUBLIC_DESIGN_PARTNER_MODE` | Set → `true` |
| `NEXT_PUBLIC_MPA_VERSION` | Set → `1.0.0-beta` |
| `NEXT_PUBLIC_MPA_BUILD` | Set → `pr002` |
| `NEXT_PUBLIC_APP_NAME` | Set |
| `NEXT_PUBLIC_SUPABASE_URL` | Set (from Design Partner Supabase project) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Set |
| `SUPABASE_SERVICE_ROLE_KEY` | Set |
| `SESSION_COOKIE_NAME` | Set |
| `NOTIFICATION_PROVIDER` | Set → `onesignal` |
| `ONESIGNAL_APP_ID` | Set |
| `ONESIGNAL_API_KEY` | Set |
| `NEXT_PUBLIC_ONESIGNAL_APP_ID` | Set |

## Present but disabled / noop (Design Partner cohort)

Verified on Vercel Production env list (2026-07-19):

| Variable / provider | Classification |
| --- | --- |
| `PAYMENT_PROVIDER` / Stripe mode flags | Disabled (`noop`) |
| `EMAIL_PROVIDER` / Resend | Disabled (`noop`) — invite / password-reset email blocker |
| `SIGNATURE_PROVIDER` / Dropbox Sign | Disabled (`noop`) |
| `SCREENING_PROVIDER` / Checkr | Disabled (`noop`) |
| `SMS_PROVIDER` / Twilio | Disabled (`noop`) |
| Google Maps key | **Missing** (not in Production env list) |
| `ONESIGNAL_USER_AUTH_KEY` | Set (optional companion key) |

## Rules

- Do not set `DEV_MASTER_ADMIN_PASSWORD` in Production.
- Keep `*_ALLOW_SIMULATE=false` when a live provider is enabled.
- Prefer a dedicated production Supabase project before paid GA (current deploy may share the Design Partner project).
