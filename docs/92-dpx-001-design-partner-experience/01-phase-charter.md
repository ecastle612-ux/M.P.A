# 01 — Phase Charter

**Package:** DPX-001  
**Status:** Draft

---

## Problem

M.P.A. is functionally strong and production-deployed, but Design Partner adoption still hinges on whether daily work feels obvious, calm, and faster than alternatives — not on how many modules exist.

## Goal

Make a property manager’s day easier: less hunting, less scrolling, less hesitation, more completed work.

## Binding question

For every change in Phase 6 **and all future product work**:

> Does this make a property manager's day easier?

Success is measured by **operator experience**, not feature count.

If the answer is no or unclear, do not ship.

## Constraints (hard)

- Preserve business logic, APIs, permissions, multi-tenant architecture, integrations, and certifications  
- No schema / RLS / auth-plane changes unless a separate approved ADR requires them  
- Canopy + Experience Architecture remain authoritative  
- Prefer improving existing surfaces over inventing new ones  
- Shell stability must not regress (SH-002 / SH-003)

## Non-goals

- New feature modules “for completeness”  
- Speculative performance work (owned by paused [EP-019](../87-ep-019-performance-speed-certification/README.md) until UX-009/DPX measurement lands)  
- Redesigning competitor parity checklists as product requirements  
- Training manuals as a substitute for clearer UX

## Success feel test

A first-time property manager can complete common jobs confidently without training, and a returning design partner chooses M.P.A. for daily ops because it is calmer and faster than what they use today.
