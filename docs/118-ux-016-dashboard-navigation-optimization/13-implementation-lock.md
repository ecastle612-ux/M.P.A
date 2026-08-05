# 13 — Implementation Lock

**Package:** UX-016  
**Status:** Slice A 🔓 **UNLOCKED** · Slices B–D 🔒 **LOCKED**  
**Date:** 2026-08-05  
**Policy:** [Implementation Gate](../00-governance/implementation-gate.md) · [ADR-012](../18-decision-log/adr-012-design-document-approve-implement.md)

---

## Verdict

**UX-016 is Approved.** Implement **only** authorized slices.

- Slice A: unlocked — [16](./16-slice-a-authorization.md)  
- Slices B–D: remain locked until their authorize phrases  

---

## What may ship under Slice A

| Area | Allowed |
|------|---------|
| Universal Dashboard Framework components | ✔ Presentation-only |
| Ops `/dashboard` remount into UX-016 hierarchy | ✔ Using existing snapshot / Command Center data |
| Empty + skeleton patterns for framework sections | ✔ |
| View-model mapping helpers + unit tests | ✔ |

## What must not ship until later authorize

| Area | Locked until |
|------|--------------|
| Role-specific portal/home rewrites | Slice B |
| Sidebar workflow regrouping / top-bar simplification | Slice C |
| Notification Center Critical/Today/Later · AI briefing productization | Slice D |
| Business logic, routing, permissions, workflows | Never in UX-016 |

---

## After each slice

1. Implement only authorized scope  
2. Preserve: no business logic / routing / permissions / workflow changes  
3. Verify five-second test + a11y smoke for touched surfaces  
4. Commit citing `UX-016` + authorize phrase  

Material scope changes after Approve restart Design → Document → Approve.
