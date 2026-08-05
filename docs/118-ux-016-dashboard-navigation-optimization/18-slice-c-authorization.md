# 18 — Slice C Authorization

**Package:** UX-016  
**Slice:** C — Workflow Navigation System  
**Status:** ✅ **AUTHORIZED**  
**Phrase:** `AUTHORIZE UX-016 SLICE C`  
**Date:** 2026-08-05  
**Depends on:** [12 — Approval record](./12-approval-record.md) · Slice B complete · [ADR-032](../18-decision-log/adr-032-ux-016-dashboard-navigation-optimization.md) (**Accepted**)

---

## Scope

Transform the ops sidebar from a feature list into an **operational workflow navigator**.

In scope (presentation / IA only):

1. Workflow sidebar hierarchy: Dashboard · My Work · Operations · Financial · Documents · Communication · Analytics · Administration  
2. Contextual property navigation when pathname is `/properties/[id]`  
3. Smart chrome: current workflow highlight, favorites, recents (localStorage)  
4. Desktop Quick Create menu (existing destinations only)  
5. Top bar simplification toward Search · Notifications · Org · Profile  
6. Mobile bottom nav for ops shell (Home · My Work · Create · Notifications · More)  
7. Collapsible groups, motion/a11y polish within Canopy / UX-012  

---

## Constraints (binding)

- No business logic, routing, permissions, APIs, database schema, or workflow changes  
- Destinations remain existing entitled hrefs (UX-013 matrices / current `navigation-config`)  
- Favorites / recents / pins persist client-side only (no new schema)  
- Hide unentitled items — never tease  

---

## Success standard

- Reach common workflows in **two clicks or fewer**  
- Sidebar feels like a productivity tool, not a page list  
- User never asks “where do I click?” for daily work  
