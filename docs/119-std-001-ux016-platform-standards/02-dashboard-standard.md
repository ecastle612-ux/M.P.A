# 02 — Dashboard Standard

**Standard:** STD-001  
**Status:** ✅ Binding — mandatory for all future modules  
**Date:** 2026-08-05  
**Implements:** [01 — Permanent UX Standard](./01-permanent-ux-standard.md)  
**Lineage:** [UX-016 §02](../118-ux-016-dashboard-navigation-optimization/02-dashboard-standard.md) · UI-001 §07 (compatible)

---

## Mandate

The **Universal Dashboard Framework** is the only approved home anatomy for M.P.A. module and role homes.

| Rule | Binding |
|------|---------|
| One framework | All new module homes mount the Universal Dashboard Framework (or an approved thin role mapper onto it) |
| No parallel homes | Modules must not ship a second competing dashboard layout |
| Work first | Insights / charts stay below the fold |
| Existing data | Present entitled, already-available operational signals — do not invent parallel priority engines for cosmetics |
| Deep links | Use existing routes; do not invent AUTH homes |

---

## Framework requirements

| Requirement | Binding |
|-------------|---------|
| Immediate Attention max | **5** |
| Quick Actions max | **6** desktop · **4** primary on mobile first viewport |
| Today’s Mission | 4–8 summary rows; hide zero counts |
| Assistant | Required on operational homes; may calm-collapse on pure calm portals when no work signals exist |
| Waiting sections | Omit when empty; never show “0 waiting” theater |
| Timeline | Meaningful events only; omit if low value |
| Loading | Section-shaped skeletons — not full-page spinner-only |
| Empty | Explain what / why / next action |

---

## Role specialization

Roles specialize **content**, not **anatomy**. See UX-016 [03](../118-ux-016-dashboard-navigation-optimization/03-role-dashboard-specializations.md).

Master Admin Mission Control remounts onto the same framework ([UX-016 §18](../118-ux-016-dashboard-navigation-optimization/18-master-admin-experience.md)).

---

## Module onboarding checklist

Before a new module ships a home:

1. Map signals into Universal Dashboard sections (no new section order).  
2. Wire Assistant Today / Waiting / Recommended from existing module queues.  
3. Deep-link to existing finish paths.  
4. Pass five-second test + a11y smoke.  
5. Cite STD-001 / ADR-033 in the PR.
