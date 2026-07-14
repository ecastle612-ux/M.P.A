# 30.02 — Layout System

## Status

**Proposed (awaiting implementation approval)**

## Objective

Define a single responsive shell model for desktop, tablet, and mobile that
improves hierarchy, scanability, and navigation speed without changing routes
or business flows.

## Breakpoint Strategy

- `sm` (>= 640): compact desktop/mobile-wide treatment
- `md` (>= 768): tablet baseline
- `lg` (>= 1024): desktop shell activation
- `xl` (>= 1280): dense operational dashboard expansion
- `2xl` (>= 1536): max operational width, not edge-to-edge sprawl

## Global Shell Blueprint

### Desktop (lg+)

- Persistent left sidebar
- Sticky top navigation
- Content region with max readable width and controlled padding
- Utility actions (profile/notifications/command palette) in top navigation

### Tablet (md to lg)

- Collapsible sidebar behavior
- Sticky top navigation remains
- Contextual page actions shift into top-row action bar
- Tables default to horizontal overflow with sticky headers where possible

### Mobile (< md)

- No persistent sidebar
- Top bar + trigger-based navigation drawer/sheet
- Primary page action remains visible above content fold
- Dense controls collapse into one action group (not hidden)

## Content Width Strategy

- Standard page container: `max-w-7xl`
- Form-centric pages: `max-w-4xl`
- Dense data pages (tables): full width within container, controlled gutters
- Avoid large blank bands on ultra-wide monitors

## Sidebar Behavior

- Fixed width tokenized (`--sidebar-width-desktop: 16rem`)
- Group labels concise and consistent
- Active state with strong contrast and subtle background
- Scrollable nav region independent from main content
- No oversized logo block in sidebar header

## Top Navigation Behavior

- Height tokenized (`--topnav-height: 4rem`)
- Left: page context/breadcrumb
- Center: global search (where available)
- Right: organization switcher, role, command palette, notifications, profile
- Sticky with subtle backdrop/border for depth separation

## Page Grid Rhythm

- Base spacing scale: 4, 8, 12, 16, 24, 32, 40, 48
- Section spacing rules:
  - Heading to body: 8-12
  - Section to section: 24-32
  - Card internal spacing: 16-20
- Avoid mixed `p-3`, `p-5`, `p-6` without semantic rationale

## Responsive Behavior Matrix

- Sidebar: fixed (desktop), overlay (tablet), drawer (mobile)
- Dashboard KPI row: 5 cols (xl+), 2 cols (sm/md), 1 col (mobile narrow)
- Table actions: inline cluster (desktop), compact menu pattern (mobile/tablet)
- Form grids: 2-column fields at `md+`, 1-column stack on mobile

## Implementation Constraints

- No route changes
- No data contract changes
- No business action changes
- No permission model changes

