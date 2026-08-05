# 07 — Admin Surface STD-001 Migration Plan

**Standard:** STD-001 · ADR-033  
**Audit:** [06](./06-admin-surface-compliance-audit.md)  
**Date:** 2026-08-05  
**Constraint:** Compliance remediation only — **do not create new UX**. Remount existing signals onto the certified Universal Dashboard Framework / shell.  
**Program home:** Prefer [CORE-004](../120-core-004-core-platform-expansion/README.md) slices (or a narrowly authorized compliance remediation) — **not** UX-017 / not reopening UX-016.

---

## 1. Principles

1. **Homes inherit UDF** — Class D dashboards remount onto `UniversalDashboard` + Assistant view-models.  
2. **Tools stay tools** — Do not force Greeting/Assistant anatomy onto settings, lists, forms, or diagnostics.  
3. **Same hrefs** — No AUTH home reassignment; no permission matrix changes for cosmetics.  
4. **Existing data only** — Map commercial / financial / migration signals already available.  
5. **Shell already done** — Do not rebuild sidebar/mobile; preserve UX-016 Slice C chrome.  
6. **Gate** — Each remediation slice still needs Design note (this plan) → Approve/Authorize before Implement.

---

## 2. Already compliant (no migration)

| Surface | Route | Action |
|---------|-------|--------|
| Organization Admin home | `/dashboard` | Maintain |
| Mission Control | `/master-admin` | Maintain |
| Portal Launcher / Surface Switcher | `/portal` · `/master-admin/dashboards` | Maintain (Class L) |
| Settings · Users · Billing · Integrations · Flags · Health · Impersonation · Recovery · Testing · Properties list/detail | various | Maintain as Class T tools |

---

## 3. Remediation backlog (Class D only)

### M-01 — Master Admin Commercial → UDF

| Field | Value |
|-------|-------|
| Route | `/master-admin/commercial` |
| Current | `CommercialDashboardPanel` + `CommercialOpsPanel` |
| Target | Thin mapper → `UniversalDashboard` / `buildMpaAssistantFromUniversalSections` (or Master Admin assistant helper) using **existing** commercial snapshot signals |
| Preserve | Deep links into commercial ops panels as Quick Actions / Recommended / Mission rows — panels may remain **below** UDF as detail tools, not as the first-viewport hero |
| Missing today | Full STD-001 home composition |
| Suggested authorize | `AUTHORIZE CORE-004 SLICE …` (commercial home compliance) or dedicated compliance authorize after CORE-004 Approve |
| Effort character | Presentation remap; invasive only in page composition |

**Acceptance**

- [ ] First viewport = Greeting → Assistant → Waiting → Attention → Mission…  
- [ ] No KPI wall above Immediate Attention  
- [ ] Existing commercial actions reachable via Recommended / Quick Actions / deep links  
- [ ] Shell unchanged  

---

### M-02 — Financials module home → UDF

| Field | Value |
|-------|-------|
| Route | `/financials` |
| Current | `FinancialOverview` (+ billing panel) |
| Target | Org-scoped UDF mapper from existing `FinancialDashboardMetrics` / dashboard snapshot financial slice |
| Preserve | `/financials/reports`, charges, payments, expenses as tool destinations (Mission / Insights links) |
| Missing today | UDF + Assistant + Waiting + Attention + Mission + Recommended + Timeline discipline |
| Notes | This is an **ops module home** visible to Org Admins with financial entitlement — in Admin audit scope because Billing/Reports admin journeys enter here |

**Acceptance**

- [ ] `/financials` mounts Universal Dashboard Framework  
- [ ] Insights below fold; work queues first  
- [ ] Reports remain Class T at `/financials/reports`  

---

### M-03 — Migration Center → UDF

| Field | Value |
|-------|-------|
| Route | `/migration` |
| Current | `MigrationDashboard` / switching experience |
| Target | UDF home for migration command surface; job list/detail remain tools at `/migration/[jobId]` |
| Preserve | Existing migration APIs and job routes  
| Missing today | UDF composition |

**Acceptance**

- [ ] Migration home answers five-second test via Assistant / Attention / Mission  
- [ ] Create/import flows remain Quick Actions / deep links  

---

## 4. Optional hardening (not Class D defects)

These are **not** required to clear the audit FAIL list; schedule only if Product wants stronger Admin IA clarity.

| ID | Item | Intent |
|----|------|--------|
| H-01 | Roles entry clarity | Keep roles inside `/settings/team`; optional nav synonym only — no new page |
| H-02 | Audit Explorer label honesty | Keep alias to impersonation/directory **or** later authorize a true audit explorer under CORE — do not invent UX in this plan |
| H-03 | Properties module home | Only if Product wants a Properties **home**; otherwise list remains Class T |
| H-04 | `/portal/manager` stub | Portal surface — out of Ops Admin shell; defer to portal program |

---

## 5. Phased sequence

```
Phase 0  Audit published (this package)     ✅
Phase 1  Authorize + remediate M-01 Commercial home
Phase 2  Authorize + remediate M-02 Financials home
Phase 3  Authorize + remediate M-03 Migration home
Phase 4  Re-audit Admin surfaces → expect 0 Class D
```

Do **not** run Phases 1–3 without authorize phrases. Prefer stacking under CORE-004 after `APPROVE CORE-004`.

---

## 6. Explicit non-goals

| Forbidden | Why |
|-----------|-----|
| New UX initiative (UX-017) | UX-016 closed; STD-001 is law |
| Remounting UDF on every settings page | Violates home-vs-tool applicability |
| New routes for Roles/Audit cosmetics | Out of compliance scope |
| Business logic / permission / schema changes | Not required for presentation compliance |
| External AI | Forbidden by UX-016 closeout posture |

---

## 7. Re-audit checklist (post migration)

For each remediated home, re-run:

| Check | Pass? |
|-------|-------|
| Universal Dashboard Framework | ☐ |
| Greeting | ☐ |
| M.P.A. Assistant | ☐ |
| Waiting on Me | ☐ |
| Waiting on Others | ☐ |
| Immediate Attention | ☐ |
| Today’s Mission | ☐ |
| Recommended Actions | ☐ |
| Timeline | ☐ |
| Insights | ☐ |
| Universal Sidebar | ☐ |
| Mobile Navigation | ☐ |

Update [06](./06-admin-surface-compliance-audit.md) scorecard when Class D = 0.

---

## 8. Ownership

| Role | Responsibility |
|------|----------------|
| Product | Prioritize M-01…M-03 under CORE-004 |
| UX | Confirm no new patterns — inheritance only |
| Engineering | View-model mappers + page remounts |
| Gate | Authorize per slice before code |
