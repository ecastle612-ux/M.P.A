# 13 — Implementation Lock

**Package:** UX-016  
**Status:** Slices A–B 🔓 **UNLOCKED** · Slices C–D 🔒 **LOCKED**  
**Date:** 2026-08-05  
**Policy:** [Implementation Gate](../00-governance/implementation-gate.md) · [ADR-012](../18-decision-log/adr-012-design-document-approve-implement.md)

---

## Verdict

**UX-016 is Approved.** Implement **only** authorized slices.

- Slice A: unlocked — [16](./16-slice-a-authorization.md)  
- Slice B: unlocked — [17](./17-slice-b-authorization.md)  
- Slices C–D: remain locked until their authorize phrases  

---

## What may ship under Slice B

| Area | Allowed |
|------|---------|
| Role-specific view-model content on AUTH homes | ✔ Presentation only |
| Remount existing portal/ops homes onto Universal Dashboard | ✔ Same hierarchy |
| Role-tuned empty states / greeting / mission / quick actions | ✔ |
| Unit tests for surface mappers | ✔ |

## What must not ship until later authorize

| Area | Locked until |
|------|--------------|
| Sidebar workflow regrouping / top-bar simplification | Slice C |
| Notification Center Critical/Today/Later · AI briefing productization | Slice D |
| Business logic, routing, permissions, APIs, schema, workflows | Never in UX-016 |

---

## After each slice

1. Implement only authorized scope  
2. Preserve: no business logic / routing / permissions / workflow / API / schema changes  
3. Verify five-second test + a11y smoke for touched surfaces  
4. Commit citing `UX-016` + authorize phrase  

Material scope changes after Approve restart Design → Document → Approve.
