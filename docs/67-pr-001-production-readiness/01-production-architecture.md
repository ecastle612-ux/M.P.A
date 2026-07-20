# 01 — Production Architecture

**Package:** PR-001  
**Status:** Approved (EP-006)

---

## Topology

```
Browser (www.my-property-assistant.com)
  → Vercel (Next.js apps/web)
      → Supabase Auth / Postgres / Storage / Realtime
      → Providers (Stripe, OneSignal, Resend, Twilio, Dropbox Sign, Checkr, Google Maps)
```

| Layer | Production | Staging | Development |
| --- | --- | --- | --- |
| App URL | `https://www.my-property-assistant.com` | `https://staging.my-property-assistant.com` (or Vercel preview) | `http://localhost:3000` |
| Supabase | Dedicated production project | Dedicated staging project | Local or shared dev project |
| Provider modes | Live credentials; `*_ALLOW_SIMULATE=false` | Sandbox credentials | `*_PROVIDER=noop` or sandbox |
| Secrets | Vercel Production env | Vercel Preview/Staging env | `.env.local` (never committed) |

## Hard separation rules

1. No production credentials in development `.env.local`.
2. No sandbox Stripe/Checkr/Dropbox Sign keys in production.
3. `DEV_MASTER_ADMIN_PASSWORD` must be unset in staging/production.
4. `NEXT_PUBLIC_APP_URL` must match the canonical host for that environment.
5. OneSignal / Stripe / Dropbox Sign / Checkr webhook URLs must point at the same environment’s host.

## Deployment meta (runtime)

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_MPA_ENV` | `development` \| `staging` \| `production` \| `preview` |
| `NEXT_PUBLIC_MPA_VERSION` | Semver / marketing version (e.g. `1.0.0-beta`) |
| `NEXT_PUBLIC_MPA_BUILD` | Build/SHA identifier |
| `NEXT_PUBLIC_DESIGN_PARTNER_MODE` | `true` shows Private Beta chrome |
| `NEXT_PUBLIC_FEEDBACK_URL` | Optional feedback link (placeholder allowed) |
