# 18 — Acceptance Criteria

**Package:** UX-012  
**Status:** ✅ Approved with Amendments · Implement 🔒 Locked

---

## A) Design package acceptance (Approve gate)

| ID | Criterion | Status |
|----|-----------|--------|
| D-01 | Docs 00–29 present | ✔ |
| D-02 | Design principles binding | ✔ |
| D-03 | Token governance + Canopy values | ✔ |
| D-04 | Component/layout/nav/mobile/desktop standards | ✔ |
| D-05 | Role playbooks + Command Center spec | ✔ |
| D-06 | Quality standards, maturity, metrics, review gate | ✔ |
| D-07 | AI, branding, a11y, motion, content, empty, error, journeys | ✔ |
| D-08 | ADR-029 Accepted; slices A–E finalized; implement locked | ✔ |
| D-09 | Amendments A01–A08 incorporated | ✔ |
| D-10 | UI-001 inherits UX-012 | ✔ |

---

## B) Product acceptance (post-implement slices)

| ID | Criterion |
|----|-----------|
| P-01 | New screens use Canopy tokens only |
| P-02 | Command Center matches [09](./09-command-center-ux.md) structure |
| P-03 | Role homes feel purpose-built |
| P-04 | WCAG 2.2 AA regression checks on touched surfaces |
| P-05 | AI UX shows confidence + approval where required |
| P-06 | Mobile 44px targets; bottom nav patterns |
| P-07 | Empty/error states follow standards |
| P-08 | No one-off component systems |
| P-09 | Slice authorize required before UI code |

---

## Explicit fail conditions

- Hardcoded colors/fonts bypassing Canopy  
- Bolt-on purple AI chrome  
- User-selectable dashboards  
- Icon-only primary nav without labels  
- Shipping UI without `AUTHORIZE UX-012 SLICE …`  
- Skipping Design → A11y → Mobile → PWA → Regression → Approval  
- UI-001 (or any package) inventing a competing design system  
