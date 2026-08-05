# 20 — Slice C Authorization

**Package:** UX-016  
**Slice:** C — Intelligent Workspace Navigation  
**Status:** ✅ **AUTHORIZED**  
**Phrase:** `AUTHORIZE UX-016 SLICE C – Intelligent Workspace Navigation`  
**Date:** 2026-08-05  
**Depends on:** [12 — Approval record](./12-approval-record.md) · [17 — Slice B](./17-slice-b-authorization.md) · [ADR-032](../18-decision-log/adr-032-ux-016-dashboard-navigation-optimization.md) (**Accepted**)  
**Design SoT:** [21 — Intelligent Workspace Navigation](./21-intelligent-workspace-navigation.md) · [04 — Sidebar workflow IA](./04-sidebar-workflow-ia.md) · [05 — Top bar](./05-top-bar-and-shell.md) · [07 — Mobile](./07-mobile-experience.md)

---

## Binding phrase (issued)

```
AUTHORIZE UX-016 SLICE C – Intelligent Workspace Navigation
```

> Phrase issued. Implementation may begin **only** within the scope below.  
> UX-016 Slice D remains **locked**.  
> Do **not** modify business logic, routing tables, permissions, APIs, database, security, or existing workflows.

---

## 1. Prerequisite verification

| Prerequisite | Evidence | Status |
|--------------|----------|--------|
| UX-016 Approved | [12](./12-approval-record.md) | ✅ |
| ADR-032 Accepted | [ADR-032](../18-decision-log/adr-032-ux-016-dashboard-navigation-optimization.md) | ✅ |
| Slice A Authorized + shipped | [16](./16-slice-a-authorization.md) | ✅ |
| Slice B Authorized + shipped | [17](./17-slice-b-authorization.md) · [19](./19-slice-b-implementation.md) | ✅ |
| Explicit authorize phrase recorded | **This document** | ✅ |

**Governance blockers remaining for Slice C?** ❌ **None.**

---

## 2. Authorization scope

### In scope (presentation / organization / navigation only)

| Deliverable | Binding source |
|-------------|----------------|
| **Universal sidebar structure** — Dashboard · My Work · Operations · Financial · Documents · Communication · Analytics · Administration | [21](./21-intelligent-workspace-navigation.md) · [04](./04-sidebar-workflow-ia.md) |
| **My Work prominence** — role-fit work destinations (Assigned Today, Waiting on Me, High Priority, Scheduled Today, Completed Today) using **existing** routes | [21](./21-intelligent-workspace-navigation.md) |
| **Contextual navigation** — when pathname is property- or vendor-scoped, present focused nav using existing deep links / query patterns | [21](./21-intelligent-workspace-navigation.md) |
| **Favorites + Recent** — pin/recents presentation in desktop sidebar (reuse existing Command Center localStorage) | [21](./21-intelligent-workspace-navigation.md) |
| **Command-first global search** — label/ranking/action copy polish on existing Command Center providers (no new search APIs) | [05](./05-top-bar-and-shell.md) · existing Command Center |
| **Quick Create** — persistent context-aware create control using existing create hrefs | [21](./21-intelligent-workspace-navigation.md) · [07](./07-mobile-experience.md) |
| **Breadcrumb consistency** — presentation helpers; pages continue to supply trail | existing `Breadcrumbs` |
| **Mobile bottom nav** — Dashboard · My Work · Search · Notifications · Profile; everything else in drawer | [07](./07-mobile-experience.md) · authorize phrase |
| **Accessibility** — WCAG AA keyboard/focus/reduced-motion for touched chrome | [09](./09-accessibility.md) |

### Implementation boundaries

1. Regroup / retitle / collapse / prioritize existing destinations only — **same hrefs**.  
2. Hide unentitled items via existing `requiredCapability` / `requiredModule` / `canAccess` — do not invent new gates.  
3. Favorites / Recent are client preference only (existing storage keys).  
4. Contextual nav is pathname-driven presentation — not a new property/vendor shell or route tree.  
5. Quick Create and mobile bottom nav only deep-link existing surfaces / open existing Command Center / Notification Center events.  
6. Master Admin–only shell keeps HQ-focused groups (no fake PM portfolio chrome).  
7. Notification Critical/Today/Later productization remains Slice D.

### Explicit excludes

| Excluded | Remains |
|----------|---------|
| New routes / AUTH dashboard assignment | Forbidden |
| Permission / entitlement / RLS / API / DB changes | Forbidden |
| Business workflow changes | Forbidden |
| Slice D Notification Center / AI briefing | Separate authorize |
| Expanding portal-test / impersonation contracts | Forbidden |

---

## 3. Acceptance criteria (Slice C) — NC-01 … NC-12

| ID | Criterion |
|----|-----------|
| **NC-01** | Ops sidebar follows universal group order: Dashboard → My Work → Operations → Financial → Documents → Communication → Analytics → Administration (labels may adapt; empty groups omit). |
| **NC-02** | Dashboard / home is always first among primary destinations. |
| **NC-03** | My Work lists work-oriented destinations mapped to existing routes. |
| **NC-04** | Property pathname context shows property-focused nav (Overview · Residents · Maintenance · Leases · Documents · Financial · Activity · Settings) via existing deep links. |
| **NC-05** | Vendor pathname context shows vendor-focused nav via existing deep links. |
| **NC-06** | Favorites appear near top; pinning reuses existing favorite storage. |
| **NC-07** | Recent items appear from existing recent storage. |
| **NC-08** | Global search remains command-first (existing Command Center) and recognizes create/action phrases already supported. |
| **NC-09** | Quick Create exposes existing create destinations in a persistent control. |
| **NC-10** | Mobile bottom nav ≤ 5: Dashboard · My Work · Search · Notifications · Profile; remainder in drawer. |
| **NC-11** | No business logic / routing / permissions / API / DB / security changes. |
| **NC-12** | Docs + tests recorded; Slice D remains locked. |

---

## 4. Success standard

Navigation feels like a personalized workspace, not a static sitemap. Users know where they are, what they’re working on, where to go next, and can reach common tasks in two clicks or fewer.
