# 08 — Empty and Loading States

**Package:** UX-016  
**Status:** Draft — Ready for Approval  
**Date:** 2026-08-05  
**Related:** [UX-012 §15 Empty states](../112-ux-012-platform-experience-design-system/15-empty-states.md) · Canopy skeletons

---

## Empty states — never blank

Every empty region must explain:

1. **What this page/section does**  
2. **Why it’s empty**  
3. **What action to take next** (one primary CTA when an action exists)

### Examples

| Region | Empty copy pattern |
|--------|--------------------|
| Immediate Attention | “You’re clear for now.” + why + suggested next action (e.g. Review today’s mission / Create work order) |
| Today’s Mission | “No open work in your queues.” + how work appears + CTA to create/invite as role-appropriate |
| Recent Activity | Omit section or “Activity will show here as work completes.” |
| Whole first-run home | Guided first win CTA (add property / accept invite / pay rent) — not a feature zoo |

Do not use decorative empty illustrations that outshine the next action.

---

## Loading — contextual skeletons

| Prefer | Avoid |
|--------|-------|
| Section-shaped skeletons matching Greeting / Attention / Mission | Generic centered spinner as the whole page |
| Stable layout (reserved space) | Content jumping when data arrives |
| Partial progressive reveal by section | Blocking the entire shell on one slow query |

Shell chrome (top bar / nav) can render immediately; canvas sections skeleton independently.

---

## Error

Reuse UX-012 error patterns: plain language, retry, path home. Never leave a permanent blank panel after failure.
