# Visual Consistency Report — Product Readiness v2

**Date:** 2026-08-10  
**Standard:** Canopy (`docs/06-design-language/`) — approved  
**Code changes:** None

## Intended vs observed

| Canopy expectation | Observed |
|--------------------|----------|
| One component family (`@mpa/ui`) | Marketing/billing/MC often hand-roll buttons/links |
| Tokens only (no rogue hex / gray scale) | Widespread `#C0392B`, `#0C5A48`, `emerald-*`, `gray-*` |
| Status language unified | Three+ local badge mappers (PM / Ops / Resident) |
| Modal/Drawer for overlays | Primitives exported; **unused** in `apps/web` |
| Tables via primitive | `@mpa/ui` Table unused; raw `<table>` dominant |
| Button variants include Subtle + loading | Missing from `packages/ui` Button |
| Expressive fonts (Satoshi / Plex) | Present globally — **positive** |

## LIVE public visual notes

Screenshots: `/opt/cursor/artifacts/screenshots/product-readiness-v2/`

- Homepage/modules/pricing: clean teal brand, generous whitespace; **flat** cards (little elevation); text-heavy module lists; comparison table uses dots not rich checkmarks.
- Pricing: monthly/annual toggle works; no “Most popular” / savings badge emphasis; status badges (AVAILABLE / EARLY ACCESS) need stronger visual coding.
- Enterprise: constitution-correct (sales path, not SKU); thin trust/credibility chrome.
- Login: attractive gradient; helper copy feels mechanical; CTA hierarchy flat.
- Demo: clear entry; no product screenshots/previews beside CTAs.

## Consistency hotspots

| Issue | Severity | Evidence |
|-------|----------|----------|
| Parallel CTAs (marketing class strings vs Button) | P2 | `marketing-chrome.tsx`, `mission-control-page.tsx`, `billing-plan-page.tsx` |
| Status badges forked | P2 | `PmStatusBadge`, Ops `StatusBadge`, `ResidentStatusBadge` |
| Hex urgency borders | P3 | Mission Control / Command Center / resident shells |
| Radius: portal `rounded-2xl` vs ops `rounded-md` | P3 | `resident-workspace.tsx` vs shells |
| Avatar `rounded-full` vs Canopy anti-pill chrome | P3 | `packages/ui` Avatar |
| Impersonation banner off-token warm palette | P2 | `impersonation-banner.tsx` |

## Verdict

Visual system is **recognizable but not unified**. First impression of marketing is calm and on-brand; after login, FO Planned badges + mixed primitives make the product feel mid-build rather than peer-premium.
