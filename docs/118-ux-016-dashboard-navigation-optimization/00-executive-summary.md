# 00 — Executive Summary

**Package:** UX-016  
**Status:** Draft — Ready for Approval  
**Date:** 2026-08-05

---

## Problem

M.P.A. dashboards and sidebars still often present **navigation and modules before work**. Users open the app and must hunt for what needs attention. That fails the five-second trust window defined in Experience Architecture and the “what should I do next?” bar in UI-001 / UX-012 Command Center.

Symptoms this package designs against:

- Feature-oriented sidebars that feel like a module catalog  
- KPI / chart density above actionable queues  
- Long undifferentiated notification lists  
- Role portals that share branding but not a familiar work hierarchy  
- Empty or spinner-first states that do not explain next action  

---

## Goal

Make every dashboard a **work companion**:

1. Surface critical work in the first viewport  
2. Keep navigation supportive, never heroic  
3. Keep a familiar hierarchy across all portals while specializing content by role  
4. Make notifications actionable and priority-grouped  
5. Optimize mobile for thumb-reach work, not denser menus  

---

## In scope

| Area | UX-016 owns |
|------|-------------|
| Dashboard section order | Binding hierarchy in [02](./02-dashboard-standard.md) |
| Role content specialization | What fills each section per surface ([03](./03-role-dashboard-specializations.md)) |
| Sidebar presentation | Workflow grouping + collapse rules ([04](./04-sidebar-workflow-ia.md)) |
| Top bar | Search · notifications · org · profile only ([05](./05-top-bar-and-shell.md)) |
| Notifications UX | Critical / Today / Later ([06](./06-notifications-priority-grouping.md)) |
| Mobile | First-viewport order + high-frequency bottom nav ([07](./07-mobile-experience.md)) |
| Empty / loading | Explanation + skeletons ([08](./08-empty-loading-states.md)) |
| Accessibility | WCAG AA + motion ([09](./09-accessibility.md)) |

---

## Out of scope

- Business logic, routing, permissions, workflows  
- Entitlement / module license rules (reuse AUTH/BILL; hide unentitled nav)  
- New notification delivery providers (OneSignal remains ADR-017)  
- Replacing OPS Priority Engine contracts — UX-016 **presents** existing signals  
- Full UI-001 post-GA redesign program (UX-016 is the near-term binding standard that inherits UI-001 anatomy intent)

---

## Success definition

Within five seconds of opening any dashboard, a user can answer:

| Question | Satisfied by |
|----------|--------------|
| Who am I? | Greeting (name) |
| Where am I? | Org + property/context + date |
| What needs my attention? | Immediate Attention |
| What should I do next? | Top attention item or Today’s Mission lead |
| How do I start working? | Dominant CTA and/or Quick Actions |

---

## Relationship snapshot

| Package | Relationship |
|---------|--------------|
| Canopy / Experience Architecture | Visual + emotional SoT — unchanged |
| UX-012 | Experience SoT; UX-016 specializes Command Center / shell presentation |
| UI-001 §07 | Universal anatomy — UX-016 binds a simplified action-first order compatible with it |
| UX-013 §04 | Nav destination matrices remain SoT; UX-016 owns **grouping / density presentation** |
| OPS-001 | Command Center data contracts reused; no parallel queue system |
| AUTH-001 | Dashboard assignment unchanged; no portal picker |
| UX-015 (if landed) | Craftsmanship polish of chrome — UX-016 owns IA/hierarchy, not primitive paint |

See [15](./15-relationship-to-prior-packages.md).
