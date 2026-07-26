# Phase 8 Optimization Log (EP-019 discipline)

**Package:** PMX-004 Phase 8  
**Baseline artifact:** [baseline-login.metrics.json](./baseline-login.metrics.json) · [baseline-login.report.html](./baseline-login.report.html)  
**After artifact:** [after-login.metrics.json](./after-login.metrics.json) · [after-login.report.html](./after-login.report.html)  
**Baseline URL:** `https://www.my-property-assistant.com/login` (Production · mobile simulate · LH 12.6.0)  
**Baseline time:** 2026-07-26T17:15:14.825Z  
**After time:** 2026-07-26T18:30:36.435Z  
**Production ship:** `f988ae5` · `dpl_FJyvRpYAeTYEvJL7P8admpkgupfZ`

| Metric | Baseline | After (Production) | Delta |
|--------|----------|--------------------|-------|
| Performance | **47** | **69** | **+22** |
| Accessibility | **96** | **96** | 0 |
| Best Practices | **100** | **100** | 0 |
| LCP | 4.8 s | 1.8 s | **−3.0 s** |
| FCP | 1.1 s | 1.0 s | −0.1 s |
| CLS | 0 | 0 | 0 |
| TBT | 9,330 ms | 7,070 ms | **−2,260 ms** |
| Speed Index | 6.2 s | 2.9 s | **−3.3 s** |

---

## Changes

| ID | Change | Reason (evidence) | Before | After (Production) | Delta |
|----|--------|-------------------|--------|--------------------|-------|
| OPT-01 | Remove Fontshare Satoshi `@import` from `globals.css`; align display font to `next/font` IBM Plex | Baseline third-party font CSS + unused Satoshi name; TBT/LCP risk | Prod Perf 47 · TBT 9.3s | Fontshare absent · IBM Plex woff2 preload | Contributes to aggregate +22 Perf / −3.0 s LCP |
| OPT-02 | Root layout: stop mounting `AppProviders` (Theme/Toast/AuthSessionSync); keep SW + BrandSurfaceTone; providers only via `ShellProviders` on `(app)`/`(portals)` | Nested client providers on `/login` contradict M0 Option B; hydration cost | Same baseline | Auth shell `data-mpa-shell="auth"` on Production | Contributes to aggregate TBT/SI improvement |
| OPT-03 | `MediaImage` → `next/image` (+ `remotePatterns` for Supabase host); `unoptimized` for signed URLs | P8-03 image pipeline; avoid caching expired signed URLs | Raw Avatar `<img>` | Code shipped in `f988ae5` | Pipeline ready (LCP route = login, brand img path) |
| OPT-04 | `dynamic()` FloatingAiCopilot (`ssr: false`) in application + portal shells | Heavy AI panel eagerly in first shell graph | Eager import | Code shipped | Post-login shell weight deferred |
| OPT-05 | `dynamic()` ImageEditorModal from `media-upload` | `react-easy-crop` weight on media surfaces | Static import | Code shipped | Media surface deferred |
| OPT-06 | `dynamic()` NotificationCenter in top navigation | Drawer not needed for first paint | Static import | Code shipped | Nav weight deferred |
| OPT-07 | Gate AI transcript `scrollTo` with `prefers-reduced-motion` | P8-06 motion hygiene | Always smooth | Code shipped · reduced-motion preserved | No Phase 5 regression |
| OPT-08 | Canopy token display family aligned to IBM Plex (no Satoshi string) | Font verify consistency | Token mismatch | Code shipped | Consistency with OPT-01 |

**Aggregate Production delta (validated):** Perf **47 → 69** · LCP **−2.97 s** · TBT **−2.26 s** · SI **−3.31 s** · a11y/BP unchanged.

---

## Product waivers (A11)

Recorded at Validation (`VALIDATE PMX-004 PHASE 8`) — ✅ **Product Accept**:

1. **PERF-WAIVER-P8-01** — Mobile-throttled Lighthouse Performance ≥ 95 remains constrained by Next.js app-router + auth SDK + OneSignal shell (M0 historical Perf ~59–67 on `/login`). Material TBT/LCP/SI improvement accepted in lieu of score chasing via feature removal.  
2. **PWA-WAIVER-P8-01** — LH 12.6 run with selected flags did not emit a numeric `pwa` category score; installability remains certified under Phase 2 Validated PASS + Production manifest/SW probes this session.

Accessibility **96** and Best Practices **100** — preserved (no a11y regression).
