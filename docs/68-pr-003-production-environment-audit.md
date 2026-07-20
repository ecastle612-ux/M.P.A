# PR-003 — Production Environment Audit & Deployment Fix

**Status:** Documentation / audit (no application logic changes)  
**Date:** 2026-07-19  
**Vercel project:** `m-p-a-web`  
**Failed deployment:** `m-p-a-1zxkqy1ho-ecastle612-uxs-projects.vercel.app` (Error)  
**Successful follow-ups:** `m-p-a-l7h99uyr8…`, `m-p-a-d6avtcldn…` (Ready)

---

## 1. Root cause

During `next build` → **Collecting page data** for `/api/auth/logout`, the module graph imports `serverEnv` (`apps/web/src/lib/env/server-env.ts`), which runs:

```ts
serverEnvSchema.parse({ ...process.env... })
```

Zod rejected the build because these required fields were **`undefined`**:

| Variable | Zod error |
| --- | --- |
| `NEXT_PUBLIC_APP_NAME` | expected string, received undefined |
| `NEXT_PUBLIC_APP_URL` | expected string, received undefined |
| `NEXT_PUBLIC_SUPABASE_URL` | expected string, received undefined |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | expected string, received undefined |
| `SESSION_COOKIE_NAME` | expected string, received undefined |

**Why they were missing:** that Error deploy ran **before** Production env vars were added to the Vercel project (env rows were created shortly after the failure). The Zod schema is intentionally strict; the build does not use defaults.

`SUPABASE_SERVICE_ROLE_KEY` is **optional** in Zod, so it did not appear in the failure list — but it is still required for many server admin paths at runtime.

**Not the cause:** provider secrets (Stripe, Resend, etc.). Those are not in the Zod hard-fail schema and default to noop when unset.

---

## 2. Validation architecture (authoritative)

| Layer | Location | Behavior |
| --- | --- | --- |
| Client Zod | `packages/shared/src/env/base-env.ts` → `clientEnvSchema` | Hard-fail if missing |
| Server Zod | same file → `serverEnvSchema` | Extends client + `SESSION_COOKIE_NAME` (required) + `SUPABASE_SERVICE_ROLE_KEY` (optional) |
| Parse sites | `apps/web/src/lib/env/client-env.ts`, `server-env.ts` | Eager `.parse()` at import time |
| Import graph | `middleware.ts`, `layout.tsx`, `robots.ts`, `sitemap.ts`, `lib/auth/*`, API routes | Triggers Zod during build page-data collection |

**Build-blocking required (must be set for any Vercel build of `@mpa/web`):**

1. `NEXT_PUBLIC_APP_NAME`
2. `NEXT_PUBLIC_APP_URL`
3. `NEXT_PUBLIC_SUPABASE_URL`
4. `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. `SESSION_COOKIE_NAME`

---

## 3. Comparison sources

| Source | Role |
| --- | --- |
| Zod schemas | Build/runtime hard requirements |
| `apps/web/.env.example` / root `.env.example` | Documented matrix |
| `apps/web/.env.local` | Local names only (12 keys present; no secrets printed) |
| `process.env[...]` across repo | Soft/provider/runtime usage |
| Vercel Production env list | Currently configured names (Production scope only) |

### `.env.local` names present (values never printed)

`NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_ONESIGNAL_APP_ID`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NOTIFICATION_PROVIDER`, `ONESIGNAL_API_KEY`, `ONESIGNAL_APP_ID`, `ONESIGNAL_USER_AUTH_KEY`, `SESSION_COOKIE_NAME`, `SUPABASE_SERVICE_ROLE_KEY`, `VERCEL_OIDC_TOKEN` (CLI-injected)

### Gaps: local vs Production Vercel

| On Vercel Production, not in `.env.local` | On `.env.local`, not needed on Vercel |
| --- | --- |
| `NEXT_PUBLIC_MPA_ENV`, `NEXT_PUBLIC_MPA_VERSION`, `NEXT_PUBLIC_MPA_BUILD`, `NEXT_PUBLIC_DESIGN_PARTNER_MODE`, provider noop flags (`PAYMENT_PROVIDER`, etc.) | `VERCEL_OIDC_TOKEN` (local CLI only) |

### Critical Vercel scope gap

All project env vars are scoped to **Production only**.  
**Preview** and **Development** have **zero** app env vars → any Preview/git deploy will hit the same Zod failure until those five (plus recommended runtime keys) are mirrored.

---

## 4. Complete inventory

Legend for **Required?**:

- **Build** — Zod hard-fail; missing → Vercel build Error  
- **Runtime-core** — app/auth/ops break without it (build may still pass)  
- **Runtime-feature** — required only when that provider is selected  
- **Optional** — safe blank / has default  
- **Dev-only** — must not be set in Production  
- **Platform** — provided by Vercel/Node; do not set manually unless overriding  

**Safe blank?** = may be empty for Design Partner Production with providers on `noop`.

### Core / session / Supabase

| Variable | Purpose | Required? | Default | Safe blank? | Module(s) | Production value description |
| --- | --- | --- | --- | --- | --- | --- |
| `NEXT_PUBLIC_APP_NAME` | Product display name / metadata | **Build** | none | No | Zod, `layout`, branding | Non-empty string, e.g. `MPA` / `M.P.A.` |
| `NEXT_PUBLIC_APP_URL` | Canonical public origin | **Build** | none (some call sites fall back to localhost only if not using Zod path) | No | Zod, robots, sitemap, metadata, signatures | `https://www.my-property-assistant.com` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project API URL | **Build** | none | No | Zod, auth, middleware, packages/supabase | Production (or Design Partner) Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon (publishable) key | **Build** | none | No | Zod, auth, middleware | Matching anon key for that project |
| `SESSION_COOKIE_NAME` | Auth/session cookie name | **Build** | none | No | Zod, auth cookies | Stable name, e.g. `mpa_session` |
| `SUPABASE_SERVICE_ROLE_KEY` | Server admin Supabase client | **Runtime-core** (Zod optional) | none | No for real ops | `lib/auth/server`, scripts, media/admin | Service role key — server-only secret |

### Deployment meta (Private Beta)

| Variable | Purpose | Required? | Default | Safe blank? | Module(s) | Production value description |
| --- | --- | --- | --- | --- | --- | --- |
| `NEXT_PUBLIC_MPA_ENV` | Env badge label | Optional (recommended prod) | inferred from `VERCEL_ENV` / `NODE_ENV` | Yes | `deployment-meta.ts` | `production` |
| `NEXT_PUBLIC_MPA_VERSION` | Version badge | Optional | `0.0.0-dev` | Yes | `deployment-meta.ts` | e.g. `1.0.0-beta` |
| `NEXT_PUBLIC_MPA_BUILD` | Build id badge | Optional | Vercel SHA / deployment id | Yes | `deployment-meta.ts` | short build label or leave blank |
| `NEXT_PUBLIC_DESIGN_PARTNER_MODE` | Private Beta chrome | Optional (recommended) | off unless `true` | Yes | `deployment-meta.ts` | `true` for Design Partner |
| `NEXT_PUBLIC_FEEDBACK_URL` | Feedback link | Optional | placeholder UI | Yes | `deployment-meta.ts` | Absolute HTTPS URL or blank |

### Notifications (OneSignal)

| Variable | Purpose | Required? | Default | Safe blank? | Module(s) | Production value description |
| --- | --- | --- | --- | --- | --- | --- |
| `NOTIFICATION_PROVIDER` | Select notifier | Optional | `noop` | Yes (`noop`) | notifications registry | `onesignal` for Design Partner push |
| `ONESIGNAL_APP_ID` | Server App ID | **Runtime-feature** if provider=`onesignal` | none | Only if noop | onesignal-provider, status | OneSignal App UUID |
| `ONESIGNAL_API_KEY` | App API Key (`os_v2_app_…`) | **Runtime-feature** if onesignal | none | Only if noop | onesignal-provider | App API Key secret |
| `ONESIGNAL_REST_API_KEY` | Legacy alias for API key | Optional alias | none | Yes | onesignal-provider | Prefer `ONESIGNAL_API_KEY` |
| `NEXT_PUBLIC_ONESIGNAL_APP_ID` | Client push App ID | **Runtime-feature** if onesignal | none | Only if noop | `client-push.ts`, UI | Same UUID as server App ID |
| `ONESIGNAL_USER_AUTH_KEY` | Optional User Auth key | Optional | none | Yes | status / advanced | Leave blank unless needed |

### Payments (Stripe)

| Variable | Purpose | Required? | Default | Safe blank? | Module(s) | Production value description |
| --- | --- | --- | --- | --- | --- | --- |
| `PAYMENT_PROVIDER` | Select payments | Optional | `noop` | Yes | payments registry | `noop` until live; then `stripe` |
| `STRIPE_SECRET_KEY` | Stripe secret | **Runtime-feature** if stripe | none | Yes if noop | stripe-provider, billing | `sk_live_…` or `sk_test_…` |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing | **Runtime-feature** if live webhooks | sandbox may skip | Yes if noop | stripe-provider | `whsec_…` |
| `STRIPE_MODE` | sandbox/live hint | Optional | inferred from key | Yes | stripe-provider, status | `sandbox` or live posture |
| `STRIPE_ALLOW_SIMULATE` | Allow simulate webhooks | Optional | blocked in prod unless `true` | Prefer `false` in prod | webhook route | `false` for real prod |
| `STRIPE_PUBLISHABLE_KEY` | Server-side publishable | Optional | none | Yes if noop | examples / future client | `pk_…` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Client publishable | Optional | none | Yes if noop | examples | `pk_…` |
| `STRIPE_API_BASE_URL` | Override API host | Optional | Stripe API | Yes | stripe-provider | Leave blank |
| `STRIPE_CONNECT_MODE` | Connect posture | Optional | documented | Yes | `.env.example` | e.g. `platform` when used |

### Screening (Checkr)

| Variable | Purpose | Required? | Default | Safe blank? | Module(s) | Production value description |
| --- | --- | --- | --- | --- | --- | --- |
| `SCREENING_PROVIDER` | Select screening | Optional | `noop` | Yes | screening registry | `noop` or `checkr` |
| `CHECKR_API_KEY` | Checkr API key | **Runtime-feature** if checkr | none | Yes if noop | checkr-provider | Checkr secret |
| `CHECKR_WEBHOOK_SECRET` | Webhook verify | **Runtime-feature** if live webhooks | sandbox may skip | Yes if noop | checkr-provider | Webhook secret |
| `CHECKR_MODE` | sandbox/live | Optional | sandbox if unset/keyless | Yes | checkr-provider | `sandbox` until certified |
| `CHECKR_SANDBOX` | Alternate sandbox flag | Optional | — | Yes | checkr-provider | `true` / unset |
| `CHECKR_PACKAGE` | Package code | Optional | `tasker_pro` | Yes | checkr-provider | Package slug |
| `CHECKR_ALLOW_SIMULATE` | Simulate in prod | Optional | blocked unless `true` | Prefer `false` | webhook route | `false` in prod |
| `CHECKR_REQUIRE_LIVE` | Disable sandbox fallback | Optional | off | Yes | checkr-provider | `true` only when forcing live |
| `CHECKR_API_BASE_URL` | Override host | Optional | Checkr API | Yes | checkr-provider | Leave blank |

### Signatures (Dropbox Sign / HelloSign aliases)

| Variable | Purpose | Required? | Default | Safe blank? | Module(s) | Production value description |
| --- | --- | --- | --- | --- | --- | --- |
| `SIGNATURE_PROVIDER` | Select e-sign | Optional | noop-ish | Yes | signature registry | `noop` or `dropbox_sign` |
| `DROPBOX_SIGN_API_KEY` | API key | **Runtime-feature** if dropbox_sign | none | Yes if noop | dropbox-sign-provider | API key secret |
| `HELLOSIGN_API_KEY` | Legacy alias | Optional alias | none | Yes | dropbox-sign-provider | Prefer DROPBOX_* |
| `DROPBOX_SIGN_WEBHOOK_SECRET` | Webhook verify | **Runtime-feature** if live | may skip sandbox | Yes if noop | dropbox-sign-provider | Webhook secret |
| `HELLOSIGN_WEBHOOK_SECRET` | Legacy alias | Optional | none | Yes | dropbox-sign-provider | Prefer DROPBOX_* |
| `DROPBOX_SIGN_MODE` | sandbox/live | Optional | sandbox if no key | Yes | dropbox-sign-provider | `sandbox` until certified |
| `HELLOSIGN_MODE` | Legacy mode | Optional | — | Yes | dropbox-sign-provider | Prefer DROPBOX_* |
| `DROPBOX_SIGN_ALLOW_SIMULATE` | Simulate in prod | Optional | blocked unless `true` | Prefer `false` | webhook / signature routes | `false` in prod |
| `DROPBOX_SIGN_API_BASE_URL` | Override host | Optional | HelloSign v3 | Yes | dropbox-sign-provider | Leave blank |

### Email (Resend) / SMS (Twilio) / Maps

| Variable | Purpose | Required? | Default | Safe blank? | Module(s) | Production value description |
| --- | --- | --- | --- | --- | --- | --- |
| `EMAIL_PROVIDER` | Select email | Optional | empty / noop | Yes | provider-status | `noop` or `resend` |
| `RESEND_API_KEY` | Resend secret | **Runtime-feature** if resend | none | Yes if noop | provider-status | Resend API key |
| `RESEND_MODE` | Mode label | Optional | inferred | Yes | provider-status | `sandbox` / `live` |
| `SMS_PROVIDER` | Select SMS | Optional | noop | Yes | provider-status | `noop` until Twilio |
| `TWILIO_ACCOUNT_SID` | Twilio SID | **Runtime-feature** if twilio | none | Yes if noop | provider-status | Account SID |
| `TWILIO_AUTH_TOKEN` | Twilio token | **Runtime-feature** if twilio | none | Yes if noop | provider-status | Auth token |
| `TWILIO_MODE` | Mode label | Optional | — | Yes | provider-status | sandbox/live |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Maps client key | Optional | none | Yes | provider-status | Browser Maps key |
| `GOOGLE_MAPS_API_KEY` | Alternate | Optional | none | Yes | provider-status | Same purpose |
| `GOOGLE_MAPS_KEY` | Alternate | Optional | none | Yes | provider-status | Same purpose |

### Development-only / do not set in Production

| Variable | Purpose | Required? | Safe blank? | Module(s) | Notes |
| --- | --- | --- | --- | --- | --- |
| `DEV_MASTER_ADMIN_PASSWORD` | Local master-admin bootstrap | **Dev-only** | Must be blank in prod | `bootstrap-master-admin.ts` | **Unset in Production** |
| `APP_ENV` | Dev master-admin gating with `NODE_ENV` | Optional / Dev | Yes | `packages/shared/.../master-admin.ts` | Do not set `production` incorrectly in local |

### Platform / CI / QA (not Vercel Production app config)

| Variable | Purpose | Required? | Notes |
| --- | --- | --- | --- |
| `NODE_ENV` | Node environment | **Platform** | Set by Next/Vercel |
| `VERCEL_ENV` | `production` / `preview` / `development` | **Platform** | Used by deployment-meta |
| `VERCEL_GIT_COMMIT_SHA` | Build id fallback | **Platform** | Optional badge |
| `VERCEL_DEPLOYMENT_ID` | Build id fallback | **Platform** | Optional badge |
| `VERCEL_OIDC_TOKEN` | Local CLI link | Local only | Do not manually add to Production |
| `CI` | Playwright CI | QA | `qa/e2e` |
| `PLAYWRIGHT_*`, `QA_E2E_*` | E2E harness | QA | Not for Production app runtime |
| `GITHUB_SHA`, `GITHUB_EVENT_NAME` | QA summary | QA | CI only |

---

## 5. Required vs optional matrix (Production Design Partner)

### Must set (build + core runtime)

| Variable | Why |
| --- | --- |
| `NEXT_PUBLIC_APP_NAME` | Zod build |
| `NEXT_PUBLIC_APP_URL` | Zod build + canonical URLs |
| `NEXT_PUBLIC_SUPABASE_URL` | Zod build + Auth |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Zod build + Auth |
| `SESSION_COOKIE_NAME` | Zod build + cookies |
| `SUPABASE_SERVICE_ROLE_KEY` | Server admin / vault / privileged paths |

### Strongly recommended (Design Partner chrome + push)

| Variable | Why |
| --- | --- |
| `NEXT_PUBLIC_MPA_ENV=production` | Badge / env clarity |
| `NEXT_PUBLIC_DESIGN_PARTNER_MODE=true` | Private Beta UI |
| `NEXT_PUBLIC_MPA_VERSION` | Support/debug |
| `NEXT_PUBLIC_MPA_BUILD` | Support/debug |
| `NOTIFICATION_PROVIDER=onesignal` | Push |
| `ONESIGNAL_APP_ID` | Push server |
| `ONESIGNAL_API_KEY` | Push server |
| `NEXT_PUBLIC_ONESIGNAL_APP_ID` | Push client |

### Safe as noop / blank for Design Partner cohort

`PAYMENT_PROVIDER`, Stripe keys, `SCREENING_PROVIDER`, Checkr keys, `SIGNATURE_PROVIDER`, Dropbox keys, `EMAIL_PROVIDER`, Resend, `SMS_PROVIDER`, Twilio, Maps keys — **unless** that feature is enabled.

### Must NOT set in Production

`DEV_MASTER_ADMIN_PASSWORD`

---

## 6. Missing variables vs the failed deploy

### Variables that caused the observed failure

Exactly the five Zod **Build** fields above (all undefined at build time).

### Variables that would fail *after* those are fixed

| If still missing | Failure mode |
| --- | --- |
| `SUPABASE_SERVICE_ROLE_KEY` | Build **passes**; runtime errors on service-role paths (admin client throws / media / bootstrap) |
| `NOTIFICATION_PROVIDER=onesignal` without App ID/API key / public App ID | Build passes; push enrollment/send fails at runtime |
| `PAYMENT_PROVIDER=stripe` without `STRIPE_SECRET_KEY` | Build passes; payment calls throw |
| Same pattern for Checkr / Dropbox Sign / Resend when provider ≠ noop | Runtime feature failures, not Zod build failures |
| Zod Build vars missing on **Preview** scope | Next Preview/git deploy Error (same ZodError) |

### Current Production Vercel posture (names only)

**Present:** Zod five + service role + Design Partner meta + OneSignal set + provider selectors/modes for noop rails.

**Absent (OK for noop Design Partner):** Stripe/Checkr/Dropbox/Resend/Twilio/Maps secrets.

**Absent (scope risk):** same keys on Preview/Development environments.

---

## 7. Vercel deployment checklist

Copy into the Vercel project → Settings → Environment Variables.  
Mark each box only after the name exists for the target environment (**Production** minimum; mirror Build keys to **Preview**).

### Core (Build — non-negotiable)

- [ ] `NEXT_PUBLIC_APP_NAME`
- [ ] `NEXT_PUBLIC_APP_URL`
- [ ] `SESSION_COOKIE_NAME`

### Supabase (Build + runtime)

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`

### Design Partner / deployment meta

- [ ] `NEXT_PUBLIC_MPA_ENV`
- [ ] `NEXT_PUBLIC_MPA_VERSION`
- [ ] `NEXT_PUBLIC_MPA_BUILD`
- [ ] `NEXT_PUBLIC_DESIGN_PARTNER_MODE`
- [ ] `NEXT_PUBLIC_FEEDBACK_URL` *(optional)*

### OneSignal

- [ ] `NOTIFICATION_PROVIDER`
- [ ] `ONESIGNAL_APP_ID`
- [ ] `ONESIGNAL_API_KEY`
- [ ] `NEXT_PUBLIC_ONESIGNAL_APP_ID`
- [ ] `ONESIGNAL_USER_AUTH_KEY` *(optional)*
- [ ] `ONESIGNAL_REST_API_KEY` *(optional alias — skip if `ONESIGNAL_API_KEY` set)*

### Stripe *(only when enabling payments)*

- [ ] `PAYMENT_PROVIDER`
- [ ] `STRIPE_SECRET_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`
- [ ] `STRIPE_MODE`
- [ ] `STRIPE_ALLOW_SIMULATE` *(use `false` in real prod)*
- [ ] `STRIPE_PUBLISHABLE_KEY` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` *(as needed)*

### Checkr *(only when enabling screening)*

- [ ] `SCREENING_PROVIDER`
- [ ] `CHECKR_API_KEY`
- [ ] `CHECKR_WEBHOOK_SECRET`
- [ ] `CHECKR_MODE`
- [ ] `CHECKR_ALLOW_SIMULATE` *(use `false` in real prod)*
- [ ] `CHECKR_PACKAGE` *(optional)*

### Dropbox Sign *(only when enabling e-sign)*

- [ ] `SIGNATURE_PROVIDER`
- [ ] `DROPBOX_SIGN_API_KEY`
- [ ] `DROPBOX_SIGN_WEBHOOK_SECRET`
- [ ] `DROPBOX_SIGN_MODE`
- [ ] `DROPBOX_SIGN_ALLOW_SIMULATE` *(use `false` in real prod)*

### Resend / Twilio / Maps *(optional until enabled)*

- [ ] `EMAIL_PROVIDER`
- [ ] `RESEND_API_KEY`
- [ ] `RESEND_MODE`
- [ ] `SMS_PROVIDER`
- [ ] `TWILIO_ACCOUNT_SID`
- [ ] `TWILIO_AUTH_TOKEN`
- [ ] `TWILIO_MODE`
- [ ] `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

### Explicitly unset

- [ ] Confirm `DEV_MASTER_ADMIN_PASSWORD` is **not** present in Production

### Environment scopes

- [ ] Production: all Build + Runtime-core (+ Design Partner providers as needed)
- [ ] Preview: at least the five Zod Build vars (+ Supabase keys if previews must auth)
- [ ] Redeploy after any env change (`vercel deploy --prod` or Deployments → Redeploy)

---

## 8. Build success verification

| Check | Result |
| --- | --- |
| Failed deploy Zod missing five Build vars | Confirmed in logs (`Collecting page data` / `/api/auth/logout`) |
| After Production env added | Subsequent Production deploys **Ready** |
| With current Production env (Zod five + service role present) | **Build should succeed** on Vercel Production |
| Preview without env | **Will fail** the same ZodError until mirrored |

No application validation was weakened for this audit.

---

## 9. Remaining deployment blockers (non-env)

1. Cloudflare DNS for `www` / apex (custom domain) — see PR-002  
2. OneSignal dashboard origin → production host  
3. Supabase Auth redirect allow-list → production host  
4. Resend domain (or waive invite/password email)  
5. Preview env empty (git/PR builds)  
6. GitHub `main` may not match the working tree used for successful local uploads  

---

## 10. Deliverable index

| Deliverable | Location |
| --- | --- |
| This audit | `docs/68-pr-003-production-environment-audit.md` |
| Production env template (names + comments only) | `apps/web/.env.production.example` |
| Local/dev template | `apps/web/.env.example` |
| Zod source of truth | `packages/shared/src/env/base-env.ts` |
