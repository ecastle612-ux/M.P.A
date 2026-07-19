# Deployment Readiness Runbook (EP-008 Phase 1)

**Status:** Documented (2026-07-19)
**Parent:** [24 Production Hardening](./index.md) · [ADR-015](../18-decision-log/adr-015-production-hardening-operational-excellence.md)
**Scope:** Environment variables, domain configuration, Supabase redirects, caching, build
settings, and reproducible deployment for the current app. Provider-specific items
(e.g. OneSignal origin) are **Deferred** until integrated.

> Procedural runbook (§4.9). No application code or schema is introduced here.

---

## 1. Environment Variables

Validated at runtime via `@mpa/shared` schemas (`client-env.ts` / `server-env.ts`). Client
vars must be `NEXT_PUBLIC_*`; server-only secrets must never appear in client modules.

| Variable | Plane | Notes |
|---|---|---|
| `NEXT_PUBLIC_APP_NAME` | Public | Display name |
| `NEXT_PUBLIC_APP_URL` | Public | Canonical app origin (used for redirects/links) |
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Must be `https://` in production (enforced CSP `connect-src` allows `https:`/`wss:` only) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server | Secret; server env only; never client |
| `SESSION_COOKIE_NAME` | Server | Session cookie base name (`mpa_session`) |

- No new required variables were introduced by EP-008 Phase 1.
- Source of truth for local dev values: `.env.example` / `apps/web/.env.example`; CI uses
  dummy values in `.github/workflows/ci.yml`.

## 2. Domain & Supabase Redirect Configuration

- Set `NEXT_PUBLIC_APP_URL` to the production origin.
- In Supabase Auth settings, set **Site URL** and **Additional Redirect URLs** to the
  production origin(s). Locally these are `http://localhost:3000` (`supabase/config.toml`).
- **CSP constraint (important):** because the enforced CSP allows only `https:`/`wss:` (and
  `'self'`) for `connect-src`, the Supabase URL **must be HTTPS** in any browser-facing
  deployment. A plain-HTTP Supabase is blocked by the browser (see
  [Security Review Findings](./security-review-findings.md)).

## 3. Caching

- Auth/session responses are `Cache-Control: no-store` (session, logout, events,
  csp-report). Do not cache authenticated responses at the CDN.
- Static assets follow Next.js defaults; the PWA service worker registers in production
  only.

## 4. Build Settings

- Node ≥ 22, pnpm 11 (`packageManager` pinned). Build: `pnpm build` (Turbopack).
- CI gate (`.github/workflows/ci.yml`): boundaries → circular → deps → lint → typecheck →
  build → test. A deploy must be cut only from a green pipeline.

## 5. Reproducible Deployment Checklist

1. Green CI on the release commit.
2. Production env vars set in the host (all of §1), secrets from the secret manager.
3. Supabase migrations applied to the target project (`supabase db push`).
4. Supabase Auth Site URL + redirect URLs match `NEXT_PUBLIC_APP_URL`.
5. `NEXT_PUBLIC_SUPABASE_URL` is HTTPS.
6. Post-deploy smoke test: home → login → sign-in → protected route → logout.
7. Confirm security headers present (HSTS, CSP + `Reporting-Endpoints`) via `curl -I`.

---

## Deferred (own gate)

- OneSignal allowed origin configuration and other provider-specific deploy steps.
- Automated post-deploy smoke tests and CSP report monitoring dashboards.
