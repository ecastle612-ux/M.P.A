# Security Hardening Notes (Phase 2.1)

## Authentication Framework Review

- Login/logout/session scaffold is in place and isolated from business logic.
- Server-side user checks exist in middleware and protected app layout.
- Session introspection endpoint is `no-store` to reduce cache leakage risk.

## Middleware Review

- Middleware validates auth state before `/dashboard` routes.
- Redirect logic prevents authenticated users from re-entering `/login`.
- Cookie updates are delegated through Supabase SSR client in middleware-safe way.

## Environment Variable Handling

- Env validation split into:
  - `client-env.ts` for browser-safe public vars only
  - `server-env.ts` for server/runtime-only vars
- Secret-like variables are not read in client modules.

## Secure Headers

Configured in `apps/web/next.config.ts`:

- `Content-Security-Policy`
- `Referrer-Policy`
- `X-Frame-Options`
- `X-Content-Type-Options`
- `Permissions-Policy`
- `Cross-Origin-Opener-Policy`
- `Cross-Origin-Resource-Policy`

## CSP Recommendations

Current CSP is compatibility-focused and still includes unsafe directives to avoid runtime breakage during scaffold phase.

Before production:

1. move to nonce-based script policy
2. remove `'unsafe-eval'`
3. reduce `'unsafe-inline'` where possible
4. add reporting endpoint + monitoring

## Cookie Strategy Review

- Removed client-written role cookie preference.
- Role preference persistence now uses client-side local storage only (non-sensitive UX preference).
- Auth/session cookies remain managed by Supabase SSR helpers.

## Session Management Review

- Session checks run in middleware and server layout.
- Logout endpoint uses POST and validates request origin.
- Session endpoint prevents cache persistence with `Cache-Control: no-store`.

## Secret Handling Review

- Service role key is validated only in server env module.
- No secret access in client components.
- Remaining gap: key rotation and incident runbook documentation.

## Role Authorization Framework Review

- Shared role model lives in `@mpa/shared`:
  - role constants
  - metadata extraction
  - active-role resolution
  - role-access checks
- Remaining gap: explicit negative-path authorization tests in CI.

## Remaining Security Concerns

1. CSP is not strict enough yet (unsafe directives still enabled).
2. No automated security regression tests for auth routes.
3. No dependency vulnerability scan stage in CI yet.
