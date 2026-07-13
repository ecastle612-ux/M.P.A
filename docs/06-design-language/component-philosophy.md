# Component Philosophy — Canopy

**Status:** Draft for approval  
**Rule:** Every reusable component must feel like one family. Shared tokens, shared rhythm, shared interaction grammar.

This document defines **visual and interaction philosophy**. Engineering API rules live in **12 Component Standards**.

---

## Family Rules

1. **One accent** — primary actions use Canopy green; never invent per-feature colors.
2. **Borders before boxes** — structure with dividers and wells; elevate only floating layers.
3. **Typography does the hierarchy** — do not compensate weak type with chrome.
4. **One primary action per view** — secondary and ghost support; never two competing solids.
5. **Density with breath** — ops UIs are dense; padding still follows the spacing scale.
6. **State is language** — loading, empty, error, success share patterns across portals.
7. **Keyboard parity** — anything clickable is reachable; focus rings are mandatory.

---

## Buttons

| Variant | Look | When |
|---------|------|------|
| Primary | Solid Canopy green, inverse text, `radius.md` | The one forward action |
| Secondary | Surface + `border.default`, text primary | Alternate safe action |
| Ghost | Transparent, text secondary → primary on hover | Tertiary |
| Danger | Solid or outline danger | Destructive confirmations |
| Subtle | `brand.primary-subtle` fill | Soft emphasis, filters |

**Specs**

- Height: 32px (sm), 36px (md default), 40px (lg rare)
- Padding: `space.3`–`space.4` horizontal
- Icon + label preferred over icon-only (except toolbars with aria-labels)
- No pill shapes (`radius.full`)
- Loading: replace label with centered spinner; keep width stable

---

## Forms & Inputs

| Element | Philosophy |
|---------|------------|
| Label | Outside field, left-aligned on desktop; caption size, medium weight |
| Input | `radius.sm`, `border.default`, sunken or white fill; height 36px |
| Focus | Canopy border + focus ring token |
| Error | Danger border + caption message below (PM language) |
| Help | Muted caption; never placeholder-as-label |
| Groups | `FormSection` with heading + short description + divider |

**Dropdowns / Selects**

- Same height and radius as inputs
- Menu uses `elevation.md`, `radius.md`, 4px item gap
- Active option: `interactive.selected` background
- Searchable select for long lists (vendors, properties)

**Checkboxes / Radios / Switches**

- Canopy green when selected
- 16px hit target minimum; 44px preferred on mobile

---

## Tables

Tables are a primary PM surface — treat them as instruments, not spreadsheets.

| Rule | Detail |
|------|--------|
| Header | Sticky, muted surface, caption/medium labels |
| Rows | `space.3` vertical padding; hover `row-hover` |
| Selection | Checkbox column; bulk action bar appears sticky |
| Numbers | Plex Mono, right-aligned, tabular nums |
| Actions | Inline ghost buttons or overflow menu — not icon soup |
| Navigation | Row click opens detail pane (desktop console pattern) |
| Empty | Actionable empty state inside table frame |
| Loading | Skeleton rows matching column structure |

Virtualize at portfolio scale. Never paint 2,000 DOM rows.

---

## Search

| Surface | Behavior |
|---------|----------|
| Top bar search | Scoped filter / jump; not a dumping ground |
| List filters | Inline chip filters above tables |
| Command Palette | Global find + actions (see below) |

Search fields use the same input DNA with a leading icon and `⌘K` affordance where global.

---

## Command Palette

Signature power-user surface (Raycast/Linear principle, M.P.A. execution).

| Spec | Detail |
|------|--------|
| Open | `⌘K` / `Ctrl+K` |
| Chrome | `radius.xl`, `elevation.lg`, mist/white surface |
| Sections | Actions · Properties · People · Work orders · Documents |
| Query | Instant filter; AI natural language later (same shell) |
| Footer | Keyboard hints |
| Motion | Fade + 4px rise, 200ms |

Never ship a second “global search modal” that looks different.

---

## Notifications

| Type | Presentation |
|------|--------------|
| Toast | Top-right, auto-dismiss success/info; sticky for errors until dismissed |
| Bell drawer | Chronological, grouped by day; deep-link to entity |
| Inline | Banner inside detail pane for entity-critical alerts |

Toasts: border + subtle shadow, status icon + title + optional action. No full-width alarm bars for routine success.

---

## Status Indicators

| Pattern | Use |
|---------|-----|
| StatusChip | Label + optional dot; subtle background tint |
| Priority mark | Narrow left edge on queue items (danger/warning/info) |
| Workflow stage | Chip aligned to Workflow Rail stages |

**Never** color-only. Always text label.

---

## Charts

Charts are secondary — Reports area, not Operations home.

| Rule | Detail |
|------|--------|
| Palette | Canopy green + slate series; status colors only for thresholds |
| Chrome | Minimal grid; no 3D; no rainbow |
| Tooltip | Surface elevated, caption text |
| Empty | Explain what data is missing |

Forbidden on Ops Console home: pie charts as decoration, gauge widgets, sparkline spam.

---

## Loading States

| Prefer | Avoid |
|--------|-------|
| Skeleton matching layout | Spinner on blank white page |
| Panel-level skeletons | App-wide blocking overlays for local fetches |
| Button-local spinner | Disabling the entire console |

Skeleton shimmer uses motion tokens; respects reduced motion (static blocks).

---

## Empty States

Structure:

1. Short Satoshi/Plex heading (what’s missing)
2. One sentence in PM language (why it matters)
3. One primary CTA that advances the workflow
4. Optional secondary link (docs / import)

Example: “Add your first property to start the management lifecycle.”

No stock illustrations required.

---

## Error States

| Level | Treatment |
|-------|-----------|
| Field | Inline caption |
| Panel | Inline alert with next action |
| Page | Calm full-panel message + recovery CTA |
| Fatal | Support path + correlation id in mono |

Copy rule: operational language, not HTTP codes as the headline.

---

## Success States

- Prefer quiet toast or inline confirmation
- Do not interrupt with modal celebrations
- High-stakes success (lease signed, payout sent) may use a concise confirmation panel with next step

---

## Dialogs, Drawers, Modals

| Pattern | When |
|---------|------|
| **Drawer** (right) | Create/edit detail, assign vendor, most PM tasks — **default** |
| **Modal** | Confirmations, short focused choices, destructive warns |
| **Dialog** (small modal) | Yes/no, single field |

**Drawer specs:** width 420–560px; header sticky; footer sticky with actions; body scrolls.

**Modal specs:** max-width 400–560px; scrim; focus trap; ESC closes safe dialogs.

Avoid stacked modals. Prefer drawer replacing content.

---

## Navigation

### Desktop PM

- Ink sidebar, grouped: Operations · Portfolio · Marketplace · Organization
- Active item: bright text + canopy indicator bar
- Collapse to icons at `md`

### Top bar

- Org switcher, global search, notifications, avatar, ⌘K hint
- No secondary competing brand logos in chrome

### Mobile / Tenant / Vendor

- Bottom tab bar (max 5 items)
- Top context title
- Drawers for secondary tasks

---

## Desktop / Tablet / Mobile Patterns

| Breakpoint | Pattern |
|------------|---------|
| Desktop `lg+` | Sidebar + console split or full tables |
| Tablet `md` | Collapsed sidebar; stack queue above detail OR navigate to detail route |
| Mobile `sm` | Single column; bottom nav; full-screen detail |

Touch targets ≥ 44px on mobile portals. PM desktop may use tighter 32–36px controls.

---

## AI Components

| Component | Philosophy |
|-----------|------------|
| AIInsightChip | Small, subtle green tint, “Suggested” label |
| AIInsightPanel | Sources listed; Accept / Edit / Dismiss |
| AI draft block | `brand.primary-subtle` background; never looks “final” |

No robot mascots. No purple glow. No chat dock as the home of AI.

---

## Motion Behavior

See [Design Token System — Motion](./design-token-system.md#7-motion-tokens).

Components must use shared duration/easing tokens. Feature teams do not invent bounce springs.

---

## Accessibility

| Requirement | Standard |
|-------------|----------|
| Contrast | WCAG 2.1 AA minimum on all text tokens |
| Focus | Visible ring on all interactive elements |
| Keyboard | Full PM paths operable without mouse |
| Screen readers | Labels on icon-only controls; live regions for toasts |
| Status | Text + icon, not color alone |
| Motion | Honor `prefers-reduced-motion` |

---

## Component Inventory (Foundation Build Order)

Build only after Phase 1.5 approval:

1. Tokens → Button → Input → Select → Checkbox → Badge/StatusChip  
2. Skeleton → EmptyState → Alert  
3. Dropdown menu → Drawer → Modal → Toast  
4. Table primitive → Tabs → Tooltip  
5. Signature: WorkflowRail → ContextHeader → CommandPalette → OperationsConsole shell  

No business feature components before this family exists.

---

## Related Documents

- [Design Token System](./design-token-system.md)
- [Operations Console](./operations-console.md)
- **12** Component Standards
- **07** UX Principles
