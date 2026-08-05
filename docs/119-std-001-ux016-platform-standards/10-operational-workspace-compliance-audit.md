# 10 — Operational Workspace STD-001 Compliance Audit

**Standard:** STD-001 · ADR-033  
**Source initiative:** UX-016 (**CLOSED · CERTIFIED**)  
**Audit type:** Compliance — remediated under [11](./11-operational-workspace-remediation-authorization.md) / [12](./12-operational-workspace-remediation-implementation.md)  
**Date:** 2026-08-05  
**Status:** ✅ **100% COMPLIANT**  
**Scope:** Every authenticated **primary operational home** (role AUTH landings + role/module command canvases)  
**Related:** [01](./01-permanent-ux-standard.md) · [02](./02-dashboard-standard.md) · [05](./05-future-development-rule.md) · [06](./06-admin-surface-compliance-audit.md) · AUTH home resolver `assignedSurfaceHome`

---

## 1. Audit method

### Binding law

| Source | Requirement |
|--------|-------------|
| [01 — Permanent UX Standard](./01-permanent-ux-standard.md) | Home composition: Greeting → Assistant → Waiting on Me/Others → Immediate Attention → Today’s Mission → Recommended Actions → Quick Actions → Timeline → Insights |
| [02 — Dashboard Standard](./02-dashboard-standard.md) | Universal Dashboard Framework mandatory for **module / role homes** |
| [05 — Future Development Rule](./05-future-development-rule.md) | Every operational home inherits STD-001; no parallel dashboards without governance |
| ADR-033 | No parallel dashboard / nav patterns without governance |

### Applicability classes

| Class | Meaning | UDF required? |
|-------|---------|---------------|
| **H — Home** | Role / module command home | ✅ Yes |
| **L — Launcher** | Portal / surface launcher | ◯ N/A |
| **T — Tool** | List · detail · form · settings · token job | ◯ N/A |
| **D — Divergent** | Home-like dashboard **not** on UDF | ❌ Non-compliant |
| **Stub / Notice** | Placeholder or retired access page | ◯ N/A |

---

## 2. Executive verdict

| Metric | Result |
|--------|--------|
| Primary operational homes on Universal Dashboard Framework | **10 / 10 PASS** |
| Divergent / tool-as-home operational homes remaining | **0** |
| Overall operational-workspace compliance | ✅ **100% COMPLIANT** |

**Bottom line:** Every primary operational home in M.P.A. inherits the certified STD-001 workspace experience. Admin/module homes (prior remediation) and Resident · Owner · Leasing · Maintenance · Facility homes (this remediation) all mount UDF. **Recommend proceeding with CORE-004 Phase 1 without further platform-level UX remediation.**

---

## 3. AUTH home inventory

Resolver: `apps/web/src/lib/auth/ops-shell-access.ts` → `assignedSurfaceHome()` (**unchanged**).

| Primary role | AUTH home | Class | Verdict |
|--------------|-----------|-------|---------|
| `organization_admin` (PM org) | `/dashboard` | **H** | ✅ UDF |
| `organization_admin` (owner org) | `/portal/owner` | **H** | ✅ UDF |
| `property_manager` | `/dashboard` | **H** | ✅ UDF |
| `leasing_agent` | `/leases` | **H** | ✅ UDF + pipeline tool below |
| `facility_technician` | `/maintenance` | **H** | ✅ UDF + work queue below |
| `property_owner` | `/portal/owner` | **H** | ✅ UDF |
| `tenant` | `/portal/tenant` | **H** | ✅ UDF (calm) |
| `vendor` | `/vendor-access` | Notice | ◯ Portal retired |
| Master Admin | `/master-admin` | **H** | ✅ UDF |

---

## 4. Certified homes register

| Route | Audience | Component | Mapper | Verdict |
|-------|----------|-----------|--------|---------|
| `/dashboard` | Org Admin (PM) · Property Manager | `OpsUniversalDashboard` | `buildUniversalDashboardViewModel` | ✅ PASS |
| `/master-admin` | Master Admin | `OperationsCenterView` | `buildMasterAdminUniversalDashboardViewModel` | ✅ PASS |
| `/master-admin/commercial` | MA / CS | `CommercialUniversalDashboard` | `buildCommercial…` + `assembleUniversalHome` | ✅ PASS |
| `/financials` | Financial module home | `FinancialUniversalDashboard` | `buildFinancial…` + `assembleUniversalHome` | ✅ PASS |
| `/migration` | Migration module home | `MigrationUniversalDashboard` | `buildMigration…` + `assembleUniversalHome` | ✅ PASS |
| `/portal/tenant` | Resident | `ResidentUniversalDashboard` | `buildResident…` + `assembleUniversalHome` | ✅ PASS |
| `/portal/owner` | Owner | `OwnerUniversalDashboard` | `buildOwner…` + `assembleUniversalHome` | ✅ PASS |
| `/leases` | Leasing Agent | `LeasingUniversalDashboard` | `buildLeasing…` + `assembleUniversalHome` | ✅ PASS |
| `/maintenance` | Maintenance Technician | `MaintenanceUniversalDashboard` | `buildMaintenance…` + `assembleUniversalHome` | ✅ PASS |
| `/facility` | Facility Operations | `FacilityUniversalDashboard` | `buildFacility…` + `assembleUniversalHome` | ✅ PASS |

---

## 5. Former gaps — remediated (2026-08-05)

| ID | Route | Prior class | Remediation | Verdict |
|----|-------|-------------|-------------|---------|
| G-1 | `/portal/tenant` | D | Calm UDF + `TenantPortalHome` embedded below | ✅ PASS |
| G-2 | `/portal/owner` | D | UDF first; portfolio KPIs below fold | ✅ PASS |
| G-3 | `/leases` | H-gap | UDF header + `LeasesTable` pipeline below | ✅ PASS |
| G-4 | `/maintenance` | H-gap | UDF header + `WorkOrdersTable` queue below | ✅ PASS |
| G-5 | `/facility` | D | UDF header; parallel hero removed; boards embedded | ✅ PASS |

**Evidence:** [12](./12-operational-workspace-remediation-implementation.md) · [artifacts](./artifacts/std001-operational-remediation/)

---

## 6. Surfaces reviewed and not Class H gaps

| Route | Class | Note |
|-------|-------|------|
| `/portal/manager` | Stub | Real PM home = `/dashboard` (PASS) |
| `/vendor-access` | Notice | Portal retired |
| `/v/[token]` | **T** | Tokenized job card |
| `/portal` · `/master-admin/dashboards` | **L** | Launchers |
| Settings / lists / reports | **T** | Tools only |

---

## 7. Compliance scorecard

| Segment | On UDF | Gaps |
|---------|--------|------|
| Admin / module homes | 5 / 5 | 0 |
| Resident AUTH home | 1 / 1 | 0 |
| Owner AUTH home | 1 / 1 | 0 |
| Leasing Agent AUTH home | 1 / 1 | 0 |
| Facility Technician AUTH home | 1 / 1 | 0 |
| Facility command canvas | 1 / 1 | 0 |
| **Primary homes missing certified experience** | | **0** |

| Category | Score |
|----------|-------|
| Primary operational homes | **10 / 10 PASS** |
| Divergent / legacy home dashboards | **0** |
| New UX invented | **None** — certified UDF reused |

---

## 8. Evidence pointers

| Artifact | Path |
|----------|------|
| AUTH resolver | `apps/web/src/lib/auth/ops-shell-access.ts` |
| Assembler | `apps/web/src/lib/std001/assemble-universal-home.ts` |
| Resident | `components/portal/resident-universal-dashboard.tsx` · `lib/resident/ux016-view-model.ts` |
| Owner | `components/portal/owner-universal-dashboard.tsx` · `lib/owner-portal/ux016-view-model.ts` |
| Leasing | `components/lease/leasing-universal-dashboard.tsx` · `lib/lease/ux016-view-model.ts` |
| Maintenance | `components/maintenance/maintenance-universal-dashboard.tsx` · `lib/maintenance/ux016-view-model.ts` |
| Facility | `components/facility/facility-universal-dashboard.tsx` · `lib/facility/ux016-view-model.ts` |
| Authorization | [11](./11-operational-workspace-remediation-authorization.md) |
| Implementation | [12](./12-operational-workspace-remediation-implementation.md) |
| Screenshots | [artifacts/std001-operational-remediation/](./artifacts/std001-operational-remediation/) |

---

## 9. Sign-off

| Role | Finding |
|------|---------|
| Audit (initial) | **5** primary homes missing certified experience (G-1…G-5) |
| Remediation (2026-08-05) | G-1…G-5 → **PASS** on UDF; operational workspace audit **100% compliant** |
| Next | Proceed with CORE-004 Phase 1 — no further platform-level UX remediation required |
