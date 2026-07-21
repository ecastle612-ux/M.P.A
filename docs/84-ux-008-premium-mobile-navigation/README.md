# UX-008 — Premium Mobile Navigation & Information Architecture

**Initiative ID:** UX-008  
**Status:** Design - Approved · Document - Approved · **ADR-020 Accepted** · Implement unlocked  
**Scope:** Mobile shell navigation UX/UI and information architecture only  
**Depends on:** UX-007 Adaptive Logo System (Completed), ADR-019, Canopy (Approved), Experience Architecture (Approved)

---

## Decision intent

M.P.A. is entering Design Partner testing. The current mobile drawer is not production-acceptable: branding is unreadable, vertical space is wasted, and the flat long menu forces excessive scrolling.

UX-008 redesigns the **mobile navigation experience** so it feels like premium commercial property software, while remaining fully connected to existing routes and permission checks — and so the chassis can scale to **40–60 modules** over 3–5 years without redesign.

## Non-goals

- No business logic changes
- No database / schema changes
- No API contract changes
- No route URL renames
- No permission model changes
- No desktop sidebar redesign unless required for shared token consistency
- No new logo artwork beyond UX-007 approved assets and typographic brand lockups
- No inventing unread counts or Operations Score backends when data is unavailable

## Goals

1. Branding is immediately recognizable in the mobile drawer (collapsible lockup).
2. Scrolling to reach primary destinations is reduced by at least 50%.
3. Search-first jump navigation for destinations and synonyms.
4. Favorites + Recently Visited for personalized, resume-oriented access.
5. Company switcher reserved in the drawer header (even for one org).
6. Notification badges where existing counts are available.
7. Sticky **＋ New** OS-style create menu (not plain link rows).
8. Operations Score / health slot reserved in the header.
9. Desktop `⌘K` / `Ctrl+K` command palette preserved and reserved.
10. Navigation remains instant, accessible, permission-aware, and platform-scalable.

## Package documents

| Doc | Purpose |
| --- | --- |
| [01-context-and-problem.md](./01-context-and-problem.md) | Current-state problems and constraints |
| [02-system-spec.md](./02-system-spec.md) | Architecture for brand lockup, IA, density, sticky actions, a11y, performance |
| [03-information-architecture.md](./03-information-architecture.md) | Collapsible sections, pin row, quick actions, route mapping |
| [04-logo-surface-audit.md](./04-logo-surface-audit.md) | Cross-surface UX-007 logo consistency audit plan |
| [05-certification-plan.md](./05-certification-plan.md) | PASS/FAIL gates for Design Partner readiness |
| [06-approval.md](./06-approval.md) | Gate sign-off record |
| [07-platform-scale-navigation.md](./07-platform-scale-navigation.md) | Approved amendments 1–10 (platform chassis) |

## Related ADR

- [ADR-020 — Premium Mobile Navigation Architecture](../18-decision-log/adr-020-premium-mobile-navigation-architecture.md) — **Accepted**

## Approval

Recorded 2026-07-20:

```text
APPROVE UX-008
ACCEPT ADR-020
```

Plus binding platform-scale amendments in [`07-platform-scale-navigation.md`](./07-platform-scale-navigation.md).
