# QA-001 — Automated Quality Assurance (@mpa/qa-e2e)

Internal Playwright platform. **Never import this package from product apps.**

## Commands

```bash
pnpm qa:e2e:smoke      # P0 smoke (@smoke)
pnpm qa:e2e:visual     # Visual regression
pnpm qa:e2e:a11y       # Accessibility
pnpm qa:e2e:perf       # Performance probes
pnpm qa:e2e:nightly    # Nightly tags
pnpm qa:e2e:rc         # Release candidate suite
pnpm qa:e2e:report     # Open HTML report
pnpm --filter @mpa/qa-e2e seed   # Isolated qa-* org + users
```

## Auth

1. Copy `.env.example` → `.env.local` (or export env vars).
2. Point `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` at a **non-production** project.
3. Run `pnpm --filter @mpa/qa-e2e seed`.
4. Set `QA_E2E_AUTH_ENABLED=true` and role passwords.
5. Re-run smoke.

Without auth env, public P0 tests (login, redirects, a11y, visual) still run and gate PRs.

## Isolation

Seed creates organizations named `qa-<runId>-…`. Do not run destructive suites against developer personal data.

## Visual baselines

Baselines live under `tests/**/*-snapshots/` and are committed to git.

```bash
# Update after intentional UI change (review the diff in PR)
pnpm qa:e2e:visual -- --update-snapshots

# Full viewport matrix (390/768/1024/1440/1920)
QA_E2E_FULL_VISUAL=true pnpm qa:e2e:visual -- --update-snapshots
```

CI runs on Linux. Prefer regenerating baselines in CI (or a Linux environment) before merging visual changes so font/rendering diffs do not flake.

## Flake policy (slice 9)

| Rule | Policy |
|------|--------|
| Retries | CI: 1 retry (`playwright.config.ts`); local: 0 |
| Quarantine | Flaky tests get `@flake` + ticket; must not stay on `@smoke` without owner |
| Parallel | `fullyParallel: true`; CI workers = 2 |
| Artifacts | HTML report, traces on first retry, screenshots on failure; CI retention 7–30 days |
| Cleanup | `test-results/`, `playwright-report/`, `reports/` are gitignored |

## Docs

See `docs/47-qa-001-automated-quality-assurance/`.
