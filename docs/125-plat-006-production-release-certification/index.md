# PLAT-006 SLICES B+C PRODUCTION APPLICATION RELEASE CERTIFICATION

**Title:** PLAT-006 SLICES B+C PRODUCTION APPLICATION RELEASE CERTIFICATION  
**Status:** PRODUCTION RELEASE SUCCESSFUL  
**Date:** 2026-08-15  
**Program:** PLAT-006 Slices B and C  
**Authority:** Owner authorization to merge and deploy the certified application implementation · [docs/121](../121-plat-006-finance-reports-routing-remediation/index.md) Approved · [ADR-032](../18-decision-log/adr-032-report-shape-and-post-auth-home.md) Accepted · [docs/122](../122-plat-006-finance-reports-routing-implementation-certification/index.md) · [docs/123](../123-plat-006-production-migration-certification/index.md) · [docs/124](../124-plat-006-production-migration-application-certification/index.md)  
**Related:** [ADR-026](../18-decision-log/adr-026-authorization-hardening-pipeline.md) remains the authorization pipeline  
**Gate:** Design → Document → Approve → Implement → Production migration → **Application release** (ADR-012)  
**This package:** Merge + Git→Production deploy of Slices B and C only. **No database migration.**  

---

## Verdict

**PRODUCTION RELEASE SUCCESSFUL.**

Slices B and C are live on Production at SHA `44d50bf178b89842494671060852891087eed200`. Slice A grants remain live on ledger `20260815175833` / `plat_006_finance_capability_grants`. No migration was re-applied.

Authenticated shared-report UAT passed for Property Manager, Complete, tenant, vendor, and `facility_technician`. Post-auth `/dashboard` routing matches the canonical product homes.

---

## What this package did not do

- Did not apply another migration
- Did not re-apply Slice A
- Did not create `financial_charges` or change finance schema
- Did not apply FIN-OPS migrations
- Did not change Stripe, billing, SKUs, roles, subscriptions, memberships, or passwords
- Did not modify FAC-002, FAC-003, or OPS-001
- Did not promote an unmerged preview
- Did not bypass CI

---

## 1. Pre-merge validation

Implementation PR: **[#226](https://github.com/ecastle612-ux/M.P.A/pull/226)**  
Branch: `cursor/plat-006-finance-reports-routing-impl-b7a1`  
Contains [docs/122](../122-plat-006-finance-reports-routing-implementation-certification/index.md).

### 1.1 Implementation commits (no drift after docs/122)

| SHA | Subject |
|-----|---------|
| `c00ae168` | docs: add PLAT-006 finance, reports, and routing design |
| `45637d7c` | docs: mark PLAT-006 Approved and accept ADR-032 |
| `1e2c7ce1` | feat: add PLAT-006 finance capability catalog and grants |
| `67f29075` | feat: authorize shared reports by SKU and persona intersection |
| `964fea71` | feat: route staff post-auth homes through resolvePostAuthHome |
| `7e0d8fbf` | docs: certify PLAT-006 implementation for production migration |
| `82c0d11c` | docs: avoid a broken ADR-031 link in the PLAT-006 cert |

HEAD at merge: `82c0d11c`. No application commits after docs/122. Diff is approved PLAT-006 implementation, tests, and certification docs plus the already-applied Slice A SQL file (repo copy only).

### 1.2 CI / Preview

| Check | Result |
|-------|--------|
| `verify` workflow | **SUCCESS** — [run 31899568164](https://github.com/ecastle612-ux/M.P.A/actions/runs/31899568164) |
| Import boundaries / cycles / dep graph | success |
| Lint | success |
| Typecheck | success |
| Build | success |
| Test | **79 files / 384 passed** |
| Vercel Preview | **SUCCESS** `dpl_3XEjLHym4jh2SghTvAYzzDDTKZwY` |
| `mergeable` / `mergeStateStatus` | **MERGEABLE** / **CLEAN** |

PR #226 was opened as draft (agent default). Owner merge authorization converted it to ready, then merged. It was not failing, conflicting, or drifted.

---

## 2. Merge

| Field | Value |
|-------|-------|
| PR | [#226](https://github.com/ecastle612-ux/M.P.A/pull/226) |
| Method | **merge commit** (repository default; same as #219 / #217) |
| Merged at | **2026-08-15T18:08:24Z** |
| Merge commit / new `main` SHA | **`44d50bf178b89842494671060852891087eed200`** |
| Parent 1 (previous `main`) | `e56a330facf21d548815e95ff2e4c82e3c6077bd` |
| Parent 2 (implementation HEAD) | `82c0d11cbf6295c2f23508e65343b9b0be961669` |

No force push. No direct `main` commit. No cherry-pick around review. No preview promotion.

---

## 3. Production deploy

Normal Git → Production. Vercel built `main` `44d50bf1`. Preview `dpl_3XEjLHym4jh2SghTvAYzzDDTKZwY` was **not** promoted.

| Field | Value |
|-------|-------|
| GitHub Production deployment | **5923231398** |
| GitHub created | 2026-08-15T18:09:36Z |
| Vercel deployment ID | **`dpl_4M8j174UMuG2xFcFku7z8PYPeouw`** |
| Vercel created | 2026-08-15T18:08:28Z |
| Vercel ready | 2026-08-15T18:09:35Z |
| Status | **READY** |
| Target | `production` |
| Deployed SHA | **`44d50bf178b89842494671060852891087eed200`** |
| Aliases | `www.my-property-assistant.com`, `my-property-assistant.com`, `m-p-a-web.vercel.app`, `m-p-a-web-ecastle612-uxs-projects.vercel.app`, `m-p-a-web-git-main-ecastle612-uxs-projects.vercel.app` |
| Inspector | https://vercel.com/ecastle612-uxs-projects/m-p-a-web/4M8j174UMuG2xFcFku7z8PYPeouw |

```
APPLICATION: 44d50bf1 live (Slices B+C)
DATABASE:    20260815175833 / plat_006_finance_capability_grants (unchanged)
```

Ledger re-read after deploy: tip remains **`20260815175833` / `plat_006_finance_capability_grants`**. Predecessor `20260815170604` still present. No new migration.

---

## 4. Basic live security

Against `https://www.my-property-assistant.com`:

| Request | Result |
|---------|--------|
| `GET /api/shared/reports` unauthenticated | JSON **401** `Unauthenticated` |
| `GET /api/finance/snapshot` unauthenticated | JSON **401** `Unauthenticated` |
| `GET /pm/mission-control` | **307** `/login` |
| `GET /shared/reports` | **307** `/login` |
| `GET /dashboard` | **307** `/login` |

No unexpected public exposure.

---

## 5. Shared report UAT — Property Manager

Account: `uat.pm.property.demo@…` on Property Demo (`mpa_property_manager`). Existing password only.

| Case | Result |
|------|--------|
| `GET /api/shared/reports` | **200** |
| Persona | `property_manager` |
| Areas present | `property_operations`, `resident_experience`, `financial_performance`, `maintenance`, `vendors`, `documents` |
| FO-only areas (`facility_operations`, `assets`, `compliance`) | **absent** |
| `?persona=facility_manager` | still `property_manager`; FO areas still absent |
| `?persona=not_a_persona` | still `property_manager`; no escalation |
| garbage persona combo | still `property_manager` |
| `?area=facility_operations` | ignored; FO area not added |

`facility_manager` cannot expand a PM org. Unsupported `?persona=` cannot escalate.

---

## 6. Additional authenticated UAT (same controlled accounts)

| Caller | Shared reports | Notes |
|--------|----------------|-------|
| Complete Clinic Demo manager | **200** persona `organization_owner` | Union areas include FO + `financial_performance` |
| Complete `?persona=facility_manager` | **200** | Narrows to FO areas; finance and resident areas removed |
| Tenant | **403** | `?persona=organization_owner` still **403** |
| Vendor | **403** | persona escalate still **403** |
| `uat.fo.property.demo@…` `facility_technician` on PM SKU | **403** | technician denied on PM SKU |

FO-only SKU: **NOT DEMONSTRATED LIVE** (0 `mpa_facility_operations` subscriptions). Pipeline still denies FO at `pm.financial_operations` / FO-only report shape.

### Slice C routing

| Caller | Evidence |
|--------|----------|
| Authenticated PM `GET /login` (no `next`) | **307** `/dashboard` |
| PM `GET /dashboard` | `NEXT_REDIRECT` body; `/pm/mission-control` is the dominant home |
| Complete `GET /dashboard` | `NEXT_REDIRECT`; `/launcher` dominant |
| Tenant `GET /dashboard` | `NEXT_REDIRECT`; `/portal/tenant` dominant |
| Anonymous `GET /login?next=/facility/mission-control` | stays on `/login` (form uses `resolveLoginNextPath` → `/dashboard`) |
| Anonymous `GET /login?next=/pm/mission-control` | stays on `/login` |

Already-authenticated `/login?next=/facility/mission-control` is still honored by pre-existing middleware (safe relative `next`). That path is outside Slice C's login-form resolver. Not patched here.

---

## 7. Follow-up finding (not in this package)

Authorized finance APIs still return **400**:

```
Could not find the table 'public.financial_charges' in the schema cache
```

Confirmed again after this deploy for the PM account (authorized; not 401/403). Pre-existing FIN-OPS S1 schema/lineage gap. **Do not create `financial_charges` from this record. Do not apply FIN-OPS migrations from this record.**

---

## 8. Data / commercial safety

No subscription, SKU, membership, or password writes. Ledger unchanged. Customer counts were not mutated by this application deploy.

---

## Constraints honored

- Merged only the certified implementation PR
- Git → Production only
- No migration apply
- No FIN-OPS schema work
- No billing / SKU / role changes
- Product Constitution unchanged

---

## Next authorized step

None for PLAT-006 Slices B/C. A separate Owner package is required if FIN-OPS `financial_charges` (or the rest of the S1/S2 schema) should be certified and applied. Do not treat this record as that authorization.
