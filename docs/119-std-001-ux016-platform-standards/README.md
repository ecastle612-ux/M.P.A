# STD-001 — UX-016 Platform Standards (Permanent)

**Status:** ✅ **Accepted** (2026-08-05) — permanent, binding  
**Standard ID:** STD-001  
**Source initiative:** [UX-016](../118-ux-016-dashboard-navigation-optimization/README.md) (**CLOSED · CERTIFIED**)  
**ADR:** [ADR-033](../18-decision-log/adr-033-ux016-platform-standards-mandatory.md) (**Accepted**) · [ADR-032](../18-decision-log/adr-032-ux-016-dashboard-navigation-optimization.md) (**Accepted**)  
**Policy:** [Implementation Gate](../00-governance/implementation-gate.md) · [ADR-012](../18-decision-log/adr-012-design-document-approve-implement.md)  
**Date:** 2026-08-05

---

## Mandate

UX-016 established the work-companion experience for M.P.A. That experience is now **permanent platform law**.

Every future dashboard, shell, and module home **must inherit** these standards. No future module may invent its own dashboard anatomy or navigation pattern unless explicitly approved through governance (Design → Document → Approve).

Future modules should feel like they have **always belonged** in M.P.A. — without another platform-wide redesign.

---

## Documents

| Doc | Purpose |
|-----|---------|
| [01 — Permanent UX Standard](./01-permanent-ux-standard.md) | Mandatory home composition every surface inherits |
| [02 — Dashboard Standard](./02-dashboard-standard.md) | Universal Dashboard Framework is mandatory for all future modules |
| [03 — Navigation Standard](./03-navigation-standard.md) | Permanent sidebar / shell navigation model |
| [04 — Design Standard](./04-design-standard.md) | Cards · spacing · elevation · type · motion · loading · empty · notifications · a11y |
| [05 — Future Development Rule](./05-future-development-rule.md) | Inheritance rule + exception path |
| [06 — Admin surface compliance audit](./06-admin-surface-compliance-audit.md) | UX-016 / STD-001 audit of authenticated Admin surfaces (**Class D = 0**) |
| [07 — Admin surface migration plan](./07-admin-surface-migration-plan.md) | Remount Class D Admin/module dashboards onto UDF — **complete** |
| [08 — Compliance remediation authorization](./08-compliance-remediation-authorization.md) | Authorize phrase for remaining Admin dashboard remounts |
| [09 — Compliance remediation implementation](./09-compliance-remediation-implementation.md) | Commercial · Financials · Migration on UDF + screenshot evidence |
| [10 — Operational workspace compliance audit](./10-operational-workspace-compliance-audit.md) | Every primary operational home vs STD-001 — ✅ **100% compliant** |
| [11 — Operational workspace remediation authorization](./11-operational-workspace-remediation-authorization.md) | `AUTHORIZE STD-001 Operational Workspace Remediation` |
| [12 — Operational workspace remediation implementation](./12-operational-workspace-remediation-implementation.md) | Resident · Owner · Leasing · Maintenance · Facility on UDF + screenshot evidence |

---

## Inheritance at a glance

```
Greeting
M.P.A. Assistant
Waiting on Me
Waiting on Others
Immediate Attention
Today's Mission
Recommended Actions
Quick Actions
Operational Timeline (Recent Activity)
Insights
```

Sidebar model (ops):

```
Dashboard → My Work → Operations → Financial → Documents → Communication → Analytics → Administration
```

---

## Relationship

| Package | Relationship |
|---------|--------------|
| Canopy (06) | Visual identity — STD-001 does not replace tokens |
| Experience Architecture (21) | Experience laws — STD-001 executes them on homes |
| UX-012 | Design system — STD-001 binds home/nav composition |
| UX-016 | Closed source initiative — evidence + certification |
| CORE-004 | Next expansion program — must inherit STD-001 |
