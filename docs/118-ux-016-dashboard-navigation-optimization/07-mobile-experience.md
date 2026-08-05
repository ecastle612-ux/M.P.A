# 07 — Mobile Experience

**Package:** UX-016  
**Status:** ✅ **Authorized for Slice C** — Ops bottom nav: Dashboard · My Work · Search · Notifications · Profile ([20](./20-slice-c-authorization.md) · [21](./21-intelligent-workspace-navigation.md))  
**Date:** 2026-08-05  
**Related:** [UX-008 Premium Mobile Navigation](../84-ux-008-premium-mobile-navigation/README.md) · [ADR-020](../18-decision-log/adr-020-premium-mobile-navigation-architecture.md) · [UX-012 §06 Mobile](../112-ux-012-platform-experience-design-system/06-mobile-ux.md)

---

## First viewport (thumb-first)

Single column, in order:

1. Greeting  
2. Immediate Attention (or calm empty)  
3. Today’s Mission (compact)  
4. Quick Actions (primary 4)  
5. Everything else below (Recent Activity → Insights)

Optimize for **thumb reach**: primary CTAs in the lower-middle of the first screen when possible; avoid forcing critical actions into top-leading corners only.

---

## Bottom navigation

Expose **only highest-frequency actions** for the assigned surface.

### Ops / Property Manager (example)

| Slot | Destination |
|------|-------------|
| 1 | Home (Command Center) |
| 2 | Work / Inbox |
| 3 | Create (FAB or center action — role primary create) |
| 4 | Messages |
| 5 | More |

### Resident (example)

| Slot | Destination |
|------|-------------|
| 1 | Home |
| 2 | Pay / Money |
| 3 | Maintenance |
| 4 | Messages |
| 5 | More |

Exact labels follow UX-013 portal matrices + UX-008 patterns; UX-016 constrains **frequency** and forbids stuffing full desktop IA into the bottom bar.

---

## Rules

| Rule | Binding |
|------|---------|
| No KPI wall above Immediate Attention | ✔ |
| Bottom nav ≤ 5 destinations | ✔ |
| Secondary workflows live in More | ✔ |
| Touch targets ≥ Canopy / UX-012 minimums | ✔ |
| Respect safe areas / install banners without covering primary CTA | ✔ |

---

## Technician exception

Technician surfaces may promote **Start/Next job** as the dominant first-viewport CTA and keep bottom nav shorter (Home · Jobs · More) when that better matches field use — still without inventing a new hierarchy.
