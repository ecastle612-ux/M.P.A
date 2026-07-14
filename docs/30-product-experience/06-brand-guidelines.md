# 30.06 — Brand Guidelines (Presentation)

## Status

**Proposed (awaiting implementation approval)**

## Objective

Improve brand presentation quality while preserving all existing branding assets
and logo artwork.

## Primary Logo Treatment

- Use a single standard logo treatment across authenticated product surfaces.
- Define product shell logo heights by context:
  - Top nav: compact (e.g., 28-36px visual height)
  - Sidebar header: medium (e.g., 32-40px visual height)
  - Auth screens: medium emphasis, not hero-scale
- Always preserve intrinsic aspect ratio (`w-auto`, `h-auto` behavior).

## Logo Usage Rules

### Required

- Keep `object-contain` and intrinsic ratio behavior.
- Ensure contrast is sufficient in light and dark contexts.
- Use consistent alt text convention.

### Forbidden

- Stretching or squashing the logo
- Multiple logos on same screen region without semantic need
- Oversized hero logo blocks in dashboard/data screens
- Decorative logo repetition in empty states

## Favicon and App Icon Treatment

- Keep current approved icon assets.
- Ensure manifest/favicon references are consistent and non-duplicative.
- Maintain crisp rendering at common device pixel ratios.

## Context Rules

- **Dashboard and data pages:** no hero-brand block at top of content area.
- **Auth entry surfaces:** one brand anchor near form shell.
- **Sidebar and top nav:** avoid simultaneous oversized logo emphasis.

## Responsive Rules

- Logo scales down gracefully on small screens.
- Never allow logo clipping in sticky headers.
- Maintain minimum tap-safe spacing around logo in nav areas.

## Audit Findings (Current)

- Repeated large logo usage appears in dashboard and empty states.
- Sidebar/top-nav/mobile logo hierarchy needs a single canonical sizing scale.

## Remediation Direction

- Establish one canonical logo size map by context.
- Remove oversized dashboard hero treatment.
- Use text hierarchy, not logo size, as primary page emphasis.

