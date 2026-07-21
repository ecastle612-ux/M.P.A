# BR-001 — Build Protection

## Goal

If anyone imports or hardcodes logo assets outside the branding system, **the build fails**.

Developers must use:

```tsx
<BrandLogo purpose="…" />
```

(or the email/PDF branding helpers for non-React channels).

## Layer 1 — ESLint

Extend `apps/web` (and any other app packages that render UI) with `no-restricted-imports` / `no-restricted-syntax` rules that error on:

- String literals / imports containing `logo-light.png`, `logo-dark.png`, `mpa-logo`
- Imports of raw branding asset modules from feature folders
- Prefer allowlisting only the branding implementation file(s)

Also restrict importing deprecated `<Logo />` after cutover (or mark deprecated with a fail rule once migration completes).

## Layer 2 — CI path scan (belt and suspenders)

Add a repo script (e.g. `scripts/check-brand-imports.mjs`) run in CI / `pnpm` verify:

```text
FAIL if matches outside allowlist:
  logo-light.png
  logo-dark.png
  mpa-logo
  /branding/logo-
```

Allowlist (exact paths owned by BR-001):

- `packages/shared/src/branding.ts` (or successor module)
- BrandLogo implementation file(s)
- Email/PDF branding helpers inside the branding system
- Tests/fixtures for the branding package
- Documentation under `docs/` (optional exclude)
- Generated email snapshots only if they assert helper output (prefer helpers over raw paths)

Exit non-zero on any violation.

## Layer 3 — Certification route smoke (optional CI)

In non-production, a smoke test can assert the certification harness reports PASS, or at least that the route builds.

## Developer message

On failure, print:

```text
Brand assets must be rendered via <BrandLogo /> (BR-001 / ADR-021).
Do not import logo-light.png, logo-dark.png, or mpa-logo.* outside the branding system.
```

## Rollout

1. Land BrandLogo + migrate call sites  
2. Enable rules as `error` (not warning)  
3. Keep rules permanent — branding regressions become compile-time/CI failures, not QA discoveries  
