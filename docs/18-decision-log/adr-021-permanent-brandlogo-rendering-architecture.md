# ADR-021: Permanent BrandLogo Rendering Architecture

## Status

Accepted

## Date

2026-07-20

## Context

ADR-019 established the two approved logo assets and adaptive light/dark contrast mapping (UX-007). Despite that foundation, branding regressions continue because individual screens still choose size, tone overrides, spacing, and ad-hoc lockups — and because build tooling does not hard-fail direct asset usage.

M.P.A. needs a permanent presentation architecture so the logo can be redesigned once and update everywhere, and so unreadably small, wrong-contrast, or favicon-as-logo failures cannot re-enter before Design Partner testing.

## Decision

Adopt **BR-001 — M.P.A. Brand Rendering System** as the permanent logo presentation architecture, including approved Amendments A–E:

1. **Single API** — `<BrandLogo purpose="…" />` is the only approved React way to display M.P.A. branding. Non-React channels use branding-package helpers with the same purpose/tone contract.
2. **No direct assets outside branding** — Zero `logo-light.png` / `logo-dark.png` / `mpa-logo.*` / SVG logos / favicon-as-logo usage outside the branding system.
3. **Automatic surface tone** — Asset selection comes from surface context (or helper tone for email/PDF); pages do not pick light/dark logos.
4. **Purpose-based rendering** — e.g. `login`, `drawer`, `sidebar`, `header`, `splash`, `email`, `pdf`, `browser`.
5. **Four presentation modes (Amendment A)** — Hero, Standard, Compact, Icon Only (icon only for browser/PWA/notification/launcher — never drawer/login).
6. **No Embedded Text Rule (Amendment B)** — Below 80px mark width, automatically switch to responsive lockup; no silent shrink.
7. **Single source of truth (Amendment C)** — `BrandLogo` owns asset, variant, size, theme, typography, spacing.
8. **Visual regression protection (Amendment D)** — CI screenshots for login, drawer, sidebar, header, password reset, emails; fail on unexpected drift.
9. **Design Partner standard (Amendment E)** — Recognizable, readable, crisp, correct contrast, consistent spacing, no duplicates, every surface on BrandLogo before partner demos.
10. **Hard minimums** — Icon-only ≥ 48px; Navigation/compact mark floors; Authentication ≥ 160px; Splash ≥ 220px.
11. **Build protection** — ESLint + CI path scan fail the build on direct logo imports outside the branding package.
12. **Certification page** — Dev-only audit reports PASS/FAIL with violation list.

ADR-019 remains the asset + contrast mapping authority. ADR-021 owns the **presentation and enforcement** layer.

Authoritative package: `docs/85-br-001-brand-rendering-system/` (including `07-amendments.md`).

## Consequences

### Easier

- One place to change brand presentation forever
- Regressions become CI failures instead of partner-testing discoveries
- New screens inherit correct branding without manual asset/size/tone decisions

### Harder

- Migration of remaining `<Logo>` / lockup / path call sites
- Compact sizes must use lockups instead of unreadably small square marks
- Email/PDF must stay on helpers, not raw URLs in feature code
- Visual baselines must be maintained in Playwright

## Alternatives Considered

1. **Patch the current broken screen only** — Rejected.
2. **Keep `<Logo size>` forever without purposes/floors/lint** — Rejected.
3. **New logo artwork / more than two assets** — Out of scope unless a future ADR amends ADR-019.
4. **Allow favicons as UI logos for “compact” cases** — Rejected.
