# WF-004 — Workflow Intelligence & Context Automation

**Status:** Design ✔ · Document ✔ · **Approved (EP-006)** · Implement unlocked  
**Initiative ID:** WF-004  
**Authorization:** EP-006 — 2026-07-19  
**Type:** Workflow enhancement only — no new modules, no schema, no API/architecture changes

---

## Objective

Reduce daily decisions by pre-filling known context, suggesting next actions into **existing** workflows, and guiding completion chains.

## Hard constraints

Do **not** modify: Accounting/Facility/Asset/Reporting/Timeline/Command Center/Master Admin/Ops Center core architecture, database schema, existing APIs, or business-logic contracts.

**Allowed:** Client presentation helpers, URL/searchParam prefills, local workspace memory, suggestion UI linking to existing routes, empty-state and success-config copy/links, form UX consistency.

## Workstreams

1. Context-aware forms (workspace memory + URL + soft suggestions)  
2. Smart suggestions (launch existing workflows)  
3. Operational memory hints (read existing facility/vendor history client-side where already loaded)  
4. Duplicate-entry reduction via prefills  
5. Workflow completion chains (success configs)  
6. Intelligent empty states  
7. Workspace consistency + mobile polish  

## Documents

| Doc | Purpose |
| --- | --- |
| [01-implementation-notes.md](./01-implementation-notes.md) | File targets |
| [02-delivery-summary.md](./02-delivery-summary.md) | Verification + scores |
