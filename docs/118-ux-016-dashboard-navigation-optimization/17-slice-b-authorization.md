# 17 — Slice B Authorization

**Package:** UX-016  
**Slice:** B — Role-Specific Command Centers  
**Status:** ✅ **AUTHORIZED**  
**Phrase:** `AUTHORIZE UX-016 SLICE B`  
**Date:** 2026-08-05  
**Depends on:** [12 — Approval record](./12-approval-record.md) · Slice A complete · [ADR-032](../18-decision-log/adr-032-ux-016-dashboard-navigation-optimization.md) (**Accepted**)

---

## Scope

Transform every role dashboard into a dedicated operational command center while **inheriting the Universal Dashboard Framework** from Slice A.

Surfaces in scope:

| Surface | AUTH home (unchanged) |
|---------|------------------------|
| Organization Administrator | `/dashboard` (PM company) |
| Property Manager | `/dashboard` |
| Maintenance Technician | `/maintenance` (facility hub data reused) |
| Leasing Agent | `/leases` |
| Resident | `/portal/tenant` |
| Vendor | `/v/[token]` job landing |
| Owner | `/portal/owner` |
| Support / Master Admin | `/master-admin` |

Only **content, priorities, quick actions, and empty-state copy** change by role. Hierarchy remains:

Greeting → Immediate Attention → Today’s Mission → Quick Actions → Recent Activity → Insights

---

## Constraints (binding)

- No business logic, routing, permissions, APIs, database schema, or workflow changes  
- No AUTH dashboard reassignment / portal picker  
- No sidebar regroup (Slice C)  
- No Notification Center / AI briefing productization (Slice D)  

---

## Success standard

A first-time user should immediately feel the dashboard was designed specifically for their role — not a generic dashboard with renamed widgets.
