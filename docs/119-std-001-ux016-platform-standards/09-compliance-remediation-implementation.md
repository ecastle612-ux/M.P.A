# 09 — STD-001 Compliance Remediation Implementation

**Standard:** STD-001 · ADR-033  
**Authorization:** [08](./08-compliance-remediation-authorization.md)  
**Audit:** [06](./06-admin-surface-compliance-audit.md)  
**Date:** 2026-08-05  
**Constraint:** Presentation only — certified UX-016 Universal Dashboard Framework reused. UX-016 **not** reopened.

---

## Scope delivered

| Route | Component | View-model |
|-------|-----------|------------|
| `/master-admin/commercial` | `CommercialUniversalDashboard` | `buildCommercialUniversalDashboardViewModel` |
| `/financials` | `FinancialUniversalDashboard` | `buildFinancialUniversalDashboardViewModel` |
| `/migration` | `MigrationUniversalDashboard` | `buildMigrationUniversalDashboardViewModel` |

Shared assembler: `apps/web/src/lib/std001/assemble-universal-home.ts` → `buildMpaAssistantFromUniversalSections`.

---

## Composition (each home)

Greeting → M.P.A. Assistant → Waiting on Me → Waiting on Others → Immediate Attention → Today’s Mission → Recommended Actions → Quick Actions → Operational Timeline → Insights (below fold)

Shell unchanged: Universal Sidebar · Mobile Navigation · Command Search · Favorites · Recent · Quick Create.

Secondary tool panels remounted **below** Insights:

| Route | Tools below fold |
|-------|------------------|
| Commercial | `CommercialDashboardPanel` (embedded) · `CommercialOpsPanel` |
| Financials | `FinancialOverview` (embedded) · `PmBillingPanel` |
| Migration | `MigrationSwitchingExperience` · `MigrationDashboard` (embedded) |

---

## Priority rules

| Surface | Immediate Attention priority |
|---------|------------------------------|
| Commercial | Billing failures → critical health → activation → trials → stalled onboarding |
| Financials | Failed payments → late AR → outstanding balances (financial risk first) |
| Migration | Failed / rolled-back / error jobs first (blockers), then validation / mapping |

---

## Preserve confirmation

No changes to business logic, APIs, database, routing paths, authentication, permissions, or workflows. Pages remount presentation onto UDF; existing APIs/signals reused.

---

## Verification

| Check | Result |
|-------|--------|
| Unit tests (3 view-models) | ✅ 6/6 pass |
| CR-01…CR-07 | ✅ |
| Audit Class D → PASS | ✅ see [06](./06-admin-surface-compliance-audit.md) |
| Before/after screenshots | ✅ `artifacts/std001-remediation/` |

---

## Screenshots

Structural before/after captures (legacy Class D hero vs UDF inheritance):

| Route | Before | After |
|-------|--------|-------|
| `/master-admin/commercial` | [before/commercial.png](./artifacts/std001-remediation/before/commercial.png) | [after/commercial.png](./artifacts/std001-remediation/after/commercial.png) |
| `/financials` | [before/financials.png](./artifacts/std001-remediation/before/financials.png) | [after/financials.png](./artifacts/std001-remediation/after/financials.png) |
| `/migration` | [before/migration.png](./artifacts/std001-remediation/before/migration.png) | [after/migration.png](./artifacts/std001-remediation/after/migration.png) |

Agent artifacts mirror: `/opt/cursor/artifacts/std001-remediation/`.
