# 13 — Implementation Lock

**Package:** UX-016  
**Status:** Slices A–C 🔓 **UNLOCKED** · Slice D 🔒 **LOCKED**  
**Date:** 2026-08-05  
**Policy:** [Implementation Gate](../00-governance/implementation-gate.md) · [ADR-012](../18-decision-log/adr-012-design-document-approve-implement.md)

---

## Verdict

**UX-016 is Approved.** Implement **only** authorized slices.

- Slice A: unlocked — [16](./16-slice-a-authorization.md)  
- Slice B: unlocked — [17](./17-slice-b-authorization.md)  
- Slice C: unlocked — [18](./18-slice-c-authorization.md)  
- Slice D: remains locked until authorize phrase  

---

## What may ship under Slice C

| Area | Allowed |
|------|---------|
| Workflow sidebar regrouping (existing hrefs) | ✔ Presentation / IA |
| Contextual property nav from pathname | ✔ Existing `?propertyId=` links |
| Favorites / recents / collapse via localStorage | ✔ No schema |
| Desktop Quick Create + ops mobile bottom nav | ✔ Existing destinations |
| Top bar simplification (Search · Notifications · Org · Profile) | ✔ Presentation |
| Motion / a11y polish for nav chrome | ✔ Canopy / UX-012 |

## What must not ship until later authorize

| Area | Locked until |
|------|--------------|
| Notification Center Critical/Today/Later · AI briefing productization | Slice D |
| Business logic, routing, permissions, APIs, schema, workflows | Never in UX-016 |

---

## After each slice

1. Implement only authorized scope  
2. Preserve: no business logic / routing / permissions / workflow / API / schema changes  
3. Verify two-click workflow reach + a11y smoke for shell  
4. Commit citing `UX-016` + authorize phrase  

Material scope changes after Approve restart Design → Document → Approve.
