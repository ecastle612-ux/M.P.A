# ADR-011: Canopy Design System as Permanent Visual Identity

## Status
Accepted

## Date
2026-07-13

## Context
M.P.A. requires a distinctive, timeless visual identity before UI components are built. Generic SaaS patterns (Inter, blue accents, card-grid dashboards) would undermine the product’s positioning as a premium AI Property Operations Platform. Architecture is approved; visual language must now become binding.

## Decision
Adopt **Canopy** as the official design system for all M.P.A. product surfaces:

- **Typography:** Satoshi (display/headings), IBM Plex Sans (body), IBM Plex Mono (data)
- **Color:** Canopy Green `#0F6B56` primary; Ink `#12151A` navigation; Mist `#F3F4F6` canvas; semantic status colors as documented
- **Layout philosophy:** Borders over card-soup; Operations Console (not dashboard) as PM home
- **Tokens:** All values defined in `docs/06-design-language/design-token-system.md`; implemented later in `packages/ui`
- **Roles:** Four portal experiences sharing Canopy DNA with distinct IA and density

No UI component implementation until Phase 1.5 documents are approved.

## Consequences
**Easier:** Consistent premium identity; faster UI review; recognizability without logo reliance.  
**More difficult:** Designers/engineers cannot casually pick fonts or hex values; shadcn/default kits must be fully retokened.

## Alternatives Considered
- **Inter + blue SaaS kit:** Rejected — fails recognizability and premium bar.
- **Warm cream + terracotta editorial look:** Rejected — overused AI-aesthetic cliché; wrong for ops density.
- **Purple/indigo Linear-like accent:** Rejected — competitor echo; not timeless for property.
- **Per-role color themes:** Rejected — fragments brand recognition.

## References
- `docs/06-design-language/`
