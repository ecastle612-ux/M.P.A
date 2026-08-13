# POST MERGE INTEGRATION VALIDATION

**Status:** **BLOCKED**  
**Date:** 2026-08-13  
**Re-run:** 2026-08-13 (second pass after claimed merges)  
**Main SHA validated:** `4e46338d781a96d782268cf668c0961092efd0c8`  
**Production:** NO DEPLOYMENT  

---

## Merge scope

Intended post-merge scope (claimed merged by Owner; verified against GitHub + `origin/main`):

| PR | Intended content | GitHub state at re-run |
|----|------------------|------------------------|
| [#162](https://github.com/ecastle612-ux/M.P.A/pull/162) | Annual Billing Discount | **OPEN** — `mergedAt: null`, not an ancestor of `main` |
| [#163](https://github.com/ecastle612-ux/M.P.A/pull/163) | FO Vendor Workflow Completion | **OPEN** (draft) — `mergedAt: null`, not an ancestor of `main` |
| [#164](https://github.com/ecastle612-ux/M.P.A/pull/164) | Post Review Merge Readiness Certification | **OPEN** (draft) — `mergedAt: null`, not an ancestor of `main` |

`main` tip remains Wave D merge:

`4e46338` — *Merge pull request #160 … customer-activation-polish-wave-d*

No merge commits for #162 / #163 / #164 exist on `origin/main`.

---

## Exact blockers

1. **PR #162 is not merged into `main`.** Annual discount application code and `docs/71` are absent.
2. **PR #163 is not merged into `main`.** `/facility/vendors` page, API, and entitlements are absent.
3. **PR #164 is not merged into `main`.** Pre-merge readiness record is absent from `main`.

**Required action:** Complete the GitHub merges of #162 and #163 (mark ready / merge; #164 optional docs), then re-run this validation.

Branch tips (present remotely, not on `main`):

| PR | Head SHA |
|----|----------|
| #162 | `39601244599483a9bab89af64ec42bda5f184275` |
| #163 | `077e97dc7f09b9d47686f479fd176e0763e68eed` |
| #164 | `89bb5d523ca15a176277f244982a51fd5b58dfff` |

---

## PR #162 verification (against current `main`)

| Check | Result | Evidence on `main` |
|-------|--------|--------------------|
| Annual pricing constants updated (`ANNUAL_PREPAID_MULTIPLIER`, `56640` / `104640`) | **FAIL** | `unit-volume.ts` still has pre-discount `FO_ANNUAL_USD = 590`; no `PM_BASE_ANNUAL_CENTS` |
| Monthly pricing unchanged | **PASS** (baseline) | Pre-merge monthly bases still $59 / $59 / $109 on `main` |
| Annual = monthly × 12 × 0.80 | **FAIL** | Discount formula not on `main` (exists only on #162 tip) |
| Checkout Price ID env key mapping | **PASS** (pre-existing) | Env key names already wired; annual *amounts* in app code not updated on `main` |
| Quote / customer copy aligned to 20% | **FAIL** | #162 copy/amount changes not on `main` |
| `docs/71-annual-billing-discount` | **FAIL** | Missing on `main` |

Contrast — #162 tip **does** contain `ANNUAL_PREPAID_MULTIPLIER = 0.8`, `PM_BASE_ANNUAL_CENTS = 56640`, `FO_ANNUAL_CENTS = 56640`, `COMPLETE_BASE_ANNUAL_CENTS = 104640`.

---

## PR #163 verification (against current `main`)

| Check | Result | Evidence on `main` |
|-------|--------|--------------------|
| `/facility/vendors` exists | **FAIL** | Path missing in git tree |
| `GET /api/facility/vendors` exists | **FAIL** | Path missing |
| `POST /api/facility/vendors` exists | **FAIL** | Path missing |
| `facility.operations` entitlement controls access | **FAIL** | No `/facility/vendors` route entitlement on `main` |
| `vendor_vendors` infrastructure reused | **N/A** | FO facade not present; PM path still uses existing service |
| Production build registers FO vendor routes | **FAIL** | Build route table has `/pm/vendors` only |

---

## Environment verification (read-only)

No environment variables were modified in this re-run.

### Billing — Vercel Production keys

All eight unit-volume Price env keys remain present for preview + production (`type=sensitive`). Missing keys: **none**.

### Billing — Stripe Price objects (existence / amounts only; no mutations)

| Role | Active | `unit_amount` | Interval |
|------|--------|---------------|----------|
| PM base monthly | true | 5900 | month |
| Unit block monthly | true | 3900 | month |
| Unit block annual | true | 46800 | year |
| PM base annual (20%) | true | 56640 | year |
| FO annual (20%) | true | 56640 | year |
| Complete annual (20%) | true | 104640 | year |

FO/Complete monthly Prices remain active at prior $59 / $109 amounts (verified via API; plaintext IDs omitted where they match Cursor-injected secrets).

**Note:** Ops already remapped annual env keys to 20% Prices; application `main` still quotes pre-discount annual amounts until #162 merges and Production is later deployed.

---

## Unauthorized-change check

| Item | Result |
|------|--------|
| Stripe Prices modified by this validation | **NO** |
| Existing subscriptions touched | **NO** |
| Database migrations on `main` since `4e46338` | **NONE** |
| RBAC / entitlement key files changed on `main` since `4e46338` | **NONE** |
| Unrelated refactors on `main` | **NONE** (`main` unchanged since Wave D) |

---

## Test results (current `main` @ `4e46338`, re-run)

Baseline health **without** #162/#163:

| Check | Result | Detail |
|-------|--------|--------|
| Shared tests | **PASS** | 43 files · **241** tests · 0 failed |
| Web tests | **PASS** | 45 files · **232** tests · 0 failed |
| TypeScript (`shared` + `web`) | **PASS** | |
| Lint (`web`) | **PASS** | 0 errors |
| Production build | **PASS** | No `/facility/vendors` (expected while #163 unmerged) |
| Failures | **None** | |
| Blocking warnings | **None** | |
| Flaky tests | **None** | |

---

## Deployment status

| Item | Status |
|------|--------|
| Production deployment | **NO DEPLOYMENT** |
| Stripe modifications | **NONE** |
| Subscription migration | **NONE** |
| Database migrations | **NONE** |
| RBAC changes | **NONE** |

---

## Final verdict

### BLOCKED

Re-run confirms PRs #162, #163, and #164 are still **not merged** into `main`. Feature integration cannot be certified.

After the Owner completes the GitHub merges, re-run this post-merge validation before Production certification.
