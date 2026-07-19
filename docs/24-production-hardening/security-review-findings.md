# Security Review Findings (EP-008 Phase 1)

**Status:** Implemented / Documented (2026-07-19)
**Parent:** [24 Production Hardening](./index.md) · [ADR-015](../18-decision-log/adr-015-production-hardening-operational-excellence.md)
**Scope:** Headers, CSP, cookies, session handling, permissions, role boundaries,
sensitive routes, environment-variable exposure, authentication redirects.

This is the §4.7 review deliverable. It records the audit and the hardening applied in
Phase 1, plus findings deferred to their own gated follow-ups. Builds on the Phase 2.1
[Security Hardening Notes](../22-phase-2-scaffold-review/security-hardening-notes.md).

---

## 1. HTTP Security Headers

Configured in `apps/web/next.config.ts`, applied to all routes.

| Header | Status |
|---|---|
| `Content-Security-Policy` | Present (see §2) |
| `Referrer-Policy: strict-origin-when-cross-origin` | Present |
| `X-Frame-Options: DENY` | Present |
| `X-Content-Type-Options: nosniff` | Present |
| `Permissions-Policy` (camera/mic/geo/usb/payment off) | Present |
| `Cross-Origin-Opener-Policy: same-origin` | Present |
| `Cross-Origin-Resource-Policy: same-site` | Present |
| `Strict-Transport-Security` | ✅ **Added (Phase 1)** — `max-age=63072000; includeSubDomains; preload` |
| `Reporting-Endpoints` (`csp-endpoint`) | ✅ **Added (Phase 1)** |

**Applied:** HSTS added (production-only effect over HTTPS; no dev impact). CSP reporting
endpoint declared for the Reporting API.

## 2. Content Security Policy

- **Current enforced policy** retains `'unsafe-inline'` and `'unsafe-eval'` (compatibility
  with Next.js + Turbopack HMR), as flagged in Phase 2.1.
- **Applied (Phase 1):** added `report-uri /api/security/csp-report` and
  `report-to csp-endpoint`, plus a violation sink at `POST /api/security/csp-report` that
  logs violations (no PII) through the observability layer. This makes real-world
  violations observable — the prerequisite for tightening safely.
- **Deferred follow-up (own gate):** move to a nonce-based `script-src`, remove
  `'unsafe-eval'`, and reduce `'unsafe-inline'`. Requires middleware nonce plumbing and
  regression testing across all routes; not done in Phase 1 to honor "no regressions."

## 3. Cookies & Session Handling

- Auth/session cookies are managed by the Supabase SSR helpers. Server + middleware set
  `httpOnly`, `sameSite=lax`, `path=/`, and `secure` in production only (correct for local
  HTTP dev). Session introspection (`/api/auth/session`) is `no-store`.
- **Finding (open, tracked):** the browser client (`apps/web/src/lib/auth/client.ts`) does
  not set `cookieOptions.name`, so it persists the session under the default
  `sb-<ref>-auth-token` cookie, while the server client and `middleware.ts` read
  `mpa_session`. Effect: a browser sign-in is not recognized server-side (protected routes
  redirect to `/login`); server-side actor attribution for audit events is therefore
  best-effort until resolved.
  - **Why not fixed in Phase 1:** aligning the storage key interacts with `httpOnly`
    semantics (JS-set vs server-set cookies of the same name) and changes auth session
    behavior — it needs its own focused design + regression testing. Recommended as the
    next gated hardening item under this program.

## 4. Permissions & Role Boundaries

- Shared role/authorization model lives in `@mpa/shared` (role constants, metadata
  extraction, active-role resolution, access checks) with unit tests.
- Server checks run in `middleware.ts` and the protected app layout; middleware auth
  resolution is now **fail-open** (a transient backend error no longer 500s every route).
- **Deferred follow-up:** explicit negative-path authorization tests in CI (from Phase 2.1
  gaps) — recommended next.

## 5. Sensitive Routes

- App-owned auth endpoints (`/api/auth/session`, `/api/auth/logout`, `/api/auth/events`)
  now enforce per-IP rate limits and emit audit events; `logout` and `events` validate
  request `Origin`.
- Primary login brute-force protection remains at the Supabase Auth (GoTrue) layer since
  sign-in is a direct client→Supabase call; the app-edge `/api/auth/events` limiter + audit
  provides attempt visibility and throttling of attempt reporting.

## 6. Environment Variable Exposure

- Validated split remains correct: `client-env.ts` (public `NEXT_PUBLIC_*` only) vs
  `server-env.ts` (service-role/server-only). No secret is read in client modules. No new
  required env vars were introduced by Phase 1.

## 7. Authentication Redirects

- Redirect logic in `middleware.ts` is unchanged: unauthenticated → `/login` on protected
  routes; authenticated → `/portal` from `/login` and `/forgot-password`. Request-id is now
  propagated on redirect and normal responses via `x-request-id`.

---

## Summary of Phase 1 changes

- **Added:** HSTS, CSP reporting (`report-to`/`report-uri` + sink), request-id
  propagation, fail-open middleware auth, rate limiting + audit on auth endpoints.
- **Unchanged (intentionally):** enforced CSP directives, cookie attributes, redirect
  logic, schema, and all business modules.
- **Deferred (own gate):** strict nonce-based CSP; cookie storage-key alignment;
  negative-path authz tests in CI; dependency vulnerability scan stage.
