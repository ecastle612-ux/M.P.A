# 02 — Design System

**Package:** UX-012  
**Status:** Draft — Awaiting Approval  
**Token SoT:** [Canopy Design Token System](../06-design-language/design-token-system.md)

---

## Binding rule

```
No hardcoded colors, fonts, radii, elevations, or motion in feature UI.
Use Canopy tokens (--mpa-*) / packages/ui theme only.
```

UX-012 defines **how** foundations are applied. Canopy defines **token values**.

---

## Foundations (one standard)

### Typography

| Role | Canopy direction |
|------|------------------|
| Display / titles | Satoshi |
| Body / UI | IBM Plex Sans |
| Data / money / IDs | IBM Plex Mono + tabular nums |

Scale: display → title → heading → subheading → body → caption → micro (see Canopy).  
One H1 per view. Hierarchy scannable in under 3 seconds.

### Spacing

Use Canopy spacing scale exclusively (4px base rhythm).  
Stack spacing: tight for related, loose for section breaks.  
Never arbitrary `13px` gaps.

### Grid

| Context | Columns | Gutter |
|---------|---------|--------|
| Desktop console | 12-col | token gutter |
| Tablet | 8-col | token |
| Mobile | 4-col | token |

Content max-width for reading panes; full-bleed for media/hero rare in product (ops density preferred).

### Radius

Canopy radius tokens only.  
Controls: consistent control radius.  
Panels: larger.  
Pills: avoid “rounded-full everything” (Canopy anti-bias).

### Elevation

Canopy elevation ladder: flat → raised → overlay → modal.  
Prefer borders/subtle lift over multi-layer shadows.  
Modals/drawers use overlay elevation; lists stay flat.

### Color system

Canopy semantic colors: surface, text, border, brand accent, success/warn/danger/info.  
Status colors never sole channel (pair with icon/text).  
Light default; dark mode via Canopy semantic pairs ([11](./11-branding-standards.md)).

### Icons

One icon family (platform standard — Lucide or Canopy-approved set).  
Sizes: 16 / 20 / 24.  
Always with text label in nav/primary actions (icon-only only when affordance is universal + aria-label).

### Illustrations

Calm, professional, sparse.  
Empty states: simple line/spot illustrations — not noisy 3D.  
No emoji as primary UI language.

### Charts

One chart style: clear axes, restrained color, accessible patterns.  
Charts secondary to action queues ([01](./01-design-principles.md)).  
Tabular alternative for SR users.

### Tables

Dense but breathable. Sticky header on desktop.  
Row actions on hover/focus; always keyboard reachable.  
Mono for money columns.

### Cards

**Default: no cards** for static content.  
Cards only when they contain a distinct interactive unit (task, WO, payment).  
If border/shadow/radius removable without harm → not a card.

### Forms

Label above control; helper below; error inline.  
Enterprise density; 44px min touch on mobile.  
Single primary CTA per form step.

### Buttons

| Variant | Use |
|---------|-----|
| Primary | One per region |
| Secondary | Alternative |
| Tertiary / ghost | Low emphasis |
| Destructive | Irreversible — confirm |

Loading: button shows progress; prevent double-submit.

### Badges / tags

Status badges use semantic colors + text.  
Tags for filters/metadata; not for primary CTAs.

### Avatars

Initials or cropped image (upload→crop pattern).  
Sizes: xs/sm/md/lg.  
Never broken-image icons as silent fail.

### Navigation

See [05](./05-navigation-architecture.md). Canopy + UX-008 mobile patterns.

### Empty / loading / skeletons

See [15](./15-empty-states.md). Skeletons match layout; prefer over generic spinners for content regions.

### Dialogs / drawers / bottom sheets

| Pattern | Use |
|---------|-----|
| Dialog | Short confirms, focused forms |
| Drawer | Detail without leaving list (desktop) |
| Bottom sheet | Mobile secondary actions / filters |

One modal layer at a time; focus trap; ESC closes where safe.

### Snackbars / toasts

Transient confirmation; not for critical errors (use inline/banner).  
Actionable toasts max one action.  
Queue; don’t stack endlessly.

---

## Acceptance

| ID | Criterion |
|----|-----------|
| DS-01 | Foundations map to Canopy tokens |
| DS-02 | Listed UI categories have one standard |
| DS-03 | Cards/default rules explicit |
| DS-04 | No hardcoded visual values in future implement |
