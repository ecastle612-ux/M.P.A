# 01 — Core Philosophy

**Package:** UX-016  
**Status:** Draft — Ready for Approval  
**Date:** 2026-08-05

---

## Work companion, not management system theater

M.P.A. succeeds when opening the app feels like sitting down with a competent operations partner: calm, ranked, and ready to act.

It fails when opening the app feels like opening a filing cabinet of modules.

---

## Permanent laws

| # | Law | Meaning |
|---|-----|---------|
| L1 | **Work before navigation** | The first viewport is work. Sidebar/top bar are chrome. |
| L2 | **Attention is sacred** | Only true urgency may use critical treatment. |
| L3 | **One primary next step** | Each first viewport has one dominant CTA path. |
| L4 | **Familiar across portals** | Same hierarchy everywhere; content is role-specific. |
| L5 | **Hide noise** | Unentitled, unauthorized, or low-signal items are omitted — not grayed teasers. |
| L6 | **Analytics serve work** | Insights stay below the fold until work is clear. |
| L7 | **Never blank without guidance** | Empty and loading states always explain and suggest. |
| L8 | **No portal shopping** | AUTH-001 assignment stands; users do not pick dashboards. |

Inherited emotional laws: [Experience Principles](../21-experience-architecture/experience-principles.md).

---

## Five-second test (binding)

At first paint (no deliberate scroll), a reviewer must answer all five:

1. **Who am I?**  
2. **Where am I?** (org / property / date)  
3. **What needs my attention?**  
4. **What should I do next?**  
5. **How do I start working?**

Fail any → continue refining. Searching the UI for answers is a fail.

---

## Anti-patterns (forbid on home)

| Anti-pattern | Why |
|--------------|-----|
| Module launcher as hero | Navigation becomes the product |
| Equal-weight KPI wall above the fold | Analytics before work |
| More than one primary CTA of equal weight | Decision paralysis |
| Long unread notification dump on home | Noise replaces priority |
| “Welcome to Dashboard” with no mission | Empty ceremony |
| Role-unique layouts that break the shared hierarchy | Portal inconsistency |

---

## Mapping to prior language

| This package | Prior SoT language |
|--------------|-------------------|
| Work companion | Experience Architecture first-five + UX-012 Command Center |
| Immediate Attention | UI-001 critical alerts + highest priority task; OPS Priority Engine |
| Today’s Mission | UI-001 today’s mission + work queue summary |
| Insights below fold | UX-012 analytics secondary; UI-001 insights rule |
