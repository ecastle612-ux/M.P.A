# 02 — Playwright Architecture

**Package:** QA-001  
**Status:** Draft — Ready for Approval

---

## Placement (recommendation)

| Option | Path | Pros |
|--------|------|------|
| **A (recommended)** | `qa/e2e/` top-level workspace package | Clear internal boundary; no risk of shipping in Next bundle |
| B | `apps/web/e2e/` | Closer to app; easier imports of test IDs |

**Recommendation:** `qa/e2e` as a private workspace package (`@mpa/qa-e2e`) with Playwright as a devDependency. Product apps never import it.

```
qa/
  e2e/
    package.json
    playwright.config.ts
    tests/
      smoke/
      workflows/
      visual/
      a11y/
      perf/
    src/
      fixtures/
      pages/          # Page Objects
      workflows/      # Composable scenario helpers
      utils/
    baselines/        # Visual baselines (git-lfs if large)
    reports/          # gitignored
```

---

## Playwright config pillars

| Concern | Design |
|---------|--------|
| Browsers | Chromium primary; Firefox/WebKit in nightly |
| Base URL | `PLAYWRIGHT_BASE_URL` (local / preview / staging) |
| Retries | 1 on CI smoke; 2 on nightly for known flake classes only |
| Trace | `on-first-retry` |
| Screenshot | `only-on-failure` (+ explicit visual project) |
| Video | Off in Phase 1; optional nightly later |
| Workers | Parallel by default; serial for shared-seed suites |
| Timeouts | Global + per-action budgets documented in config |

Projects example:

```
chromium-smoke
chromium-workflows
chromium-visual
chromium-a11y
chromium-perf
```

---

## Environment model

| Env | Use |
|-----|-----|
| Local | `pnpm --filter @mpa/qa-e2e test` against `pnpm dev` + local Supabase |
| PR | Ephemeral preview URL **or** CI-started app + Supabase local |
| Nightly | Staging or dedicated QA project |
| RC | Staging freeze candidate |

**Never** point destructive workflow tests at production.

Secrets (CI): test user passwords, Supabase service role for seed only in ephemeral envs, Stripe test keys if payment smoke enabled. Stored in GitHub Actions secrets; never committed.

---

## Auth fixtures

```
fixtures/auth.ts
  asPm()
  asResident()
  asVendor()
  asOwner()
  asNewUser()          # setup wizard path
```

Strategies (Approve one primary):

| Strategy | Notes |
|----------|-------|
| **Storage state** | Login once per role → `playwright/.auth/*.json` | Fast; recommended |
| API seed session | Service role creates session cookie | Faster but couples to auth internals |
| UI login every test | Slowest; use only for auth suite itself |

Test users live in seed SQL / bootstrap script (fake PII per docs/16).

---

## Page Object Model

```
pages/
  auth.page.ts
  setup-wizard.page.ts
  properties.page.ts
  property-detail.page.ts
  units.page.ts
  tenants.page.ts
  leases.page.ts
  maintenance.page.ts
  communications.page.ts
  financials.page.ts
  portals/resident/*.ts
  portals/owner/*.ts
  shell/ops-center.page.ts
  shell/command-center.page.ts
  profile.page.ts
  settings.page.ts
```

Rules:

- Selectors prefer `getByRole` / `getByLabel` / `data-testid` for stable controls
- No CSS-class-coupled selectors for Canopy internals
- Assertions live in tests or workflow helpers — pages expose actions + locators

---

## Test data

| Mechanism | Purpose |
|-----------|---------|
| Global seed | Baseline org + roles |
| Per-test factories | Unique property/tenant names with run id |
| Cleanup hooks | Soft-delete or dedicated disposable org prefix `qa-*` |
| Network fixtures | Optional route mocking for flaky third parties (Stripe/OneSignal) |

Media uploads (API-002A): when available, use small fixture images in `qa/e2e/fixtures/media/`.

---

## Tagging & selection

```bash
npx playwright test --grep @smoke
npx playwright test --grep @nightly
npx playwright test --grep @visual
```

Mapping to CI in [07](./07-test-reporting.md) / [09](./09-implementation-slices.md).

---

## Relationship to existing CI

Current [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) runs boundaries, lint, typecheck, build, unit tests — **no E2E**.

QA-001 extends CI with separate jobs so unit failures remain fast to diagnose:

```
verify (existing)
e2e-smoke (PR / main)
e2e-nightly (schedule)
e2e-rc (workflow_dispatch / release tag)
```

---

## Local developer UX

```
pnpm qa:e2e:smoke
pnpm qa:e2e:ui          # Playwright UI mode
pnpm qa:e2e:report      # open last HTML report
```

Document in package README after Approve (implementation).
