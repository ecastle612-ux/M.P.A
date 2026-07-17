# PX-003B — Brand Identity & Logo System

**Status:** Complete (presentation layer)

## Official assets

| Variant | File | Use |
|---------|------|-----|
| Brand Icon | `public/branding/mpa-logo-icon.png` | Sidebar (32px), mobile header, favicon/PWA |
| Horizontal | `public/branding/mpa-logo-horizontal.png` | Login, loading, offline |
| Stacked | `public/branding/mpa-logo-stacked.png` | Marketing / optional surfaces |

Source: `public/branding/mpa-logo.png` (trimmed; white margins removed)

Regenerate: `python3 scripts/generate-brand-assets.py`

## Logo component

```tsx
import { Logo } from "@/components/branding/logo";

<Logo variant="icon" width={32} />
<Logo variant="horizontal" width={220} />
<Logo variant="stacked" width={180} />
```

- Preserves native aspect ratio via intrinsic dimensions
- No cropping, clipping, or object-fit hacks
- Display size set with explicit width + computed height

## Surface mapping

| Surface | Variant | Size |
|---------|---------|------|
| Sidebar header | `icon` | 32px |
| Mobile header | `icon` | 32px |
| Login / auth | `horizontal` | 220px |
| Loading | `horizontal` | 220px |
| Favicon / PWA | Brand icon PNGs in `/icons/` | — |

Sidebar header height: **64px** (`h-16`), icon vertically centered.

## Files

- `apps/web/src/components/branding/logo.tsx`
- `apps/web/src/lib/branding.ts`
- `scripts/generate-brand-assets.py`
