# 22 — Design Token Governance

**Package:** UX-012  
**Amendment:** A01  
**Status:** Binding (Approved with Amendments)  
**Value SoT:** [Canopy Design Token System](../06-design-language/design-token-system.md)

---

## Binding rule

```
Every UI component MUST consume design tokens.
No hardcoded styling values (colors, px fonts, radii, shadows, z-index, durations).
```

Canopy defines token **values**. UX-012 defines token **governance** (categories, consumption rules, change control).

---

## Token architecture

```
Primitive tokens (raw)
  → Semantic tokens (role in UI)
    → Component tokens (optional aliases)
      → CSS variables / Tailwind theme / TS map (packages/ui)
```

Feature code references **semantic** (or component) tokens — never raw HEX in JSX/CSS modules.

---

## Required token categories

| Category | Includes | Examples |
|----------|----------|----------|
| **Color** | Brand, surface, text, border, status, interactive, sidebar, dark pairs | `color.brand.primary`, `color.text.muted` |
| **Typography** | Family, size, weight, line-height, tracking | `font.size.body`, `font.weight.semibold` |
| **Spacing** | Scale steps | `space.1` … `space.12` (Canopy scale) |
| **Radius** | Control / panel / pill (restrained) | `radius.sm`, `radius.md`, `radius.lg` |
| **Elevation** | Shadow / border elevation ladder | `elevation.flat` → `elevation.modal` |
| **Motion** | Duration, easing | `motion.fast`, `motion.normal`, `motion.ease` |
| **Icon sizing** | Standard icon boxes | `icon.size.16`, `20`, `24` |
| **Breakpoints** | Layout breakpoints | `bp.mobile`, `tablet`, `desktop`, `wide` |
| **Z-index hierarchy** | Stacking order | see below |
| **Semantic tokens** | Purpose-named aliases | `color.text.danger`, `color.bg.surface` |

---

## Z-index hierarchy (binding order)

| Layer | Token (proposed) | Use |
|-------|------------------|-----|
| 0 | `z.base` | Normal content |
| 10 | `z.sticky` | Sticky headers/tables |
| 20 | `z.dropdown` | Menus, popovers |
| 30 | `z.drawer` | Side drawers |
| 40 | `z.modal` | Dialogs |
| 50 | `z.toast` | Toasts/snackbars |
| 60 | `z.overlay-system` | Full-screen system blockers |

Never invent `z-index: 9999` in features.

---

## Consumption rules

| Rule |
|------|
| New values require Canopy token PR + UX-012 note if category expands |
| Themes (light/dark) switch semantic pairs — not one-off overrides |
| Charts/status use semantic status tokens + non-color cues |
| Third-party widgets wrapped to map into tokens |

---

## Anti-patterns

| Forbidden |
|-----------|
| `#0F6B56` in component CSS |
| `font-size: 13px` arbitrary |
| `border-radius: 9999px` as default chrome |
| Inline `style={{ color: 'red' }}` for product UI |
| Per-feature color constants files |

---

## Acceptance (A01)

| ID | Criterion |
|----|-----------|
| TG-01 | All listed token categories governed |
| TG-02 | Components consume tokens only |
| TG-03 | Z-index hierarchy defined |
| TG-04 | Hardcoded values are defects |
