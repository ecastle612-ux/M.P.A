# 07 — Desktop UX

**Package:** UX-012  
**Status:** Draft — Awaiting Approval

---

## Goals

Desktop is the **operations console**: dense, keyboard-first, multi-panel capable — without becoming a noisy BI wall.

---

## Keyboard

| Pattern | Expectation |
|---------|-------------|
| Tab order | Logical reading order |
| Shortcuts | Documented; `/` or ⌘K search; `?` help later |
| Esc | Close overlays |
| Enter | Submit focused form |
| Arrows | Menus, tabs, listboxes |

Never keyboard-trap except modal focus cycle.

---

## Density & scanning

- Tables default for ops inventories  
- Sticky headers; column alignment for money  
- Hover reveals secondary actions; focus always reveals them  
- Multi-select + bulk actions when lists support  

---

## Multi-panel

| Layout | Use |
|--------|-----|
| List | Detail drawer |
| Split view | Messages / Command Center aside AI |
| Full page | Complex wizards (Setup, imports) |

Preserve context on back; don’t full-remap unless necessary.

---

## Pointer

- Hover states subtle (Canopy)  
- No hover-only critical info  
- Cursor affordances for draggable items  

---

## Windowing

- Support browser zoom to 200% (a11y)  
- Min useful width ~1024 for full rail; collapse gracefully  

---

## Acceptance

| ID | Criterion |
|----|-----------|
| DK-01 | Keyboard-first patterns defined |
| DK-02 | Ops density without clutter |
| DK-03 | Multi-panel patterns standardized |
| DK-04 | No hover-only critical info |
