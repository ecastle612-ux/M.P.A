# 08 — STD-001 Compliance Remediation Authorization

**Standard:** STD-001 · ADR-033  
**Status:** ✅ **AUTHORIZED**  
**Phrase:** `AUTHORIZE STD-001 Compliance Remediation – Remaining Admin Dashboards`  
**Date:** 2026-08-05  
**Audit:** [06](./06-admin-surface-compliance-audit.md) · [07](./07-admin-surface-migration-plan.md)  
**Constraint:** Presentation only — reuse certified UX-016 Universal Dashboard Framework. **Do not reopen UX-016. Do not invent new UX patterns.**

---

## Binding phrase (issued)

```
AUTHORIZE STD-001 Compliance Remediation – Remaining Admin Dashboards
```

> Implementation may begin **only** for the three Class D routes below.  
> Remount onto existing `UniversalDashboard` + M.P.A. Assistant.  
> No business logic, APIs, database, routing, authentication, permissions, or workflow changes.

---

## In scope

| Route | Target |
|-------|--------|
| `/master-admin/commercial` | Commercial operations command center on UDF |
| `/financials` | Financial operations command center on UDF |
| `/migration` | Migration operations command center on UDF |

Each must inherit:

Greeting · M.P.A. Assistant · Waiting on Me · Waiting on Others · Immediate Attention · Today’s Mission · Recommended Actions · Quick Actions · Operational Timeline · Insights (below the fold)

Shell already provided by `(app)` layout: Universal Sidebar · Mobile Navigation · Command Search · Favorites · Recent · Quick Create.

Secondary tool panels (ops consoles, billing panels, switching checklists) may remain **below** the UDF canvas — never as the first-viewport hero.

---

## Explicit excludes

| Excluded | Remains |
|----------|---------|
| Reopening UX-016 slices | Forbidden |
| New dashboard anatomy / design language | Forbidden |
| Business logic / API / DB / routing / auth / permissions | Forbidden |
| Remounting UDF onto Class T settings tools | Out of scope |

---

## Acceptance

| ID | Criterion |
|----|-----------|
| CR-01 | `/master-admin/commercial` mounts Universal Dashboard Framework |
| CR-02 | `/financials` mounts Universal Dashboard Framework |
| CR-03 | `/migration` mounts Universal Dashboard Framework |
| CR-04 | Each surfaces role-fit operational content from **existing** signals |
| CR-05 | Immediate Attention prioritizes risk/blockers (financial risk · migration blockers · commercial urgency) |
| CR-06 | Insights remain below the fold |
| CR-07 | No business logic / API / DB / routing / auth / permissions changes |
| CR-08 | Compliance audit [06] updated; Class D for these three → PASS |
| CR-09 | Before/after screenshots recorded |
