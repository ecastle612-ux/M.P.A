# BR-002 — Runtime Stability Patch

**Status:** Implemented  
**Type:** Runtime consistency only (not a BrandLogo redesign)

## Goal

For a given theme preference, every refresh renders the **exact same** BrandLogo asset — no flash, swap, or hydration mismatch.

## Root cause (fixed)

Theme/`BrandSurfaceTone` initialized as light on SSR, then overrode from `localStorage` / portal `useState("light")` after mount.

## Fix

| Layer | Change |
| --- | --- |
| Cookies | `mpa-theme-mode` + `mpa-theme-preference` written by `beforeInteractive` + `ThemeProvider` commits |
| `layout.tsx` | Reads cookies; sets `data-theme`, `BrandSurfaceTone`, and `AppProviders` initials from the same values |
| `ThemeProvider` | Initializes from SSR props only; removed remount `localStorage` re-apply |
| `PortalShell` | Uses shared `BrandLogo` under app `ThemeAwareBrandSurface` — no independent theme state |
| `sw.js` | `/branding/*` network-only; cache bump `mpa-foundation-v2` |

## Authoritative path

```
Cookie (SSR)
  → beforeInteractive (DOM + cookie sync)
  → ThemeProvider (initialMode/Preference)
  → ThemeAwareBrandSurface / BrandSurfaceTone
  → BrandLogo asset
```

## Certification

- Automated: `qa/e2e/tests/visual/brand-stability.visual.spec.ts` (light/dark, multi-reload src identity)
- Human: hard refresh login / dashboard / portal / loading on iPhone Safari, Android Chrome, Desktop Chrome/Safari

## PASS

Identical asset every refresh for a fixed preference; intentional theme changes still update the logo; BR-001/BR-002 visual rules unchanged.

---

## Follow-up: symbol crop (mobile header / loading)

**Problem:** ADR-019 PNGs include house **and** baked-in “M.P.A. / My Property Assistant” text. At header/loading sizes that embedded text appears as faint unreadble gray under the houses — fails BR-002A.

**Fix (presentation only, no new assets):** When `markRole` is `symbol` or `icon`, `BrandLogo` crops the mark to the house region (`MPA_BRAND_SYMBOL_CROP`). Typography “M.P.A.” is rendered in solid Canopy ink (`#12151A` / `#F3F4F6`) beside/below the mark. Loading remains house-only at ≥96px.

**Deploy note:** Production mobile will keep showing the old full PNG until this branch is deployed and clients hard-refresh (SW network-only for `/branding/*`).
