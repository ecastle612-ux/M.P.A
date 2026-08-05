# 03 — Navigation Standard

**Standard:** STD-001  
**Status:** ✅ Binding — permanent navigation model  
**Date:** 2026-08-05  
**Lineage:** [UX-016 Slice C](../118-ux-016-dashboard-navigation-optimization/21-intelligent-workspace-navigation.md) · UX-013 destination matrices

---

## Mandate

The UX-016 sidebar hierarchy is the **permanent navigation model** for operational shells.

```
1. Dashboard
2. My Work
3. Operations
4. Financial
5. Documents
6. Communication
7. Analytics
8. Administration
```

| Rule | Binding |
|------|---------|
| Dashboard first | Always the first primary destination |
| My Work second | Work-oriented destinations, not a feature dump |
| Empty groups omit | Never show locked teasers |
| Destinations | UX-013 / existing routes remain SoT — STD-001 owns grouping & density |
| Entitlements | Hide unentitled items via existing capability/module gates |
| No parallel IA | Modules must not invent a competing primary sidebar taxonomy |

---

## My Work (permanent intent)

Expose work-oriented entry points such as:

- Assigned Today  
- Waiting on Me  
- High Priority  
- Scheduled Today  
- Completed Today  

Use **existing** hrefs / filters. Labels may adapt by role.

---

## Contextual navigation

When the pathname is property- or vendor-scoped, present focused secondary nav via existing deep links / query patterns. Do not create nested parallel route trees solely for chrome.

---

## Shell chrome

| Surface | Binding |
|---------|---------|
| Top bar | Search · Notifications · Organization · Profile (+ necessary banners / brand) |
| Quick Create | Persistent create control using existing create destinations |
| Favorites / Recent | Client preference only |
| Mobile bottom nav | ≤ 5 high-frequency slots; remainder in drawer |
| Ops mobile default | Dashboard · My Work · Search · Notifications · Profile |

---

## Philosophy test

Every primary nav item must answer:

> Why would I click this right now?

If it does not support an active workflow, it does not belong in primary navigation.
