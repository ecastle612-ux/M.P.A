# 42 — PMX-004 Phase 8 Implementation Summary

**Package:** PMX-004  
**Phase:** 8 — Performance Optimization  
**Authorization:** [41](./41-phase-8-authorization.md) · [CORE-003 §81](../113-core-003-implementation-master-plan/81-pmx-004-phase-8-authorization.md)  
**Status:** ✅ **IMPLEMENTED** · Validation 🔒 until `VALIDATE PMX-004 PHASE 8`  
**Date:** 2026-07-26  

> Phases 9–11 **not** implemented. UX-012 C–E · OPS-001 C–E · FIN-003 C–E · partner marketplace UI · full EP-019 Approve **not** touched.  
> Phases 1–7 preserved. OneSignal primary preserved. **No schema migrations.**  
> Evidence: [artifacts/phase-8-lighthouse/](./artifacts/phase-8-lighthouse/).

---

## 1. Deliverables completed

| Area | Result |
|------|--------|
| Measure-first baseline | Production `/login` mobile LH 12.6.0 captured **before** code changes |
| Optimization log | [optimization-log.md](./artifacts/phase-8-lighthouse/optimization-log.md) (OPT-01…OPT-08) |
| Image pipeline | `MediaImage` → `next/image` · Supabase `remotePatterns` · signed URL `unoptimized` |
| Code splitting | FloatingAiCopilot · ImageEditorModal · NotificationCenter (+ existing CommandCenter / AuthSessionSync) |
| Hydration | Root `AppProviders` removed; auth CSS-only; ShellProviders post-login only |
| Font / cache / animation | Fontshare Satoshi import removed · IBM Plex via next/font · reduced-motion scroll gate · SW no-store preserved |
| A11 path | Baseline filed; Product waiver candidates documented if Perf ≥ 95 not reachable without scope expansion |

---

## 2. Baseline metrics (Production · before OPT)

| Metric | Value |
|--------|-------|
| URL | https://www.my-property-assistant.com/login |
| Profile | Mobile simulate · Lighthouse 12.6.0 |
| Fetch time | 2026-07-26T17:15:14.825Z |
| Performance | **47** |
| Accessibility | **96** |
| Best Practices | **100** |
| LCP | 4.8 s |
| FCP | 1.1 s |
| CLS | 0 |
| TBT | 9,330 ms |
| Speed Index | 6.2 s |

Artifacts:

- [baseline-login.metrics.json](./artifacts/phase-8-lighthouse/baseline-login.metrics.json)  
- [baseline-login.report.html](./artifacts/phase-8-lighthouse/baseline-login.report.html)  
- [baseline-login.report.json](./artifacts/phase-8-lighthouse/baseline-login.report.json)  

**Final Production metrics** after these code changes require a Production deploy + Validation remeasure (`VALIDATE PMX-004 PHASE 8`). Lab after-scores were not substituted for Production.

---

## 3. Files changed (primary)

### App / config
- `apps/web/src/app/layout.tsx` — remove root `AppProviders` (hydration)
- `apps/web/src/app/globals.css` — remove Fontshare Satoshi `@import`; display font → IBM Plex
- `apps/web/next.config.ts` — Supabase Storage `images.remotePatterns`

### Media
- `apps/web/src/components/media/media-image.tsx` — `next/image` MediaImage
- `apps/web/src/components/media/media-upload.tsx` — dynamic ImageEditorModal

### Shell / AI
- `apps/web/src/components/shell/application-shell.tsx` — dynamic FloatingAiCopilot
- `apps/web/src/components/portal/portal-shell.tsx` — dynamic FloatingAiCopilot
- `apps/web/src/components/shell/top-navigation.tsx` — dynamic NotificationCenter
- `apps/web/src/components/ai/floating-ai-copilot.tsx` — reduced-motion scroll
- `apps/web/src/components/ai/ai-search-assistant.tsx` — reduced-motion scroll

### Tokens
- `packages/ui/src/tokens/canopy.ts` — display family aligned to IBM Plex

### Docs / evidence
- This summary · [CORE-003 §82](../113-core-003-implementation-master-plan/82-pmx-004-phase-8-implementation.md)  
- `artifacts/phase-8-lighthouse/*`

---

## 4. Summaries by workstream

### 4.1 Image optimization
- Product media via `MediaImage` now uses `next/image` with variant-based width/height/sizes.  
- Signed Supabase URLs use `unoptimized` to avoid optimizer cache of expired signatures.  
- BrandLogo / QR / blob previews remain intentional exceptions (prior M0 LCP decisions).

### 4.2 Code splitting
| Component | Strategy |
|-----------|----------|
| FloatingAiCopilot | `dynamic(..., { ssr: false })` in app + portal shells |
| ImageEditorModal | `dynamic` when editor opens |
| NotificationCenter | `dynamic` from top nav |
| CommandCenter / AuthSessionSync | Pre-existing (preserved) |

### 4.3 Hydration
- Auth routes no longer mount ThemeProvider / ToastProvider / AuthSessionSync (root).  
- Post-login `(app)` / `(portals)` continue to use `ShellProviders` → optimized `AppProviders`.  
- Theme tokens on auth remain via `html[data-theme]` + CSS (M0 Option B intent restored).

### 4.4 Font / cache / animation
- Removed blocking Fontshare CSS import.  
- Display stack uses loaded `next/font` IBM Plex variables.  
- SW scripts remain `no-cache, no-store` (Phase 1 preserved — no cache-first flip).  
- AI transcript smooth-scroll respects `prefers-reduced-motion`.

---

## 5. A11 / waiver posture

| Gate | Baseline | Post-implement Production | Notes |
|------|----------|---------------------------|-------|
| Perf ≥ 95 | 47 | 🔒 Pending deploy + Validation | Waiver candidate PERF-WAIVER-P8-01 if still below after OPT |
| a11y ≥ 95 | 96 | Must not regress | — |
| BP ≥ 100 | 100 | Must not regress | — |
| PWA ≥ 100 | LH numeric N/A this run | Phase 2 installability PASS preserved | Validation may accept Phase 2 evidence |

---

## 6. Remaining PMX Phases 9–11 (locked)

| Phase | Status |
|-------|--------|
| 9 — Premium Native Features | 🔒 Locked |
| 10 — Production Validation | 🔒 Locked |
| 11 — Real-World Pilot / COMPLETE | 🔒 Locked |

Also locked: UX-012 C–E · OPS-001 C–E · FIN-003 C–E · marketplace UI · full EP-019 Approve.

---

## 7. Regression / non-negotiables

| Check | Result |
|-------|--------|
| Phases 1–7 SW / install / shell / standalone / UX / push / outbox | Preserved (no redesign) |
| AUTH / COM / OPS A–B / UX A–B packages | Not expanded |
| Schema migrations | None |
| OneSignal primary | Retained |
| CSP / security headers | Not weakened |

---

## 8. Recommendation

1. ✅ Phase 8 implementation complete within authorized scope.  
2. ✅ Proceed to dedicated session → **`VALIDATE PMX-004 PHASE 8`** (include Production remeasure after deploy).  
3. ❌ Do **not** authorize or implement Phase 9+ / UX-C / OPS-C / FIN-C / marketplace / EP-019 Approve under this work.

---

## Sign-off

| Role | Decision | Date |
|------|----------|------|
| Implementation | ✅ **IMPLEMENTED** (this document) | 2026-07-26 |
| Validation | 🔒 Pending `VALIDATE PMX-004 PHASE 8` | — |
