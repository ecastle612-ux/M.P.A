# 11 — STD-001 Operational Workspace Remediation Authorization

**Standard:** STD-001 · ADR-033  
**Status:** ✅ **AUTHORIZED**  
**Phrase:** `AUTHORIZE STD-001 Operational Workspace Remediation`  
**Date:** 2026-08-05  
**Audit:** [10](./10-operational-workspace-compliance-audit.md)  
**Constraint:** Presentation only — reuse certified UX-016 Universal Dashboard Framework. **This is not a UX-016 extension. Do not invent new UX patterns.**

---

## Binding phrase (issued)

```
AUTHORIZE STD-001 Operational Workspace Remediation
```

> Implementation may begin **only** for the five primary operational homes below.  
> Remount onto existing `UniversalDashboard` + M.P.A. Assistant.  
> No business logic, APIs, database, routing, authentication, permissions, or workflow changes.

---

## In scope

| ID | Route | Primary user | Target |
|----|-------|--------------|--------|
| G-1 | `/portal/tenant` | Resident | Calm resident home on UDF; resident tools retained below |
| G-2 | `/portal/owner` | Owner | Owner home on UDF; portfolio KPIs below fold |
| G-3 | `/leases` | Leasing Agent | Certified workspace header + leasing pipeline tool below |
| G-4 | `/maintenance` | Maintenance Technician | Certified workspace header + work queue below |
| G-5 | `/facility` | Facility Operations | Certified workspace header; remove parallel dashboard chrome; facility tools below |

Each must inherit:

Greeting · M.P.A. Assistant · Waiting on Me · Waiting on Others · Immediate Attention · Today’s Mission · Recommended Actions · Quick Actions · Operational Timeline · Insights (below the fold)

---

## Role-specific presentation rules

| Surface | Rule |
|---------|------|
| Resident | Keep calm experience; prepend certified workspace; do not remove resident-specific functionality |
| Owner | Keep portfolio KPIs; move them below the operational workspace header |
| Leasing | Separate landing (UDF) from pipeline tool (`LeasesTable`) — same route |
| Maintenance | Retain work queue; prepend certified workspace |
| Facility | Remove parallel dashboard concepts; reuse existing facility tools beneath UDF |

---

## Explicit excludes

| Excluded | Remains |
|----------|---------|
| Reopening UX-016 slices | Forbidden |
| New dashboard anatomy / design language | Forbidden |
| Business logic / API / DB / routing / auth / permissions / workflows | Forbidden |
| Changing AUTH home paths | Forbidden (presentation remount on existing routes) |

---

## Acceptance

| ID | Criterion |
|----|-----------|
| OWR-01 | `/portal/tenant` mounts Universal Dashboard Framework |
| OWR-02 | `/portal/owner` mounts Universal Dashboard Framework |
| OWR-03 | `/leases` mounts Universal Dashboard Framework above leasing pipeline |
| OWR-04 | `/maintenance` mounts Universal Dashboard Framework above work queue |
| OWR-05 | `/facility` mounts Universal Dashboard Framework; parallel dashboard hero removed |
| OWR-06 | Each surfaces role-fit content from **existing** signals |
| OWR-07 | Insights / Owner KPIs remain below the fold |
| OWR-08 | No business logic / API / DB / routing / auth / permissions / workflow changes |
| OWR-09 | Compliance audit [10] updated to **100% compliant** · zero legacy home dashboards |
| OWR-10 | Before/after screenshots for each remounted workspace |
| OWR-11 | Recommend CORE-004 Phase 1 without further platform-level UX remediation |
