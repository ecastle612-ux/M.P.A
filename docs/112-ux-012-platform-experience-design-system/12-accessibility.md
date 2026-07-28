# 12 — Accessibility

**Package:** UX-012  
**Status:** Draft — Awaiting Approval

---

## Target

| Standard | Level |
|----------|-------|
| **WCAG** | **2.2 AA** (platform default) |
| AAA | Strive for text contrast where practical |

---

## Contrast

- Text/icon on surface meets AA  
- Status never color-only — pair with text/icon/pattern  
- Focus indicators ≥ 3:1 against adjacent colors  

---

## Keyboard navigation

- All interactive elements reachable  
- Visible focus (`:focus-visible` with Canopy ring)  
- Skip link to main content on desktop shells  
- Dialogs trap focus; restore on close  

---

## Focus states

Never remove outline without a token replacement ring.  
Focus order matches visual order.

---

## Screen readers

- Semantic headings, landmarks (`main`, `nav`, ` complimentary`)  
- Buttons named by action  
- Live regions for toasts/async status (`aria-live`)  
- Charts have text/table alternative  
- Decorative icons `aria-hidden`  

---

## Reduced motion

Honor `prefers-reduced-motion`: replace large motion with opacity/instant.  
Essential spinners may remain minimal.

---

## Color blindness

Do not encode sole meaning in red/green.  
Use shape/label/icons with status.

---

## Forms & errors

- Errors linked via `aria-describedby`  
- Don’t rely on placeholder as label  
- Announce errors on submit  

---

## Acceptance

| ID | Criterion |
|----|-----------|
| A11Y-01 | WCAG 2.2 AA target binding |
| A11Y-02 | Contrast, keyboard, focus, SR, reduced motion, color-blind safe |
| A11Y-03 | Modals/forms accessible patterns |
| A11Y-04 | Color not sole channel for status |
