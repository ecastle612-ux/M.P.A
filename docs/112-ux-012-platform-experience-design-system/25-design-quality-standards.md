# 25 — Design Quality Standards

**Package:** UX-012  
**Amendment:** A04  
**Status:** Binding (Approved with Amendments)

---

## Binding rule

Every screen must satisfy these **measurable** standards before slice Validation / completion. Failure = not done.

---

## Standards checklist

| ID | Standard | Pass condition |
|----|----------|----------------|
| Q-01 | No visual clutter | One primary job; no equal-weight chrome |
| Q-02 | Consistent spacing | Only spacing tokens; aligned columns |
| Q-03 | Responsive layout | Breakpoints behave; no broken overlap |
| Q-04 | Mobile-first critical paths | Primary journey completable on phone |
| Q-05 | No horizontal scrolling | Page/content doesn’t require sideways scroll at supported widths (tables may scroll internally with affordance) |
| Q-06 | Proper loading states | Async regions show skeleton or progress |
| Q-07 | Skeletons | Match final layout structure |
| Q-08 | Empty states | Per [15](./15-empty-states.md) with CTA when possible |
| Q-09 | Accessible interactions | Keyboard + focus + contrast per [12](./12-accessibility.md) |
| Q-10 | Native-feeling transitions | Motion tokens; reduced motion honored |
| Q-11 | Token-only styling | No hardcoded visual values ([22](./22-design-token-governance.md)) |
| Q-12 | Touch targets | ≥44px on touch UIs |
| Q-13 | One primary CTA | Per section/step |
| Q-14 | Entitlement-aware UI | No dead unpurchased modules shown as available |

---

## Review evidence

| Evidence | Example |
|----------|---------|
| Screenshots | Mobile + desktop |
| A11y notes | Keyboard path / contrast |
| Token audit | Grep for HEX/arbitrary px (CI later) |
| Interaction | Loading → data; empty; error |

---

## Acceptance (A04)

| ID | Criterion |
|----|-----------|
| QS-01 | Checklist Q-01–Q-14 binding for completion |
| QS-02 | Evidence expected at Validation |
| QS-03 | Fail any item ⇒ slice not Validated |
