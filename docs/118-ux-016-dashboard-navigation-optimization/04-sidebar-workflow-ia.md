# 04 — Sidebar Workflow IA

**Package:** UX-016  
**Status:** Draft — Ready for Approval  
**Date:** 2026-08-05  
**Related:** [UX-013 §04 Contextual navigation matrices](../117-ux-013-customer-acquisition-contextual-navigation/04-contextual-navigation-matrices.md) · [UX-012 §05 Navigation](../112-ux-012-platform-experience-design-system/05-navigation-architecture.md)

---

## Intent

Simplify the sidebar. **Group by workflows**, not by engineering feature folders.

Reduce visual clutter. Collapse secondary items. Keep destinations aligned with UX-013 matrices (triple filter: surface × capability × module).

UX-016 does **not** invent new routes or entitlement rules. It owns **grouping, labels for groups, default expand/collapse, and density**.

---

## Workflow groups (ops shell default)

Recommended group labels for Organization Admin / Property Manager surfaces:

| Order | Group | Typical destinations (from matrices) |
|------:|-------|--------------------------------------|
| 1 | **Home** | Command Center (always first, not buried) |
| 2 | **Operations** | Ops Inbox / unified work entry |
| 3 | **Maintenance** | Work orders · facility cross-links when entitled |
| 4 | **Leasing** | Leases · applicants · move in/out |
| 5 | **Residents** | Tenants · resident communications entry |
| 6 | **Vendors** | Vendor directory / jobs |
| 7 | **Accounting** | Financials · charges · payouts (entitled) |
| 8 | **Documents** | Vault / document tools |
| 9 | **Communication** | Announcements · messaging hubs |
| 10 | **Reports** | Reporting catalog |
| 11 | **Administration** | Team · subscription · settings |

Facility-only surfaces reorder toward Facility / Inventory / PM / Inspections per UX-013 Matrix C, still under workflow group names (not raw feature dumps).

Portal surfaces (Tenant, Owner, Technician, Vendor) use **short primary lists** — groups collapse to a handful of top-level items; do not force the full ops taxonomy.

---

## Clutter rules

| Rule | Binding |
|------|---------|
| Hide unentitled | Omit — never locked teaser in primary nav |
| Collapse secondary | Groups with > 1 child collapse; remember user expand state locally |
| Active trail | Expand ancestor of current route |
| Badge sparingly | Counts only for actionable work (inbox, approvals), not vanity |
| Settings | Live under Administration (or portal More) — not duplicated across groups |
| Search | Top bar owns global search — sidebar is not a second search hero |

---

## Relationship to UX-013 Slice C

| Concern | Authority |
|---------|-----------|
| Which destinations exist per surface | UX-013 matrices |
| How they are grouped / collapsed / labeled as workflows | **UX-016** |
| Visual chrome | Canopy / UX-012 |

Implementing sidebar rewrite still requires UX-016 Approve **and** coordination with UX-013 Slice C authorize (nav matrix application). See [14](./14-open-questions.md) OQ-01.

---

## Anti-patterns

- Flat list of 20+ equal-weight links  
- Feature-team naming (“Facility Module”, “API Tools”)  
- Duplicating the same destination under two groups  
- Promoting Reports/Admin above daily work groups for PM surfaces  
