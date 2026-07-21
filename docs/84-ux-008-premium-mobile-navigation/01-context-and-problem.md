# UX-008 — Context and Problem

## Current state (as observed)

The mobile shell uses `ResponsiveNavigation` with a `Drawer` that:

1. Renders `<Logo size="navigation" />` (96px square token) as the only brand mark.
2. Lists all permission-filtered items from `SHELL_NAVIGATION_GROUPS` as a long flat accordion-less tree.
3. Marks active routes with an inset brand-primary stripe plus muted fill.
4. Places organization/role switchers after the full menu.
5. Provides no sticky create shortcuts inside the drawer.

Desktop sidebar branding and mobile drawer branding share the same square mark tokens, but the mobile drawer width and header composition make the mark feel favicon-sized: the wordmark inside the PNG is not reliably readable.

## Problems to solve

| # | Problem | User impact |
| --- | --- | --- |
| 1 | Logo unreadable in drawer | Brand trust fails in first second |
| 2 | Excess header whitespace | Primary nav starts too far down |
| 3 | Flat long menu | Design partners must scroll for basics |
| 4 | Low effective density | Slow access without feeling premium |
| 5 | Unfinished active state | Product feels incomplete |
| 6 | No always-visible essentials | Ops destinations buried |
| 7 | No sticky create actions | Common creates require hunting |
| 8 | Risk of heavy re-render/animation | Drawer feels laggy |
| 9 | Touch/a11y gaps possible | Not Design Partner ready |
| 10 | Device variance | Must work on phone/tablet/desktop shell |

## Constraints (hard)

- Existing routes stay authoritative (`/dashboard`, `/properties`, `/maintenance`, etc.).
- Existing `requiredCapability` / session permission filtering stays authoritative.
- UX-007 remains the only logo asset policy (`logo-light.png`, `logo-dark.png` via centralized `Logo`).
- Canopy tokens remain the visual system.
- No schema, API, or business rule changes.

## Why this is a redesign, not a bug fix

Fixing logo size alone does not make the IA acceptable. Design Partner readiness requires a structured navigation system: brand lockup, pinned essentials, collapsible sections, sticky creates, and premium active treatment as one composition.
