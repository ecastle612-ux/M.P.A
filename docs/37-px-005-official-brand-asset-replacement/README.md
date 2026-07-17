# PX-005 — Official Brand Asset Replacement

Single official logo: `public/branding/mpa-logo.svg` (production SVG provided by brand team).

## Rule

No redesign, trace, or regeneration. The React `<Logo />` wrapper renders this file only.

## Sizing (CSS via `Logo` presets)

| Preset | Width | Surfaces |
|--------|-------|----------|
| `sidebarCollapsed` | 40px | Collapsed sidebar, org selector |
| `sidebarExpanded` | 180px | Expanded sidebar, portal header, mobile drawer |
| `login` | 260px | Auth pages |
| `loading` | 80px | Global loading |
| `mobile` | 32px | Mobile app header |

## Removed (PX-005)

- `mpa-icon.svg`, `mpa-icon-dark.svg`, `favicon.svg`
- `mpa-logo-horizontal.svg`, `mpa-logo-horizontal-dark.svg`, `mpa-logo-stacked.svg`
- `mpa-logo-official.png`, `brand-trace-meta.json`
- `scripts/trace-official-brand.py`
- Hand-drawn / traced / multi-variant `Logo` API

## Remaining branding files

- `apps/web/public/branding/mpa-logo.svg` — **only** logo asset
- `apps/web/src/components/branding/logo.tsx` — thin wrapper
- `apps/web/src/lib/branding.ts` — path + size constants
- `apps/web/public/icons/*.png` — PWA/favicon PNGs derived from official SVG
