# PX-004 — Official M.P.A. Brand System (Traced Vectors)

All brand SVG assets are **traced directly from the official artwork** — no hand-drawn geometry.

## Source of truth

`public/branding/mpa-logo-official.png`

## Regenerate assets

```bash
python3 scripts/trace-official-brand.py
```

Produces:

| File | Use |
|------|-----|
| `mpa-icon.svg` | Icon mark, favicon |
| `mpa-logo-horizontal.svg` | Login, mobile drawer |
| `mpa-logo-horizontal-dark.svg` | Sidebar (expanded) |
| `mpa-logo-stacked.svg` | Loading, offline |
| PWA PNGs in `public/icons/` | Manifest, apple-touch-icon |

Trace metadata: `public/branding/brand-trace-meta.json`

## React usage

All surfaces use `<Logo />` from `components/branding/logo.tsx`:

```tsx
<Logo variant="icon" size="md" />
<Logo variant="horizontal" tone="dark" size="sm" />
<Logo variant="stacked" size="lg" />
```

Do **not** import PNG/SVG files directly in pages.

## Surface mapping

| Surface | Logo |
|---------|------|
| Sidebar expanded | `horizontal` `tone="dark"` |
| Sidebar collapsed | `icon` |
| Login | `horizontal` `size="xl"` |
| Loading | `stacked` |
| Mobile header | `icon` |
| Mobile drawer | `horizontal` |
