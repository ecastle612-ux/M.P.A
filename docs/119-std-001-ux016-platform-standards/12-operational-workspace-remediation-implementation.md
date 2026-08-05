# 12 — STD-001 Operational Workspace Remediation Implementation

**Standard:** STD-001 · ADR-033  
**Authorization:** [11](./11-operational-workspace-remediation-authorization.md)  
**Audit:** [10](./10-operational-workspace-compliance-audit.md)  
**Date:** 2026-08-05  
**Constraint:** Presentation only — certified UX-016 Universal Dashboard Framework reused. **Not a UX-016 extension.**

---

## Scope delivered

| ID | Route | Component | View-model |
|----|-------|-----------|------------|
| G-1 | `/portal/tenant` | `ResidentUniversalDashboard` | `buildResidentUniversalDashboardViewModel` |
| G-2 | `/portal/owner` | `OwnerUniversalDashboard` | `buildOwnerUniversalDashboardViewModel` |
| G-3 | `/leases` | `LeasingUniversalDashboard` | `buildLeasingUniversalDashboardViewModel` |
| G-4 | `/maintenance` | `MaintenanceUniversalDashboard` | `buildMaintenanceUniversalDashboardViewModel` |
| G-5 | `/facility` | `FacilityUniversalDashboard` | `buildFacilityUniversalDashboardViewModel` |

Shared assembler: `apps/web/src/lib/std001/assemble-universal-home.ts` → `buildMpaAssistantFromUniversalSections`.

---

## Composition (each home)

Greeting → M.P.A. Assistant → Waiting on Me → Waiting on Others → Immediate Attention → Today’s Mission → Recommended Actions → Quick Actions → Operational Timeline → Insights (below fold)

Role tools remounted **below** Insights:

| Route | Tools below fold |
|-------|------------------|
| Resident | `TenantPortalHome` (embedded — quick actions + today tools; calm preserved) |
| Owner | `OwnerPortalDashboard` (embedded — portfolio KPIs + activity lists) |
| Leasing | `LeasesTable` (embedded pipeline) |
| Maintenance | `WorkOrdersTable` (embedded work queue) |
| Facility | `TechnicianDashboard` (embedded boards — parallel hero removed) |

---

## Role presentation rules honored

| Surface | Rule | Result |
|---------|------|--------|
| Resident | Calm experience; prepend UDF; keep resident tools | ✅ |
| Owner | KPIs below workspace header | ✅ Insights + embedded portfolio section |
| Leasing | Separate landing vs pipeline on same route | ✅ |
| Maintenance | Retain queue; prepend UDF | ✅ |
| Facility | Remove parallel dashboard concepts | ✅ embedded boards only |

---

## Preserve confirmation

No changes to business logic, APIs, database, routing paths, authentication, permissions, or workflows. AUTH homes unchanged (`assignedSurfaceHome` untouched). Pages remount presentation onto UDF; existing signals reused.

---

## Verification

| Check | Result |
|-------|--------|
| Unit tests (5 view-models) | ✅ 9/9 pass |
| OWR-01…OWR-08 | ✅ |
| Audit [10] → **100% compliant** | ✅ |
| Legacy operational home dashboards remaining | **0** |
| Before/after screenshots | ✅ `artifacts/std001-operational-remediation/` |

---

## Screenshots

| Route | Before | After |
|-------|--------|-------|
| `/portal/tenant` | [before/tenant.png](./artifacts/std001-operational-remediation/before/tenant.png) | [after/tenant.png](./artifacts/std001-operational-remediation/after/tenant.png) |
| `/portal/owner` | [before/owner.png](./artifacts/std001-operational-remediation/before/owner.png) | [after/owner.png](./artifacts/std001-operational-remediation/after/owner.png) |
| `/leases` | [before/leases.png](./artifacts/std001-operational-remediation/before/leases.png) | [after/leases.png](./artifacts/std001-operational-remediation/after/leases.png) |
| `/maintenance` | [before/maintenance.png](./artifacts/std001-operational-remediation/before/maintenance.png) | [after/maintenance.png](./artifacts/std001-operational-remediation/after/maintenance.png) |
| `/facility` | [before/facility.png](./artifacts/std001-operational-remediation/before/facility.png) | [after/facility.png](./artifacts/std001-operational-remediation/after/facility.png) |

Agent artifacts mirror: `/opt/cursor/artifacts/std001-operational-remediation/`.

---

## Completion

Operational workspace audit is **100% compliant**. Every primary operational home in M.P.A. now follows the same certified workspace experience.

**Recommendation:** Proceed with **CORE-004 Phase 1** implementation without further platform-level UX remediation. New capabilities inherit STD-001 automatically.
