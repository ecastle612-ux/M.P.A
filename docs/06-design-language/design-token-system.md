# Design Token System — Canopy

**Status:** Draft for approval  
**Binding rule:** No hardcoded colors, fonts, radii, or motion values in feature UI. Use tokens only.

Tokens ship in `packages/ui` as:

1. CSS custom properties (`--mpa-*`)
2. Tailwind theme extension
3. TypeScript `tokens` map for programmatic use

---

## 1. Typography

### Font Recommendations

| Role | Family | Fallback stack | License note |
|------|--------|----------------|--------------|
| **Display** | Satoshi | `Satoshi, "IBM Plex Sans", system-ui, sans-serif` | Fontshare (commercial OK with attribution) |
| **Heading** | Satoshi | same | Same family as display for cohesion |
| **Body** | IBM Plex Sans | `"IBM Plex Sans", "Segoe UI", system-ui, sans-serif` | SIL OFL — excellent for dense ops UI |
| **Monospace** | IBM Plex Mono | `"IBM Plex Mono", ui-monospace, monospace` | SIL OFL — money, IDs, timestamps |

**Maximum product UI families:** 2 (Satoshi + IBM Plex). Mono counts as the data face within the Plex family system.

### Why These Fonts

| Choice | Why |
|--------|-----|
| **Satoshi** | Geometric, modern, and distinctive without feeling gimmicky. Becomes a recognizable M.P.A. trait in page titles and nav. Avoids Inter / Roboto / system-ui anonymity. |
| **IBM Plex Sans** | Built for long reading and dense interfaces. Professional, trustworthy, and clearly different from Satoshi so hierarchy is felt, not only sized. |
| **IBM Plex Mono** | Matches Plex Sans metrics; financial figures and IDs align optically with body text. |

**Rejected defaults:** Inter, Roboto, Arial, system-ui as primary faces, Space Grotesk (overused startup), pure serif UI (wrong for ops density).

### Type Scale

Base: `16px` root. Product body defaults to `14px` / `15px` for density.

| Token | Size | Line height | Weight | Use |
|-------|------|-------------|--------|-----|
| `font.size.display` | 32px / 2rem | 1.2 | 600 | Rare page heroes, empty-state titles |
| `font.size.title` | 24px / 1.5rem | 1.25 | 600 | Page titles |
| `font.size.heading` | 18px / 1.125rem | 1.3 | 600 | Section headings |
| `font.size.subheading` | 16px / 1rem | 1.35 | 550 | Panel titles, drawer titles |
| `font.size.body` | 14px / 0.875rem | 1.5 | 400 | Primary reading |
| `font.size.body-lg` | 15px / 0.9375rem | 1.5 | 400 | Forms, longer prose |
| `font.size.caption` | 12px / 0.75rem | 1.4 | 500 | Labels, metadata |
| `font.size.micro` | 11px / 0.6875rem | 1.35 | 500 | Badges, dense table meta |
| `font.size.mono` | 13px / 0.8125rem | 1.4 | 400 | Currency, IDs, code-like data |

### Font Weight Tokens

| Token | Value | Use |
|-------|-------|-----|
| `font.weight.regular` | 400 | Body |
| `font.weight.medium` | 500 | Labels, nav |
| `font.weight.semibold` | 600 | Headings, primary buttons |
| `font.weight.bold` | 700 | Rare emphasis only |

### Letter Spacing

| Token | Value | Use |
|-------|-------|-----|
| `font.tracking.tight` | -0.02em | Display / title (Satoshi) |
| `font.tracking.normal` | 0 | Body |
| `font.tracking.wide` | 0.04em | Micro labels / overlines (uppercase sparingly) |

### Typography Rules

1. Page titles use Satoshi; body never uses Satoshi for paragraphs.
2. Financial amounts use Plex Mono + `tabular-nums`.
3. Do not use all-caps for paragraphs; micro labels only when necessary.
4. One H1 per view. Hierarchy must be scannable in under 3 seconds.

---

## 2. Color System

### Philosophy

Timeless, grounded, premium. Property operations deserve **ink + canopy** — charcoal structure and a deep forest-teal accent that signals growth, trust, and place — without trending neon or generic SaaS blue.

Cool mist neutrals keep the workspace calm. Warmth comes from typography and content (photos, addresses, people), not from cream/terracotta clichés.

### Brand & Accent (HEX)

| Token | HEX | Role |
|-------|-----|------|
| `color.brand.primary` | `#0F6B56` | Primary actions, active nav, key focus |
| `color.brand.primary-hover` | `#0C5A48` | Hover on primary |
| `color.brand.primary-active` | `#094839` | Pressed |
| `color.brand.primary-subtle` | `#E6F4EF` | AI tint, selected rows, soft highlights |
| `color.brand.secondary` | `#3A4150` | Secondary emphasis, strong icons |
| `color.brand.accent` | `#0F6B56` | Alias of primary — one accent only |

**Why this palette works:** Canopy green sits between teal and forest — distinctive next to blue SaaS competitors, calm enough for all-day use, and pairs cleanly with cool grays. Secondary slate supports hierarchy without introducing a second “brand color.”

### Surfaces & Background

| Token | HEX | Role |
|-------|-----|------|
| `color.bg.app` | `#F3F4F6` | App canvas behind shells |
| `color.bg.sidebar` | `#12151A` | Ink navigation shell |
| `color.bg.sidebar-elevated` | `#1A1E25` | Sidebar hover / nested |
| `color.bg.surface` | `#FFFFFF` | Primary workspace plane |
| `color.bg.surface-elevated` | `#FFFFFF` | Drawers, popovers (elevation via shadow/border) |
| `color.bg.surface-muted` | `#EEF0F3` | Recessed wells, table chrome, zebra option |
| `color.bg.surface-sunken` | `#E5E7EB` | Inputs inset, track backgrounds |
| `color.bg.overlay` | `#12151A99` | Modal scrim (~60% ink) |

### Borders

| Token | HEX | Role |
|-------|-----|------|
| `color.border.subtle` | `#E5E7EB` | Default dividers |
| `color.border.default` | `#D1D5DB` | Controls, panels |
| `color.border.strong` | `#9CA3AF` | High-emphasis outlines |
| `color.border.focus` | `#0F6B56` | Focus ring color |
| `color.border.sidebar` | `#2A2F38` | Sidebar separators |

### Text

| Token | HEX | Role |
|-------|-----|------|
| `color.text.primary` | `#12151A` | Headlines, primary content |
| `color.text.secondary` | `#4B5563` | Supporting copy |
| `color.text.muted` | `#6B7280` | Metadata, timestamps |
| `color.text.inverse` | `#F9FAFB` | Text on ink / primary buttons |
| `color.text.sidebar` | `#C4C9D1` | Sidebar default |
| `color.text.sidebar-active` | `#FFFFFF` | Active nav |
| `color.text.link` | `#0F6B56` | Inline links |
| `color.text.danger` | `#B42318` | Destructive labels |

### Status

| Token | HEX | Role |
|-------|-----|------|
| `color.status.success` | `#0E7A57` | Paid, completed, verified |
| `color.status.success-subtle` | `#E3F5EE` | Success background |
| `color.status.warning` | `#B45309` | Pending, approaching deadline |
| `color.status.warning-subtle` | `#FEF3C7` | Warning background |
| `color.status.danger` | `#C0392B` | Overdue, failed, blocked |
| `color.status.danger-subtle` | `#FCE8E6` | Danger background |
| `color.status.info` | `#1D6AA5` | In-progress, informational |
| `color.status.info-subtle` | `#E5F1FA` | Info background |

**Rule:** Status colors are functional only. Never decorate chrome with rainbow badges.

### Interactive States

| Token | HEX / value | Role |
|-------|-------------|------|
| `color.interactive.default` | `#0F6B56` | Clickable accent |
| `color.interactive.hover` | `#0C5A48` | Hover |
| `color.interactive.focus-ring` | `#0F6B5640` | 4px outer ring (25% opacity) |
| `color.interactive.disabled-bg` | `#E5E7EB` | Disabled control fill |
| `color.interactive.disabled-text` | `#9CA3AF` | Disabled text |
| `color.interactive.selected` | `#E6F4EF` | Selected list row |
| `color.interactive.row-hover` | `#F7F8FA` | Table / queue row hover |

### Sidebar Specific

| Token | HEX | Role |
|-------|-----|------|
| `color.sidebar.accent` | `#1FA87A` | Active indicator (slightly brighter on dark) |
| `color.sidebar.item-hover` | `#1A1E25` | Nav item hover |

### Dark Mode (Defined Now, Optional v1 Ship)

Light is default for PM desktop calm. Dark tokens exist to prevent retrofit debt:

| Token | HEX |
|-------|-----|
| `color.bg.app.dark` | `#0B0D10` |
| `color.bg.surface.dark` | `#14181E` |
| `color.bg.surface-muted.dark` | `#1B2028` |
| `color.text.primary.dark` | `#F3F4F6` |
| `color.text.secondary.dark` | `#9CA3AF` |
| `color.border.default.dark` | `#2A313C` |
| `color.brand.primary.dark` | `#1FA87A` |

---

## 3. Spacing System

### Scale (4px base)

| Token | px | Rem |
|-------|----|-----|
| `space.0` | 0 | 0 |
| `space.1` | 4 | 0.25 |
| `space.2` | 8 | 0.5 |
| `space.3` | 12 | 0.75 |
| `space.4` | 16 | 1 |
| `space.5` | 20 | 1.25 |
| `space.6` | 24 | 1.5 |
| `space.8` | 32 | 2 |
| `space.10` | 40 | 2.5 |
| `space.12` | 48 | 3 |
| `space.16` | 64 | 4 |
| `space.20` | 80 | 5 |
| `space.24` | 96 | 6 |

### How Every Screen Uses It

| Context | Rule |
|---------|------|
| Component internal padding | `space.2`–`space.4` |
| Form field gaps | `space.4` |
| Section gaps | `space.6`–`space.8` |
| Page padding (desktop) | `space.6`–`space.8` |
| Page padding (mobile) | `space.4` |
| Queue item padding | `space.3` vertical, `space.4` horizontal |
| Console split gutter | `1px` border, not large gap |

**Forbidden:** Arbitrary values (`13px`, `18px`, `22px`). If you need a new step, propose a token — do not invent one-offs.

---

## 4. Border Radius

| Token | px | Use |
|-------|----|-----|
| `radius.none` | 0 | Dense tables (optional), timeline spines |
| `radius.sm` | 4 | Inputs, chips, small controls |
| `radius.md` | 8 | Buttons, menu items, panels |
| `radius.lg` | 12 | Drawers headers, large panels |
| `radius.xl` | 16 | Command palette, rare hero surfaces |
| `radius.full` | 9999 | Avatars only — **not** buttons |

**Rule:** Prefer `sm`/`md`. Pill buttons (`radius.full` on CTAs) are forbidden — they read as generic startup UI.

---

## 5. Elevation & Borders

M.P.A. prefers **edges over shadows**.

| Token | Value | Use |
|-------|-------|-----|
| `elevation.none` | none | Default workspace |
| `elevation.border` | `0 0 0 1px` via border color | Panels, sections |
| `elevation.sm` | `0 1px 2px rgba(18,21,26,0.06)` | Popovers |
| `elevation.md` | `0 8px 24px rgba(18,21,26,0.12)` | Drawers, dropdowns |
| `elevation.lg` | `0 16px 48px rgba(18,21,26,0.18)` | Modals, command palette |
| `elevation.focus` | `0 0 0 3px` + `color.interactive.focus-ring` | Keyboard focus |

**Card rule:** Do not wrap every block in an elevated white card. Use section headings + dividers + muted wells. Cards are allowed only when they contain a discrete interactive unit (e.g., a bid offer).

---

## 6. Grid & Layout

| Token / rule | Value |
|--------------|-------|
| Desktop content max | 1440px (console may go full width) |
| Standard page columns | 12-column grid, 24px gutter |
| Sidebar width expanded | 240px |
| Sidebar width collapsed | 64px |
| Console queue pane | 360–420px (fixed) |
| Console detail pane | fluid remainder |
| Breakpoint `sm` | 640px |
| Breakpoint `md` | 768px |
| Breakpoint `lg` | 1024px |
| Breakpoint `xl` | 1280px |
| Breakpoint `2xl` | 1536px |

**Primary design target:** `xl` (1280+) for PM Operations Console.

---

## 7. Motion Tokens

Animations communicate state change — never decorate.

### Duration

| Token | ms | Use |
|-------|----|-----|
| `motion.duration.instant` | 0 | Reduced-motion fallback |
| `motion.duration.fast` | 120 | Hover color, press |
| `motion.duration.normal` | 200 | Dropdowns, tooltips |
| `motion.duration.moderate` | 280 | Drawers, panel expand |
| `motion.duration.slow` | 400 | Page section reveal (rare) |

### Easing

| Token | Value | Use |
|-------|-------|-----|
| `motion.ease.standard` | `cubic-bezier(0.2, 0.0, 0, 1)` | Most UI |
| `motion.ease.emphasized` | `cubic-bezier(0.2, 0.0, 0, 1)` | Drawers / modals enter |
| `motion.ease.exit` | `cubic-bezier(0.4, 0.0, 1, 1)` | Exit slightly faster feel |
| `motion.ease.linear` | `linear` | Progress bars only |

### Motion Catalog

| Interaction | Behavior |
|-------------|----------|
| Page transition | Cross-fade content `200ms`; no slide-the-whole-app |
| Hover | Color / border only (`120ms`); no scale bounce |
| Drawer | Slide from right `280ms` + scrim fade |
| Modal | Scale from 0.98→1 + fade `200ms` |
| Dropdown | Fade + 4px rise `200ms` |
| Notification toast | Slide from top-right `280ms`; auto-dismiss |
| Loading skeleton | Soft shimmer opacity pulse `1.2s` loop |
| Command palette | Fade + slight rise `200ms` |
| Queue selection | Instant background; detail pane cross-fade `200ms` |

### Reduced Motion

When `prefers-reduced-motion: reduce`:

- All durations → `0` or `instant`
- No shimmer; static skeleton blocks
- Drawers/modals appear without slide/scale
- Toasts appear without slide

---

## 8. Iconography Tokens

| Token | Value |
|-------|-------|
| `icon.size.sm` | 14px |
| `icon.size.md` | 16px |
| `icon.size.lg` | 20px |
| `icon.size.xl` | 24px |
| `icon.stroke` | 1.75px (consistent optical weight) |

**Library:** Lucide (stroke icons) — custom property-flavored icons only when Lucide lacks a concept. No mixed icon libraries in one view.

---

## 9. Z-Index Scale

| Token | Value | Layer |
|-------|-------|-------|
| `z.base` | 0 | Content |
| `z.sticky` | 10 | Sticky headers |
| `z.sidebar` | 30 | Nav shell |
| `z.dropdown` | 40 | Menus |
| `z.drawer` | 50 | Drawers |
| `z.modal` | 60 | Modals |
| `z.toast` | 70 | Notifications |
| `z.command` | 80 | Command palette |
| `z.tooltip` | 90 | Tooltips |

---

## 10. CSS Variable Naming Convention

```css
:root {
  --mpa-color-brand-primary: #0F6B56;
  --mpa-color-bg-app: #F3F4F6;
  --mpa-color-bg-sidebar: #12151A;
  --mpa-font-sans: "IBM Plex Sans", "Segoe UI", system-ui, sans-serif;
  --mpa-font-display: "Satoshi", "IBM Plex Sans", system-ui, sans-serif;
  --mpa-font-mono: "IBM Plex Mono", ui-monospace, monospace;
  --mpa-space-4: 1rem;
  --mpa-radius-md: 8px;
  --mpa-motion-duration-normal: 200ms;
}
```

Tailwind maps semantic classes: `bg-surface`, `text-primary`, `border-default`, `text-brand`, `font-display`.

---

## 11. Contrast & Accessibility Targets

| Pairing | Minimum |
|---------|---------|
| `text.primary` on `bg.surface` | AAA preferred, AA required |
| `text.inverse` on `brand.primary` | AA |
| `text.sidebar` on `bg.sidebar` | AA |
| Focus visible | Always — never remove outlines without replacement ring |

Status must never be color-only: include label or icon.

---

## Related Documents

- [Visual Identity Guide](./visual-identity-guide.md)
- [Component Philosophy](./component-philosophy.md)
- [Motion usage in components](./component-philosophy.md#motion-behavior)
- **12** Component Standards
