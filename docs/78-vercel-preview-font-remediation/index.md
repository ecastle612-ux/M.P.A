# VERCEL PREVIEW FONT REMEDIATION CERTIFICATION

**Status:** READY  
**Date:** 2026-08-13  
**Branch:** `cursor/vercel-preview-font-remediation-01f2`  
**Head SHA:** `6097e0b4bc061afa2693908683db6cae017fccf7` (`6097e0b`)  
**PR:** [#177](https://github.com/ecastle612-ux/M.P.A/pull/177)  
**Production deployment:** **NOT PERFORMED**  

---

## Root cause

Vercel Preview builds for Complete Plan remediation (PR #175) failed during `next build` with:

```text
[next]/internal/font/google/ibm_plex_sans_*.module.css … module-not-found
```

**Cause:** `apps/web/src/app/layout.tsx` loaded IBM Plex Sans / Mono via `next/font/google`, which **fetches font CSS/files from Google at build time**. When that fetch fails in the Preview environment, the generated CSS modules are missing and the build exits non-zero.

**Build/runtime dependency:** Yes — production build hard-depended on external Google Fonts availability. Satoshi was already self-hosted; Plex was not.

---

## Fix

Self-host approved Canopy IBM Plex assets and load with `next/font/local` (framework-supported local font loading).

| Item | Detail |
|------|--------|
| Sans weights | 400 / 500 / 600 (`IBMPlexSans-*.woff2`) |
| Mono weights | 400 / 500 (`IBMPlexMono-*.woff2`) |
| Source packages | `@ibm/plex-sans@1.1.0`, `@ibm/plex-mono@1.1.0` complete woff2 |
| License | SIL OFL 1.1 — `apps/web/src/fonts/ibm-plex/OFL.txt` |
| CSS variables | Unchanged: `--font-plex-sans`, `--font-plex-mono` |
| Design tokens | Unchanged: `--mpa-font-display/sans/mono` still Satoshi + Plex stacks |
| CSP | `font-src 'self' data:` (removed `https:` Google CDN allowance) |

No feature, Stripe, billing, database, or entitlement changes.

---

## Files changed

| Path | Change |
|------|--------|
| `apps/web/src/app/layout.tsx` | `next/font/google` → `next/font/local` |
| `apps/web/src/fonts/ibm-plex/*` | Self-hosted woff2 + OFL + README |
| `apps/web/next.config.ts` | Tighten `font-src` |
| `apps/web/src/app/globals.css` | Comment clarifying local Plex load |
| `apps/web/src/app/layout.font.test.ts` | Regression: no `next/font/google`; CSP self-only |

---

## Validation results

| Check | Result |
|-------|--------|
| Font regression tests | **2 passed** |
| `tsc --noEmit` | **PASS** |
| ESLint | **PASS** |
| Local `next build` | **PASS** — bundled local `IBMPlex*.woff2` under `.next/static/media`; **no** `googleapis` / `gstatic` refs |
| GitHub Actions `verify` | **PASS** — run `31744016836` |
| Vercel Preview | **PASS** — `https://vercel.com/ecastle612-uxs-projects/m-p-a-web/Csnbwwryow7EucVCH4YyUvC2Yd2A` |

Confirmations:

- **No external font dependency** for IBM Plex at build or runtime (self + Satoshi public fonts only).  
- **Preview succeeds.**

---

## Deployment impact

| Item | Status |
|------|--------|
| Production deploy | **NOT PERFORMED** |
| Stripe / billing | **UNCHANGED** |
| Database | **UNCHANGED** |
| Visual / UX-012 / Canopy tokens | **Preserved** (same families, weights, CSS variables) |
| Follow-on | Merge PR #177 (and rebase/merge Complete Plan RC) so Preview no longer blocks production certification |

---

## Final verdict

**READY**

Stop here — no production deployment from this record.
