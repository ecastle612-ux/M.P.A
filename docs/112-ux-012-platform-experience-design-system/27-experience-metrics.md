# 27 — Experience Metrics

**Package:** UX-012  
**Amendment:** A06  
**Status:** Binding (Approved with Amendments)

---

## Purpose

UX decisions should be **measured, not guessed**. Define KPIs that validate experience quality and inform design changes.

---

## KPI catalog

| KPI | Definition |
|-----|------------|
| **Time to complete maintenance request** | Tenant/PM start → submitted |
| **Time to create lease** | Start → active/signed (stage markers) |
| **Clicks to complete common workflows** | Instrumented primary paths |
| **Navigation depth** | Avg clicks from Home to task completion |
| **AI adoption** | Recommendations shown → accepted / useful |
| **Search success** | Query → result click / successful action |
| **Notification engagement** | Delivered → open/click (channel) |
| **Setup completion** | Org implementation score → 100% (COM/OPS) |
| **User satisfaction** | CSAT/NPS / in-product pulse |

### Supporting metrics

| KPI | Use |
|-----|-----|
| Error rate on forms | Friction |
| Rage clicks | Confusion |
| PWA install success | PMX |
| Accessibility defect escape | A11y |
| Horizontal scroll incidents | Quality |

---

## Principles

| Principle | Design |
|-----------|--------|
| Privacy | Aggregate; org-scoped; no PII in analytics exports |
| Actionable | Each KPI has an owner + threshold |
| Not vanity | Prefer task completion over pageviews |
| Tied to OPS/COM | Prefer event-sourced timings |

---

## Use in governance

| Use |
|-----|
| Slice Validation may require baseline instrumentation plan |
| Design Review asks “how will we know this is better?” |
| CS / Product review quarterly against thresholds |

---

## Acceptance (A06)

| ID | Criterion |
|----|-----------|
| XM-01 | Core KPIs listed with definitions |
| XM-02 | Measurement informs UX decisions |
| XM-03 | Privacy / org-scope respected |
| XM-04 | Linked to workflow events where possible |
