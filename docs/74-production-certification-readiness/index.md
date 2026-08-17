# PRODUCTION CERTIFICATION READINESS

**Status:** READY FOR PRODUCTION DEPLOYMENT APPROVAL  
**Date:** 2026-08-13  
**Release candidate SHA:** `eb6b1f868985e7eae3c927602406a4ac2f47f917`  
**Production deployment:** **NOT PERFORMED** (approval gate only)  

---

## Release scope

| PR | Scope | State | Merge commit |
|----|-------|-------|--------------|
| [#162](https://github.com/ecastle612-ux/M.P.A/pull/162) | Annual Billing Discount (20% prepaid) | **MERGED** | `c0676fce368aa0803e68ed5b3c8122b96402f5b2` |
| [#163](https://github.com/ecastle612-ux/M.P.A/pull/163) | FO Vendor Workflow Completion | **MERGED** | `681307e9a64517972183b81dc6b35e318e2755f1` |
| [#164](https://github.com/ecastle612-ux/M.P.A/pull/164) | Post Review Merge Readiness Certification | **MERGED** | `eb6b1f868985e7eae3c927602406a4ac2f47f917` |

Out of scope for this certification:

- Production deploy execution  
- Stripe Price create/update/delete  
- Existing subscription migration  
- Database migrations  
- RBAC capability key changes  

Governance preserved: Product Constitution commercial flow; Implementation Gate; Canopy / Experience Architecture unchanged.

---

## Commit evidence

| Check | Result |
|-------|--------|
| Current `origin/main` SHA | `eb6b1f868985e7eae3c927602406a4ac2f47f917` |
| #162 merge is ancestor of `main` | **YES** (`c0676fc…`) |
| #163 merge is ancestor of `main` | **YES** (`681307e…`) |
| #164 merge is tip of `main` | **YES** (`eb6b1f8…`) |
| Release candidate status | **INTEGRATED ON MAIN** — awaiting Owner Production deploy approval |

---

## Billing certification

### Pricing model on `main`

| Product | Monthly | Annual | Formula |
|---------|--------:|-------:|---------|
| Property Manager | **$59** | **$566.40** | monthly × 12 × 0.80 |
| Facility Operations | **$59** | **$566.40** | monthly × 12 × 0.80 |
| Complete Platform | **$109** | **$1,046.40** | monthly × 12 × 0.80 |
| Additional Unit Capacity (block) | $39 | **$468** | monthly × 12 (**no** 20% discount) |

Source of truth: `packages/shared/src/commercial/unit-volume.ts`  
(`ANNUAL_PREPAID_MULTIPLIER = 0.8`, `PM_BASE_ANNUAL_CENTS = 56640`, `FO_ANNUAL_CENTS = 56640`, `COMPLETE_BASE_ANNUAL_CENTS = 104640`)

### Integration surfaces

| Surface | Result |
|---------|--------|
| Quote calculations | **PASS** |
| Checkout Price env key mapping (`STRIPE_PRICE_*_ANNUAL` / unit block) | **PASS** |
| Confirm Plan | **PASS** |
| Pricing page + public motion copy | **PASS** |
| JSON-LD | **PASS** |
| Customer questionnaire (“Save 20% with annual billing”) | **PASS** |
| Server authoritative validation (client cannot set amounts / Price IDs) | **PASS** |
| Existing subscriptions unaffected / no migration logic in release | **PASS** (`docs/71` forbids migration) |

---

## FO workflow certification

| Check | Result |
|-------|--------|
| Route `/facility/vendors` | **PASS** (registered in production build) |
| `GET /api/facility/vendors` | **PASS** |
| `POST /api/facility/vendors` | **PASS** (email required) |
| Authorization via `requireFacilityOperation` | **PASS** (`pm.maintenance:read` / `assign`) |
| Entitlement `facility.operations` | **PASS** |
| Organization isolation (`organization_id` + membership) | **PASS** |
| Reuses `vendor_vendors` via `listVendors` / `createVendorDirectory` | **PASS** |
| Work-order assign lifecycle unchanged | **PASS** |
| No new RBAC capability keys | **PASS** |
| No database migration | **PASS** |

---

## Validation results

Executed against `main` @ `eb6b1f8` (2026-08-13).

| Check | Result | Detail |
|-------|--------|--------|
| Shared tests (`@mpa/shared`) | **PASS** | 43 files · **243** tests · 0 failed |
| Web tests (`@mpa/web`) | **PASS** | 46 files · **238** tests · 0 failed |
| TypeScript | **PASS** | `shared` + `web` |
| Lint | **PASS** | 0 errors |
| Production build | **PASS** | Includes `/pricing`, `/facility/vendors`, `/api/facility/vendors` |
| Failures | **None** | |
| Blocking warnings | **None** | |
| Flaky tests | **None** | |

---

## Production safety review (read-only)

| Area | Result |
|------|--------|
| Stripe Price modifications during this certification | **NONE** |
| Vercel Production unit-volume Price env keys (8/8) | **PRESENT** (`sensitive`) |
| Monthly Stripe Price amounts still active (PM 5900; unit block 3900) | **PASS** |
| Annual 20% Stripe Prices active (56640 / 56640 / 104640) | **PASS** |
| Unit block annual still 46800 | **PASS** |
| Subscription migration | **NONE** |
| DB migrations in release (`4e46338…eb6b1f8`) | **0 files** |
| RBAC permission/entitlement key files changed | **0 files** |
| Production deployment | **NO DEPLOYMENT** |

**Deploy note (ops, not a blocker for this readiness record):** Vercel annual Price env keys were remapped earlier to the 20% Prices; values apply on the **next** Production deployment after Owner approval.

---

## Production impact

| Item | Impact at deploy time |
|------|------------------------|
| New annual checkout quotes | Align to $566.40 / $566.40 / $1,046.40 |
| Monthly checkout | Unchanged |
| Existing subscribers | Remain on prior Prices (no auto-migration) |
| FO customers | Gain `/facility/vendors` directory without `pm.vendors` |
| Schema / RBAC | No migration; no new capability keys |

---

## Final verdict

### READY FOR PRODUCTION DEPLOYMENT APPROVAL

Release candidate `eb6b1f8` on `main` integrates #162 / #163 / #164 with green suite results and read-only Production env/Stripe readiness. **Owner approval is required before any Production deployment.** This certification did **not** deploy.
