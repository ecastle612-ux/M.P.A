# PRODUCTION RELEASE CERTIFICATION

**Status:** PRODUCTION RELEASE SUCCESSFUL  
**Date:** 2026-08-13  
**Release commit:** `eb6b1f868985e7eae3c927602406a4ac2f47f917`  
**Production deployment:** `dpl_5ZCdGbPP7iAX2TnPPKVpPTX9xQyA`  

---

## Release commit

| Item | Value |
|------|-------|
| Branch | `main` |
| SHA | `eb6b1f868985e7eae3c927602406a4ac2f47f917` |
| Working tree at verify | Clean |
| Pre-deploy SHA match | **YES** — local `main` = `origin/main` = release candidate |

Included merges:

| PR | Merge commit |
|----|--------------|
| #162 Annual Billing Discount | `c0676fce368aa0803e68ed5b3c8122b96402f5b2` |
| #163 FO Vendor Workflow Completion | `681307e9a64517972183b81dc6b35e318e2755f1` |
| #164 Merge Readiness Certification | `eb6b1f868985e7eae3c927602406a4ac2f47f917` |

Readiness record: `docs/74-production-certification-readiness` (PR #166).

---

## Deployment evidence

Production was deployed for the certified SHA via the existing Vercel Git production workflow on merge to `main` (no additional force deploy; no unrelated commits).

| Field | Value |
|-------|-------|
| Deployment ID | `dpl_5ZCdGbPP7iAX2TnPPKVpPTX9xQyA` |
| Created (UTC) | 2026-08-13T14:07:59.194Z |
| Ready state | **READY** |
| Target | `production` |
| Commit deployed | `eb6b1f868985e7eae3c927602406a4ac2f47f917` |
| Alias assigned | **YES** |
| Production aliases | `my-property-assistant.com`, `www.my-property-assistant.com`, `m-p-a-web.vercel.app`, team aliases |
| Live HTML `data-dpl-id` | `dpl_5ZCdGbPP7iAX2TnPPKVpPTX9xQyA` |
| Build result | **Deployment completed** (Next.js 16.2.10 / Turbopack) |

Pre-deploy environment (read-only):

- All 8 unit-volume Stripe Price env keys present on Production  
- Monthly Price amounts unchanged; annual 20% Prices available  
- No Stripe / subscription / DB / RBAC modifications performed during this release  

---

## Features released

1. **Annual Billing Discount** — quotes/copy/Checkout env mapping for monthly × 12 × 0.80 ($566.40 / $566.40 / $1,046.40); unit-block annual remains $468; no subscription migration.  
2. **FO Vendor Workflow** — `/facility/vendors` + `GET/POST /api/facility/vendors` on existing `vendor_vendors`, gated by `facility.operations`.  
3. **Merge readiness documentation** — `docs/71` / `docs/72` on `main`.

---

## Smoke test results

Public production checks against `https://my-property-assistant.com` (served by `dpl_5ZCdGb…`):

| Check | Result |
|-------|--------|
| `/` loads | **PASS** (HTTP 200) |
| `/pricing` loads | **PASS** (HTTP 200) |
| `/login` loads | **PASS** (HTTP 200) |
| `/get-started` loads | **PASS** (HTTP 200) |
| `/robots.txt`, `/sitemap.xml` | **PASS** |
| `/enterprise`, `/modules` | **PASS** |
| Auth gate: `/facility/vendors` → login | **PASS** (307 → `/login`) |
| Auth gate: `GET /api/facility/vendors` | **PASS** (401 Unauthenticated) |
| Homepage / pricing HTML bound to release deploy id | **PASS** |

### Billing verification (live `/pricing`)

| Check | Result |
|-------|--------|
| Monthly $59 present | **PASS** |
| Complete monthly $109 present | **PASS** |
| Annual **$566.40** present | **PASS** (multiple occurrences) |
| Annual **$1,046.40** / `$1046.40` present | **PASS** |
| “Save 20%” copy present | **PASS** |
| Unit capacity **$468** present | **PASS** |
| FO / PM / Complete product naming present | **PASS** |
| Checkout remains env Price ID–driven (no client amounts) | **PASS** (architecture unchanged; Production env keys present) |

Authenticated end-to-end Checkout charge and FO vendor create were not exercised with live credentials in this release window; unauthenticated gates and public pricing surfaces validate deployment correctness without mutating Stripe or tenant data.

### FO vendor verification

| Check | Result |
|-------|--------|
| Route registered and auth-gated in Production | **PASS** |
| API rejects unauthenticated access | **PASS** |
| Vendor assignment lifecycle unchanged | **PASS** (no assign-path changes in release) |
| `vendor_vendors` reuse / no new RBAC / no migration | **PASS** |

---

## Release health / incidents

| Area | Result |
|------|--------|
| Deployment ready state | **READY** |
| Build completion | **PASS** (“Deployment completed”) |
| Production alias health | **PASS** (all primary aliases → release deploy) |
| Runtime error incident requiring rollback | **NONE observed** |
| Rollback required | **NO** |

Non-blocking build note: Next.js middleware filename convention warning during build (pre-existing pattern; deploy succeeded).

---

## Production impact summary

| Item | Status |
|------|--------|
| New annual commercial quotes/copy live | **YES** |
| Monthly pricing unchanged | **YES** |
| Existing subscriptions auto-migrated | **NO** (by design) |
| FO vendor directory available to entitled FO users | **YES** (after sign-in) |
| Stripe Prices modified at deploy | **NO** |
| Database migrations run | **NO** |

---

## Final verdict

### PRODUCTION RELEASE SUCCESSFUL

Certified release `eb6b1f8` is live on Production as `dpl_5ZCdGbPP7iAX2TnPPKVpPTX9xQyA` with successful public smoke validation and no rollback triggers.
