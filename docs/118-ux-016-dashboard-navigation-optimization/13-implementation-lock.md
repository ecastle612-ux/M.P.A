# 13 — Implementation Lock

**Package:** UX-016  
**Status:** Slices A–D 🔓 **UNLOCKED**  
**Date:** 2026-08-05  
**Policy:** [Implementation Gate](../00-governance/implementation-gate.md) · [ADR-012](../18-decision-log/adr-012-design-document-approve-implement.md)

---

## Verdict

**UX-016 is Approved.** Implement **only** authorized slices.

- Slice A: unlocked — [16](./16-slice-a-authorization.md)  
- Slice B: unlocked — [17](./17-slice-b-authorization.md) · [18](./18-master-admin-experience.md)  
- Slice C: unlocked — [20](./20-slice-c-authorization.md) · [21](./21-intelligent-workspace-navigation.md)  
- Slice D: unlocked — [23](./23-slice-d-authorization.md) · [24](./24-mpa-assistant.md)  

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

## What may ship under Slice D

| Area | Allowed |
|------|---------|
| M.P.A. Assistant Card (below Greeting) | ✔ Deterministic briefing from existing home data |
| Waiting on Me · Waiting on Others | ✔ Presentation of existing queue / snapshot signals |
| Notification Center Critical / Today / Later | ✔ Design-only mapping; no schema change |
| Operational Timeline | ✔ Meaningful-event presentation over existing activity |
| Recommended Actions · Quick Wins · Cross-module context | ✔ Existing deep links only |
| Mobile Assistant collapse preference | ✔ Client localStorage |
| Accessibility polish on touched Assistant / Notification surfaces | ✔ WCAG AA |
| View-model mappers + unit tests | ✔ |

## What must not ship under UX-016

| Area | Locked until |
|------|--------------|
| portal-test contract expansion / new security surfaces | Separate security-sensitive authorize |
| Business logic, routing tables, permissions, workflows | Never in UX-016 |
| External AI services / new model calls | Never in UX-016 Slice D |

---

## After each slice

1. Implement only authorized scope  
2. Preserve: no business logic / routing / permissions / workflow / API / database / security changes  
3. Verify five-second test + a11y smoke for touched surfaces  
4. Commit citing `UX-016` + authorize phrase  

Material scope changes after Approve restart Design → Document → Approve.
