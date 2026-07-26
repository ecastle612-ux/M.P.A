# Phase 8 Optimization Log (EP-019 discipline)

**Package:** PMX-004 Phase 8  
**Baseline artifact:** [baseline-login.metrics.json](./baseline-login.metrics.json) · [baseline-login.report.html](./baseline-login.report.html)  
**Baseline URL:** `https://www.my-property-assistant.com/login` (Production · mobile simulate · LH 12.6.0)  
**Baseline time:** 2026-07-26T17:15:14.825Z  

| Metric | Baseline |
|--------|----------|
| Performance | **47** |
| Accessibility | **96** |
| Best Practices | **100** |
| LCP | 4.8 s |
| FCP | 1.1 s |
| CLS | 0 |
| TBT | 9,330 ms |
| Speed Index | 6.2 s |

---

## Changes

| ID | Change | Reason (evidence) | Before | After (lab/prod) | Delta |
|----|--------|-------------------|--------|------------------|-------|
| OPT-01 | Remove Fontshare Satoshi `@import` from `globals.css`; align display font to `next/font` IBM Plex | Baseline third-party font CSS + unused Satoshi name; TBT/LCP risk | Prod Perf 47 · TBT 9.3s | Pending Production remeasure after deploy | — |
| OPT-02 | Root layout: stop mounting `AppProviders` (Theme/Toast/AuthSessionSync); keep SW + BrandSurfaceTone; providers only via `ShellProviders` on `(app)`/`(portals)` | Nested client providers on `/login` contradict M0 Option B; hydration cost | Same baseline | Pending Production remeasure | — |
| OPT-03 | `MediaImage` → `next/image` (+ `remotePatterns` for Supabase host); `unoptimized` for signed URLs | P8-03 image pipeline; avoid caching expired signed URLs | Raw Avatar `<img>` | Code shipped | — |
| OPT-04 | `dynamic()` FloatingAiCopilot (`ssr: false`) in application + portal shells | Heavy AI panel eagerly in first shell graph | Eager import | Code shipped | — |
| OPT-05 | `dynamic()` ImageEditorModal from `media-upload` | `react-easy-crop` weight on media surfaces | Static import | Code shipped | — |
| OPT-06 | `dynamic()` NotificationCenter in top navigation | Drawer not needed for first paint | Static import | Code shipped | — |
| OPT-07 | Gate AI transcript `scrollTo` with `prefers-reduced-motion` | P8-06 motion hygiene | Always smooth | Code shipped | — |
| OPT-08 | Canopy token display family aligned to IBM Plex (no Satoshi string) | Font verify consistency | Token mismatch | Code shipped | — |

---

## Product waiver candidates (if A11 Perf ≥ 95 not met on Production after deploy)

Recorded for Validation — **not** auto-accepted here:

1. **PERF-WAIVER-P8-01** — Mobile-throttled Lighthouse Performance ≥ 95 may remain constrained by Next.js app-router + auth SDK + OneSignal shell (M0 historical Perf ~59–67 on `/login`). Prefer evidence of material TBT/LCP improvement + Product Accept rather than feature removal.  
2. **PWA category scoring** — LH 12.6 run used here did not emit a numeric `pwa` category score with the selected flags; installability remains certified under Phase 2 Validated PASS. Validation may accept Phase 2 PWA evidence + install audits in lieu of LH PWA ≥ 100 numeric, or re-run with expanded categories.

Accessibility **96** and Best Practices **100** at baseline — preserve (no a11y regression allowed without waiver).
