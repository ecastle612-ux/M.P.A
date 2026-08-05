# 13 — Implementation Lock

**Package:** UX-016  
**Status:** Slices A–C 🔓 **UNLOCKED** · Slice D 🔒 **LOCKED**  
**Date:** 2026-08-05  
**Policy:** [Implementation Gate](../00-governance/implementation-gate.md) · [ADR-012](../18-decision-log/adr-012-design-document-approve-implement.md)

---

## Verdict

**UX-016 is Approved.** Implement **only** authorized slices.

- Slice A: unlocked — [16](./16-slice-a-authorization.md)  
- Slice B: unlocked — [17](./17-slice-b-authorization.md) · [18](./18-master-admin-experience.md)  
- Slice C: unlocked — [20](./20-slice-c-authorization.md) · [21](./21-intelligent-workspace-navigation.md)  
- Slice D: remains locked until its authorize phrase  

---

## What may ship under Slice A

| Area | Allowed |
|------|---------|
| Universal Dashboard Framework components | ✔ Presentation-only |
| Ops `/dashboard` remount into UX-016 hierarchy | ✔ Using existing snapshot / Command Center data |
| Empty + skeleton patterns for framework sections | ✔ |
| View-model mapping helpers + unit tests | ✔ |

## What may ship under Slice B

| Area | Allowed |
|------|---------|
| Master Admin Portal Launcher expansion (grouped role cards) | ✔ Presentation-only |
| Open Portal · View As · Launch in Test Mode on every card | ✔ Using existing portal-test / impersonation / deep links |
| Mission Control remount onto Universal Dashboard Framework | ✔ Mapping existing Mission Control snapshot signals |
| Surface Switcher alignment to launcher catalog | ✔ |
| Master Admin view-model mapper + unit tests | ✔ |

## What may ship under Slice C

| Area | Allowed |
|------|---------|
| Universal sidebar regrouping / My Work prominence | ✔ Same hrefs · existing entitlement filters |
| Contextual property / vendor nav presentation | ✔ Pathname-driven · existing deep links |
| Favorites + Recent in desktop sidebar | ✔ Existing Command Center localStorage |
| Command Center label / action copy alignment | ✔ No new search APIs |
| Quick Create persistent control | ✔ Existing create hrefs |
| Ops mobile bottom nav (≤ 5) | ✔ Dashboard · My Work · Search · Notifications · Profile |
| Accessibility polish on touched chrome | ✔ WCAG AA |

## What must not ship until later authorize

| Area | Locked until |
|------|--------------|
| Notification Center Critical/Today/Later · AI briefing productization | Slice D |
| portal-test contract expansion / new security surfaces | Separate security-sensitive authorize |
| Business logic, routing tables, permissions, workflows | Never in UX-016 |

---

## After each slice

1. Implement only authorized scope  
2. Preserve: no business logic / routing / permissions / workflow / API / database / security changes  
3. Verify five-second test + a11y smoke for touched surfaces  
4. Commit citing `UX-016` + authorize phrase  

Material scope changes after Approve restart Design → Document → Approve.
