# POST MERGE INTEGRATION VALIDATION

**Status:** **BLOCKED**  
**Date:** 2026-08-13  
**Main SHA validated:** `4e46338d781a96d782268cf668c0961092efd0c8`  
**Production:** NO DEPLOYMENT  

---

## Merge scope

Intended post-merge scope:

| PR | Intended content | GitHub state at validation time |
|----|------------------|---------------------------------|
| [#162](https://github.com/ecastle612-ux/M.P.A/pull/162) | Annual Billing Discount (20% prepaid) | **OPEN** — not merged (`mergedAt: null`) |
| [#163](https://github.com/ecastle612-ux/M.P.A/pull/163) | FO Vendor Workflow Completion | **OPEN** — not merged (`mergedAt: null`) |
| [#164](https://github.com/ecastle612-ux/M.P.A/pull/164) | Post Review Merge Readiness Certification (docs) | **OPEN** — not merged (`mergedAt: null`) |

All three PRs report `mergeable: MERGEABLE` / `mergeStateStatus: CLEAN` and prior CI green, but **none have been merged into `main`**.

Therefore post-merge integration cannot be certified.

---

## Exact blockers

1. **PR #162 is not on `main`.** Annual discount constants / record absent.
2. **PR #163 is not on `main`.** FO vendor page, API, and entitlements absent.
3. **PR #164 (certification docs) is not on `main`.**

**Required action:** Owner merges #162 and #163 (and optionally #164) into `main`, then re-run this post-merge validation.

---

## PR #162 verification (against current `main`)

| Check | Result | Evidence |
|-------|--------|----------|
| `ANNUAL_PREPAID_MULTIPLIER` / `PM_BASE_ANNUAL_CENTS=56640` on main | **FAIL** | `unit-volume.ts` on `main` still uses pre-discount annual model (`FO_ANNUAL_USD = 590`; no `56640` / `104640` cents constants) |
| `docs/71-annual-billing-discount` on main | **FAIL** | Path does not exist on `origin/main` |
| Merge-conflict alteration of pricing | **N/A** | No merge occurred |

---

## PR #163 verification (against current `main`)

| Check | Result | Evidence |
|-------|--------|----------|
| `/facility/vendors` page | **FAIL** | `apps/web/src/app/(app)/facility/vendors/page.tsx` missing on `main` |
| `GET/POST /api/facility/vendors` | **FAIL** | `apps/web/src/app/api/facility/vendors/route.ts` missing on `main` |
| Route entitlement `/facility/vendors` | **FAIL** | No `facility/vendors` entry in `route-entitlements.ts` on `main` |
| Production build route registration | **FAIL** | Build route table has `/pm/vendors` only; **no** `/facility/vendors` |
| Merge-conflict alteration of vendor workflow | **N/A** | No merge occurred |

---

## Environment verification (read-only)

No environment variables were modified.

### Billing — Vercel Production (`m-p-a-web`)

| Env key | Present (preview + production) | Notes |
|---------|--------------------------------|-------|
| `STRIPE_PRICE_PM_BASE_MONTHLY` | **YES** (`sensitive`) | Monthly key present; `updatedAt` unchanged since initial set |
| `STRIPE_PRICE_PM_BASE_ANNUAL` | **YES** (`sensitive`) | Remapped for 20% annual Prices (ops); awaiting app merge + deploy |
| `STRIPE_PRICE_FO_PROFESSIONAL_MONTHLY` | **YES** (`sensitive`) | |
| `STRIPE_PRICE_FO_PROFESSIONAL_ANNUAL` | **YES** (`sensitive`) | Remapped for 20% annual Prices (ops) |
| `STRIPE_PRICE_COMPLETE_BASE_MONTHLY` | **YES** (`sensitive`) | |
| `STRIPE_PRICE_COMPLETE_BASE_ANNUAL` | **YES** (`sensitive`) | Remapped for 20% annual Prices (ops) |
| `STRIPE_PRICE_UNIT_BLOCK_MONTHLY` | **YES** (`sensitive`) | |
| `STRIPE_PRICE_UNIT_BLOCK_ANNUAL` | **YES** (`sensitive`) | |

Missing unit-volume Price env keys: **none**.

### Billing — Stripe Price objects (existence only; no mutations)

Read-only Stripe API checks against the Production-mapped catalog (plaintext Price IDs omitted from this record where they match Cursor-injected secret values):

| Role | Active | `unit_amount` | Interval |
|------|--------|---------------|----------|
| PM base monthly | true | 5900 | month |
| FO professional monthly | true | 5900 | month |
| Complete base monthly | true | 10900 | month |
| Unit block monthly | true | 3900 | month |
| Unit block annual | true | 46800 | year |
| PM base annual (20%) | true | 56640 | year |
| FO annual (20%) | true | 56640 | year |
| Complete annual (20%) | true | 104640 | year |

Monthly Price objects remain active at prior amounts. No Stripe changes performed in this validation.

### FO Vendors — permissions / routes on `main`

| Check | Result |
|-------|--------|
| FO vendor routes registered on main | **NO** (pre-merge) |
| FO vendor APIs available on main | **NO** (pre-merge) |
| RBAC keys unchanged | **YES** — no RBAC edits on main in this window; #163 (unmerged) also introduces no new capability keys |

---

## Test results (current `main` @ `4e46338`)

Baseline health of `main` **without** #162/#163:

| Check | Result | Detail |
|-------|--------|--------|
| Shared tests | **PASS** | 43 files · **241** tests · 0 failed |
| Web tests | **PASS** | 45 files · **232** tests · 0 failed |
| TypeScript (`shared` + `web`) | **PASS** | |
| Lint (`web`) | **PASS** | 0 errors |
| Production build | **PASS** | No `/facility/vendors` (expected pre-merge) |
| Blocking warnings | **None** | |
| Flaky tests | **None** | |

Counts are lower than the pre-merge combined tree (243 / 238) because #162/#163 tests are not on `main` yet.

---

## Deployment status

| Item | Status |
|------|--------|
| Production deployment | **NO DEPLOYMENT** |
| Stripe Price changes | **NONE** |
| Subscription migration | **NONE** |
| Database migrations | **NONE** |
| RBAC changes | **NONE** |

---

## Final verdict

### BLOCKED

**Blockers:** PR #162, PR #163 (and PR #164 docs) remain **unmerged**. `main` still contains pre-discount annual pricing and has no FO vendor workflow surface.

After Owner merges #162 and #163 into `main`, re-run post-merge integration validation before Production certification.
