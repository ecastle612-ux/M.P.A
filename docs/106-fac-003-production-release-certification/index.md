# FAC-003 PRODUCTION RELEASE CERTIFICATION

**Title:** FAC-003 PRODUCTION RELEASE CERTIFICATION  
**Status:** BLOCKED  
**Date:** 2026-08-14  
**Recorded at:** 2026-08-14T19:15:00Z  
**Program:** FAC-003  
**Authority:** [docs/102](../102-fac-003-asset-inventory-management/index.md) Approved · [ADR-028](../18-decision-log/adr-028-fac-003-asset-inventory-management.md) Accepted  
**Implementation cert:** [docs/103](../103-fac-003-implementation-certification/index.md) READY (PR #211 · not on `main`)  
**Migration cert:** [docs/104](../104-fac-003-production-migration-certification/index.md) READY FOR PRODUCTION MIGRATION  
**Apply cert:** [docs/105](../105-fac-003-production-migration-apply-certification/index.md) READY FOR APPLICATION DEPLOYMENT  
**Production project:** `mpa-prod` / `vahnmcrpnuggxkivynvo`  
**Application deploy:** **NOT PERFORMED**  
**Billing / Stripe / roles / SKUs / entitlement keys:** Unchanged  

---

## Final verdict

**BLOCKED**

FAC-003 application code is not on `main`. Production still serves PLAT-002 (`4b45c6e2`). Authenticated asset, inventory, media, work-order, authorization, and report UAT were **not** executed. No production application deploy was performed.

Schema `fac_003_asset_inventory` remains applied from docs/105. Existing production rows are unchanged. No UAT rows were created.

---

## Constraints honored

| Constraint | Result |
|------------|--------|
| No new features | Honored |
| No migrations | Honored — no `apply_migration` |
| No new roles / entitlement keys | Honored |
| No billing / Stripe changes | Honored |
| No warehouse / DOC-001 / SHEET-001 / QR / PM generation | Honored |
| Do not deploy uncertified `main` | Honored — current `main` is not FAC-003 |
| Do not promote a draft / failing-CI preview to production | Honored |

---

## 1. Merge validation

| Check | Result |
|-------|--------|
| Implementation PR [#211](https://github.com/ecastle612-ux/M.P.A/pull/211) merged into `main` | **NO** — `state: open`, `draft: true`, `merged_at: null` |
| Merge commit on `main` | **NONE** |
| Current `main` SHA | `4b45c6e2f62c70db195b03885ed7d079ae8c9ccd` |
| `main` tip message | Merge pull request #203 (PLAT-002 authorization hardening) |
| FAC-003 commits on `main` | **NO** — no `20260814200000_fac_003_asset_inventory.sql`, no docs/102–105 |
| PR #211 head | `b2e4045a77934971741eb9e0d89d2160b4405ebc` |
| `mergeable` | `true` / `unstable` |

Release contents exist **only** on `cursor/fac-003-asset-inventory-impl-b7a1` (PR #211), not on `main`:

| Surface | On PR #211 | On `main` / Production app |
|---------|------------|----------------------------|
| Asset UI/API (`/facility/assets`, `/api/facility/assets`) | Yes | No |
| Inventory stock ledger UI/API | Yes | No |
| Work-order `facility_asset_id` linkage | Yes | No |
| FAC-002 asset/inventory report types | Yes | No |
| MEDIA-001 `facility_asset` parent (app) | Yes | No |
| PLAT-002 `requireFacilityAssetPermission` / inventory wrappers | Yes | No |

### CI (PR #211 head `b2e4045a`)

| Check | Result |
|-------|--------|
| CI `verify` | **FAILURE** — [run 31818922788](https://github.com/ecastle612-ux/M.P.A/actions/runs/31818922788) / [job 94827238491](https://github.com/ecastle612-ux/M.P.A/actions/runs/31818922788/job/94827238491) |
| Vercel Preview Comments | **SUCCESS** |

`@mpa/web#lint` failed with 6 errors (no warnings):

| File | Rule |
|------|------|
| `apps/web/src/lib/facility/asset-inventory-reports.test.ts:47` | `@typescript-eslint/no-unused-vars` (`input`) |
| `apps/web/src/lib/facility/asset-service.test.ts:3` | `@typescript-eslint/no-unused-vars` (`input`) |
| `apps/web/src/lib/facility/asset-service.test.ts:30` | `prefer-const` (`filters`) |
| `apps/web/src/lib/facility/inventory-service.test.ts:3` | `@typescript-eslint/no-unused-vars` (`input`) |
| `apps/web/src/lib/facility/inventory-service.test.ts:28` | `prefer-const` (`filters`) |
| `apps/web/src/lib/maintenance/maintenance-service.ts:943` | `prefer-const` (`facilityAssetId`) |

### Vercel Preview (not a production release)

| Field | Value |
|-------|--------|
| Impl preview SHA | `b2e4045a` |
| Branch | `cursor/fac-003-asset-inventory-impl-b7a1` |
| Status | READY (Preview only) |
| Docs-only previews | `e0f7f52d` (docs/104), `206011ec` (docs/105) — not application releases |

**Hard gate:** a certified production application release requires #211 (or an equivalent) **merged to `main`** with green `verify`, then a production deploy of that `main` SHA. This record does not merge the draft PR and does not promote the preview.

---

## 2. Production deployment

**Not performed.**

| Field | Current Production (unchanged) |
|-------|--------------------------------|
| Deployment ID | `dpl_8fhVn7YaVNTu1PLR94U3HGED1bdm` |
| URL | `https://m-p-a-hd17rka0y-ecastle612-uxs-projects.vercel.app` |
| Commit SHA | `4b45c6e2f62c70db195b03885ed7d079ae8c9ccd` |
| Git ref | `main` |
| Timestamp | 2026-08-14T15:31:16Z |
| Status | READY |
| Aliases | `https://www.my-property-assistant.com`, `https://my-property-assistant.com`, `https://m-p-a-web.vercel.app`, `https://m-p-a-web-ecastle612-uxs-projects.vercel.app`, `https://m-p-a-web-git-main-ecastle612-uxs-projects.vercel.app` |
| Commit message | Merge pull request #203 (PLAT-002) |

Deploying this SHA would not ship FAC-003. Promoting PR #211 preview would ship a draft branch with failing CI and would desynchronize Production from `main`. Both were refused.

---

## 3–9. Authenticated UAT

**Not executed.** Production does not serve FAC-003 routes. Creating UAT assets/stock against the live schema from a non-FAC-003 UI, or against Preview only, is not a Production release UAT.

| Journey | Result |
|---------|--------|
| 3. Asset create / detail / edit / lifecycle | **Not run** |
| 4. MEDIA-001 asset image/video | **Not run** |
| 5. Inventory receive / issue / adjust → 19 | **Not run** |
| 6. Negative-stock fail-closed | **Not run** |
| 7. Work order → `UAT HVAC Unit 01` | **Not run** |
| 8. FO/Complete / PM / tenant / vendor / technician matrix | **Not run** |
| 9. FAC-002 asset/inventory reports + CSV + audit | **Not run** |

Intended Complete UAT org (unused): M.P.A. UAT Clinic Demo `a11ce001-0001-4000-8000-00000000c11c` (`mpa_complete_platform`). PM deny org (unused): M.P.A. UAT Property Demo `a11ce002-0001-4000-8000-0000000000c2`.

---

## 10. Data safety

Read-only Production check after this certification (no writes):

| Object | Count | Notes |
|--------|------:|-------|
| `facility_assets` | 4 | Legacy Canopy rows only. No `UAT HVAC Unit 01` |
| Ledger | `20260814163540` / `fac_003_asset_inventory` | Applied under docs/105; not replayed |
| Work orders / vendors / memberships / subscriptions | Unchanged vs docs/105 | No UAT mutations |

---

## 11. Certification

| Gate | Result |
|------|--------|
| Impl merged to `main` | **Fail** |
| CI green on release SHA | **Fail** — lint on #211 |
| Production app SHA is FAC-003 | **Fail** — still `4b45c6e2` |
| Authenticated UAT | **Not run** |
| Incidents | **None** — no deploy, no UAT writes |

**Verdict: BLOCKED**

### Required next gate (do not skip)

1. Fix the six `@mpa/web` lint errors on PR #211.  
2. Re-run CI until `verify` is green.  
3. Mark #211 ready for review (undraft).  
4. Merge #211 (or equivalent) to `main`.  
5. Re-run this task: deploy that `main` SHA, then authenticated Production UAT (sections 3–9).

This record does not authorize those application edits, the merge, or a deploy.

---

## Explicitly not done

- Merge of PR #211
- Production / Vercel application deploy
- Authenticated asset / inventory / media / work-order / report UAT
- Stripe / billing / role / SKU changes
- Additional migrations

---

**STOP.** Production application is unchanged. Schema from docs/105 remains. Not a production release.
