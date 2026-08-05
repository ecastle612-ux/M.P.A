# 16 — Slice A Authorization

**Package:** UX-016  
**Slice:** A — Universal Dashboard Framework  
**Status:** ✅ **AUTHORIZED**  
**Phrase:** `AUTHORIZE UX-016 SLICE A`  
**Date:** 2026-08-05  
**Depends on:** [12 — Approval record](./12-approval-record.md) · [ADR-032](../18-decision-log/adr-032-ux-016-dashboard-navigation-optimization.md) (**Accepted**)

---

## Scope

Establish the **standard dashboard experience** used across every role in M.P.A.

Slice A delivers:

1. Reusable **Universal Dashboard Framework** components (presentation-only view models)  
2. Binding section order: Greeting → Immediate Attention → Today’s Mission → Quick Actions → Recent Activity → Insights (below fold)  
3. First consumer: Ops / Property Manager home at `/dashboard`  
4. Empty + section skeleton patterns for the framework  
5. Mapping of **existing** Command Center + dashboard snapshot signals into the hierarchy (no new APIs, routes, permissions, or workflows)

---

## Out of scope (later slices)

| Slice | Deferred |
|-------|----------|
| B | Role-specific dashboard specializations (Admin, Technician, Leasing, Resident, Vendor, Owner, Support) |
| C | Sidebar workflow regrouping + top-bar simplification |
| D | Notification Center Critical/Today/Later · Activity Timeline polish · AI daily briefing |

---

## Constraints (binding)

- No business logic, routing, permissions, or workflow changes  
- No AUTH dashboard reassignment / portal picker  
- No parallel priority engine — reuse OPS + dashboard snapshot data  
- Canopy / UX-012 chrome and tokens inherited  

---

## Success standard

Before Slice A is complete on `/dashboard`:

- [x] I know where I am  
- [x] I know what needs attention  
- [x] I know what to do next  
- [x] I can begin working immediately  
- [x] I never have to search for today’s priorities  
