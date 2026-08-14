# FAC-002 PRODUCTION RELEASE CERTIFICATION

**Status:** PRODUCTION RELEASE SUCCESSFUL  
**Date:** 2026-08-14 (UTC)  
**Authority:** docs/88 Approved · ADR-025 Accepted · docs/89 COMPLETE  
**Branch (cert record):** `cursor/fac-002-production-release-cert-01f2`  
**Product scope:** FAC-002 Phase 1 Work Order Reporting & Export only  

---

## 1. Merge validation

| Check | Result |
|-------|--------|
| FAC-002 PR | **#196 MERGED** |
| Merge commit / release SHA | `7e1082dcf136150a4176f10825c6423bd77a621a` |
| Merged at | 2026-08-14T02:34:52Z |
| CI verify (pre-merge tip `c16e76c`) | **PASS** — run `31763997464` |
| Vercel Preview (pre-merge) | **PASS** — `dpl_LTBbT2U4wRmzz4NmjZ4ekiiRsroa` |
| Follow-up CI fixes included | type-import lint, join normalize, index-signature access |

---

## 2. Production deploy

| Field | Value |
|-------|--------|
| Deployment ID | `dpl_aFXQiYeUWHQvV1Aut3UPLVezuWae` |
| Commit | `7e1082dcf136150a4176f10825c6423bd77a621a` |
| Timestamp | 2026-08-14T02:35:08Z (created) |
| Status | **READY** · target `production` |
| Aliases | `www.my-property-assistant.com`, `my-property-assistant.com`, `m-p-a-web.vercel.app` |
| Live font/link header confirms dpl | `dpl_aFXQiYeUWHQvV1Aut3UPLVezuWae` on `/login` |

**Safety:** No Stripe changes · No billing changes · No inventory/asset/cost/warehouse features.

---

## 3. Authenticated reporting UAT (production)

**Org:** M.P.A. UAT Clinic Demo — Complete Platform  
**Domain:** https://www.my-property-assistant.com  

### Facility Operations

| Check | Result |
|-------|--------|
| Login | **PASS** |
| Open `/facility/reports` | **PASS** |
| Metrics load | **PASS** — Total 12 · Open 6 · In progress 1 · Completed 5 · Avg 0.1h |
| Filters | **PASS** — priority High refreshed to Total 3 |
| CSV export | **PASS** — `work-orders-facility.csv` · `# surface,facility` |
| PDF export | **PASS** — valid PDF 1.7 |

### Property Operations

| Check | Result |
|-------|--------|
| Login | **PASS** |
| Open `/pm/reports/work-orders` | **PASS** |
| Residential filtering | **PASS** — `# surface,residential` · 0 rows in period (honest empty) |
| CSV / PDF export | **PASS** |

### Complete permission union

| Check | Result |
|-------|--------|
| Access both surfaces | **PASS** — Complete Org Admin reached `/facility/reports` and `/pm/reports/work-orders` |

---

## 4. Security validation

| Check | Result | Evidence |
|-------|--------|----------|
| Unauthenticated `/facility/reports` | **PASS** — 307 → `/login` | curl |
| Unauthenticated `/pm/reports/work-orders` | **PASS** — 307 → `/login` | curl |
| Tenant staff denial | **PASS** — staff → `/portal/tenant` → `/unauthorized` | UAT screenshot |
| Surface isolation in exports | **PASS** — facility CSV only facility rows; residential CSV residential surface header | export files |
| FO-only SKU cannot open PM reports path | **PASS** (automated) | `evaluatePathEntitlement` + FO/PM API authz tests |
| PM-only SKU cannot open FO reports path | **PASS** (automated) | same |
| Organization isolation | **PASS** | service always scopes `organization_id` + surface; UAT org-only data |
| FO cannot read residential rows via FO API | **PASS** (automated + export surface tag) | facility API forces `work_surface=facility` |
| PM cannot read facility rows via PM API | **PASS** (automated + export surface tag) | residential API forces `work_surface=residential` |

Note: Live UAT users are Complete Org Admins (permission union). Exclusive FO-only / PM-only SKU browsers were not available in this org; path + API authz suites cover exclusive SKU denial.

---

## 5. Evidence artifacts

- `fac002_prod_fo_reports.webp`
- `fac002_prod_pm_reports.webp`
- `fac002_prod_complete_union.webp`
- `fac002_prod_tenant_denied.webp`
- `work-orders-facility.csv` / `.pdf`
- `work-orders-residential.csv` / `.pdf`

---

## Final verdict

**PRODUCTION RELEASE SUCCESSFUL**

STOP after certification.
