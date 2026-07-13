# Foundation Readiness Assessment

**Phase:** 2.1 — Foundation Hardening  
**Date:** 2026-07-13  
**Scope:** Platform foundation only (no business features)

---

## Executive Summary

The Phase 2 scaffold has been hardened significantly and now includes:

- strict TypeScript baseline across the monorepo
- import-boundary and circular-dependency enforcement
- strengthened web security headers and enforced CSP baseline policy
- improved session endpoint caching controls and logout origin checks
- accessibility upgrades for overlays, tabs, and reduced-motion behavior
- CI quality gates beyond lint/typecheck/build (boundaries + dependency graph)
- observability placeholder architecture (logging, analytics, errors, performance, audit logging)

The foundation is close to production-ready for feature development, with a few high-value hardening items still recommended before broad Phase 3 delivery.

---

## Grades

| Area | Grade | Notes |
|------|-------|-------|
| Architecture | **A-** | Clean monorepo boundaries and package surfaces; good layering |
| Security | **A-** | Strong baseline headers/session handling and enforced CSP baseline |
| Accessibility | **B+** | Focus trap + keyboard improvements done; automated a11y tests missing |
| Performance | **B** | Better shell/code-splitting and SW caching baseline; no budgets yet |
| Maintainability | **A-** | Strict TS and boundary rules reduce debt risk |
| Developer Experience | **B+** | Better scripts/docs; local toolchain still not automated |
| Scalability | **B+** | Package/domain separation is sound; no load/perf gates yet |
| Testability | **B** | Shared authorization tests added; web route and UI coverage still limited |
| CI/CD | **B+** | Good foundational checks; lockfile and security scanning need tightening |
| PWA Readiness | **B** | Manifest + SW strategy present; icon/update UX still placeholder-level |

---

## What Was Hardened in Phase 2.1

### Import Boundaries

- Added dependency-cruiser config: `.dependency-cruiser.cjs`
- Added root scripts:
  - `check:boundaries`
  - `check:circular`
- Added package public API enforcement (`exports`) and side-effect declarations
- Restricted deep/private package imports in `apps/web/eslint.config.mjs`
- Added policy doc: `import-boundary-policy.md`

### TypeScript Strictness

- Strengthened `tsconfig.base.json` with:
  - `noImplicitReturns`
  - `noUnusedLocals`
  - `noUnusedParameters`
  - `exactOptionalPropertyTypes`
  - `noImplicitThis`
  - `noPropertyAccessFromIndexSignature`
  - `useUnknownInCatchVariables`
- Tightened path aliases to package public entrypoints (no wildcard internals)
- Enforced `no-explicit-any` as an ESLint error

### Security

- Added security headers in `apps/web/next.config.ts`:
  - `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, COOP/CORP
- Added enforced `Content-Security-Policy` baseline
- Improved auth routes:
  - no-store cache control for session endpoints
  - logout origin validation to mitigate CSRF vectors
- Removed client-writable role cookie from role switching flow
- Split env validation into client/server modules to avoid mixed exposure

### Security Concerns Identified

1. CSP currently allows `'unsafe-inline'`/`'unsafe-eval'`; tighten with nonce/strict-dynamic once telemetry confirms compatibility.
2. Session/sign-out routes need explicit integration tests for origin and cache behavior.
3. Secret rotation/runbook process is not yet documented in ops docs.

### Accessibility

- Implemented focus trap + Escape close behavior for modal/drawer
- Added better ARIA semantics (`aria-haspopup`, `aria-expanded`, tab/panel linkage)
- Added keyboard arrow navigation for tabs
- Added reduced-motion CSS policy (`prefers-reduced-motion`)
- Improved spinner screen-reader semantics (`role="status"`, `aria-live`)

### Performance

- Command palette now lazy-loaded in top navigation
- Added service worker caching strategy:
  - cache-first static assets
  - network-first documents/pages with offline fallback
  - versioned cache cleanup on activate
- Enabled compression and modern image formats in Next config

### Design System Implementation Quality

- Expanded Canopy token coverage in the theme provider (colors, spacing, radius, motion)
- Improved primitive accessibility behavior (focus traps, reduced motion, semantic status regions)
- Preserved no-business-logic rule inside `@mpa/ui`
- Remaining improvement: visual regression tests for primitives are still missing

### CI / Quality Gates

- CI now runs:
  - lint
  - import-boundary checks
  - circular checks
  - typecheck
  - format check
  - dependency validation (`npm ls`)
  - build
  - tests (`pnpm test`)

### Testing Baseline

- Added vitest baseline in `packages/shared`
- Added authorization helper unit tests for role extraction and access checks

### Observability Placeholders

- Added architecture notes:
  - `observability-placeholders.md`
- Added placeholder implementation contracts:
  - `apps/web/src/lib/observability/*`

---

## Remaining Improvements Before Phase 3 (Prioritized)

## P0 (expensive later if skipped)

1. **Commit lockfile and switch CI install to frozen lockfile**
   - Current CI uses non-frozen install due missing lockfile.
   - Must lock dependency graph before feature velocity increases.
2. **Add automated accessibility checks in CI**
   - At least one smoke path with axe/playwright on shell routes.
3. **Expand baseline tests to web auth routes and shell a11y smoke**
   - Add API route tests for `/api/auth/session` and `/api/auth/logout`
   - Add shell rendering and keyboard smoke tests
4. **Finalize secure font loading strategy for Canopy**
   - Self-host approved fonts and prevent layout shift regressions.
5. **Tighten CSP to remove unsafe directives**
   - Move from compatibility CSP to nonce-based strict CSP.

## P1 (high impact)

6. **Role/authorization hardening docs + tests**
   - Add negative-path tests for unauthorized role access.
7. **Add security scanning stage in CI**
   - Dependency vulnerability scan with policy threshold.
8. **Harden service worker update UX**
   - Add user-visible update prompt and stale-cache recovery path.
9. **Formalize shell error boundary strategy**
   - Ensure route-level + global fallback consistency.
10. **Add performance budgets**
   - Route JS budget, LCP budget, and simple CI assertions.
11. **Replace PWA placeholder icons and add install UX acceptance checks**
   - Ensure install banners and icon assets meet platform requirements.

## P2 (good next)

12. Add pre-commit hooks for local quality checks.
13. Add architecture lint for app-layer boundaries inside `apps/web`.
14. Add standardized ADR template automation in docs tooling.

---

## Risk Register

| Risk | Cost if deferred | Priority |
|------|------------------|----------|
| Compatibility CSP remains too permissive | XSS blast radius stays larger than required | P0 |
| No lockfile freeze | Drift and non-reproducible CI/builds | P0 |
| No automated a11y tests | Accessibility regressions compound quickly | P0 |
| Incomplete test coverage in web shell/auth routes | Feature phases introduce silent regressions | P0 |
| Placeholder font loading | CLS/perf and design inconsistency | P0 |

---

## Phase 3 Entry Gate Recommendation

Proceed to Phase 3 feature development when all are true:

- [ ] lockfile committed and CI uses frozen lockfile
- [ ] strict CSP tightening plan approved
- [ ] shell/auth a11y smoke tests active in CI
- [ ] web auth/shell tests active in CI
- [ ] Canopy font-loading implementation approved

If any P0 remains unresolved, feature work can proceed only behind explicit risk acceptance.
