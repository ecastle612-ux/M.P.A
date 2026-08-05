# UX-015 Craftsmanship Standard

**Status:** Approved  
**Parent:** [UX-015 Index](./index.md)

## Intent

Every foundation screen should feel **calm, precise, and premium**. Users should
trust the product before any business workflow exists.

Premium here means craftsmanship within Canopy — not a new visual identity.

## Quality Bar (Comparable Principles)

Extract principles only; never copy layouts:

| Source | Extract for M.P.A. |
|--------|--------------------|
| Linear | Quiet chrome, density with breath, keyboard-aware |
| Stripe | Financial trust, calm tables, decisive hierarchy |
| Ramp | Operational clarity, restrained accent |
| Notion | Soft structure, content-first hierarchy |
| Arc | Distinctive personality without chaos |
| Apple | Restraint, typography as identity, purposeful motion |

## Visual Rules (Phase 1)

1. **One composition per view** — clear primary job; no dashboard clutter on auth/portal shells.
2. **Hierarchy via type and spacing** — not via card sprawl or decorative chrome.
3. **Borders before shadows** — prefer Canopy elevation rules; elevate only floating layers.
4. **One accent** — Canopy green for primary actions and focus; never invent per-screen colors.
5. **Consistent rhythm** — spacing, padding, radius, icon sizes follow token scale only.
6. **Calm empty states** — one headline, one sentence, one next action when applicable.
7. **Motion is state language** — fade/slide/elevation only where Canopy motion catalog allows.

## Improve (Without Changing Tokens Unless Approved)

| Dimension | Direction |
|-----------|-----------|
| Spacing | Align page/section/component gaps to `space.*` |
| Hierarchy | Stronger title/body/meta separation; one H1 per view |
| Elevation | Apply `elevation.*` consistently to modals, menus, toasts |
| Radius | Buttons/panels `md`; inputs `sm`; no pill CTAs |
| Shadows | Only tokenized elevations; no ad-hoc multi-layer glow |
| Animations | Use existing motion durations/easing; honor reduced motion |
| Responsiveness | Mobile-first touch targets (≥44px where interactive on touch) |
| Readability | Secondary/muted text roles consistent; no low-contrast chrome |
| Consistency | Same control DNA across auth, shell, portal, settings |

## Explicit Non-Goals

- Replacing Satoshi / IBM Plex
- Replacing Canopy green with blue or other brand accents
- Card-wrapping every section
- Decorative gradients as the main visual idea of product chrome
- Glow effects, neon accents, emoji ornamentation
- Changing copy meaning or workflow sequence
