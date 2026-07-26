# 23 — PMX-004 Phase 3 Implementation Summary

**Package:** PMX-004  
**Phase:** 3 — Native Application Shell  
**Authorization:** [22](./22-phase-3-authorization.md) · [CORE-003 §63](../113-core-003-implementation-master-plan/63-pmx-004-phase-3-authorization.md)  
**Status:** ✅ **IMPLEMENTED** · Shipped to Production (`2f2c23e`, deploy `dpl_RuELMbR2gMK35nM6Snzkasy7Aaws`, 2026-07-26) · Validation 🔒 until `VALIDATE PMX-004 PHASE 3`  
**Date:** 2026-07-26  

> Phases 4–11 **not** implemented. UX-012 C–E · OPS-001 C–E · FIN-003 C–E · partner marketplace UI **not** touched.  
> Phase 1 unified SW / Phase 2 install experience preserved. AUTH / COM / OPS-A / UX-012 A–B preserved. No schema migrations. No IA redesign.

---

## 1. Deliverables completed

| Area | Result |
|------|--------|
| Viewport metadata | Next.js `export const viewport` with `viewportFit: "cover"` + `themeColor` |
| Apple Web App | `metadata.appleWebApp` — capable · title · `statusBarStyle: "black-translucent"` |
| Theme / status bar | Canopy brand navy `#0D2645` (light) · dark app bg `#0B0D10` · runtime meta sync |
| Splash / background | Manifest `background_color` / `theme_color` via shared shell theme constants |
| Safe-area | `--mpa-safe-*` tokens · ops shell · portal shell · vendor token · bottom nav |
| Cold-start | Theme init sets `data-theme`, brand surface, `theme-color` meta, html/body background before paint |
| Overscroll | `overscroll-behavior-y: none` on document · `contain` on scroll regions |
| Keyboard avoidance | `visualViewport` → `--mpa-keyboard-inset` · bottom nav · SW banner · AI FAB · toolbelt |
| Zoom hygiene | `.mpa-chrome-control` (`touch-action: manipulation`) · mobile inputs ≥16px · pinch remains |
| Tests | `native-shell.test.ts` · theme-sync cold-start assertions |

---

## 2. Native shell architecture

```
layout.tsx
  ├── viewport (viewportFit=cover, themeColor)
  ├── metadata.appleWebApp
  └── beforeInteractive theme init (mode + theme-color + backgrounds)

manifest.ts
  └── theme_color / background_color ← native-shell-theme constants

globals.css
  ├── --mpa-safe-top|right|bottom|left
  ├── --mpa-keyboard-inset
  ├── overscroll containment
  ├── .mpa-chrome-control
  └── mobile input ≥16px

Shells (ops / portals)
  ├── NativeShellEffects → visualViewport listeners
  ├── safe-area padding on chrome
  └── bottom-fixed UI offsets keyboard inset
```

---

## 3. Safe-area handling

| Surface | Treatment |
|---------|-----------|
| CSS tokens | `--mpa-safe-top/right/bottom/left` ← `env(safe-area-inset-*)` |
| PM ops shell | Side insets on shell root · mobile header `pt` safe-top · desktop topnav `lg:pt` · main `pb` safe-bottom |
| Portal shell | Side insets · sticky header includes safe-top |
| Portal bottom nav | `pb` safe-bottom · `bottom: var(--mpa-keyboard-inset)` |
| Vendor token `/v/[token]` | Top/bottom/side safe padding on page root |
| SW update banner / AI FAB | Safe-bottom (+ keyboard inset) |

Requires `viewportFit: "cover"` (P3-01) for non-zero insets on notched devices.

---

## 4. Keyboard behavior

| Piece | Behavior |
|-------|----------|
| `computeKeyboardInset` | `innerHeight - vv.height - vv.offsetTop` (clamped ≥ 0) |
| `useKeyboardInset` | Listens `visualViewport` resize/scroll + window resize/orientation |
| CSS var | `--mpa-keyboard-inset` on `documentElement` |
| Consumers | Portal bottom nav · SW reload banner · AI FAB · entity action toolbelt (`marginBottom`) |
| Desktop | Inset stays `0` when keyboard absent — no layout jump |

Routing / IA unchanged.

---

## 5. Gesture & scroll behavior

| Concern | Implementation |
|---------|----------------|
| Overscroll | Document `overscroll-behavior-y: none`; `.mpa-app-main` / `.mpa-native-shell-scroll` use `contain` |
| Double-tap zoom | `.mpa-chrome-control` on bottom-nav links, Menu button, SW Reload |
| Pinch-zoom | Not disabled (`user-scalable` / `maximumScale` untouched) |
| iOS focus zoom | Mobile form controls `font-size: max(16px, 1em)` |

---

## 6. Cold-start behavior

1. SSR sets `data-theme` / `data-brand-surface` from cookies.  
2. `beforeInteractive` script resolves preference → mode → brand surface.  
3. Script paints `theme-color` meta + html/body `backgroundColor` (light `#F3F4F6` / dark `#0B0D10`).  
4. CSS `--mpa-color-bg-app` matches; ThemeProvider continues to call `applyDocumentBrandSurface` on toggles (re-syncs meta).  
5. Manifest splash uses light background + navy theme (install-time OS chrome).

---

## 7. Files changed (primary)

### Lib

| Path | Change |
|------|--------|
| `apps/web/src/lib/pwa/native-shell-theme.ts` | **Added** — theme/background constants + meta sync |
| `apps/web/src/lib/pwa/visual-viewport.ts` | **Added** — keyboard inset pure helpers |
| `apps/web/src/lib/pwa/use-keyboard-inset.ts` | **Added** — React hook |
| `apps/web/src/lib/pwa/native-shell.test.ts` | **Added** — theme + inset unit tests |
| `apps/web/src/lib/theme/theme-sync.ts` | Cold-start theme-color + background hardening |
| `apps/web/src/lib/theme/theme-sync.test.ts` | Cold-start script assertions |

### App / CSS

| Path | Change |
|------|--------|
| `apps/web/src/app/layout.tsx` | `viewport` · `appleWebApp` · themeColor |
| `apps/web/src/app/manifest.ts` | Shared shell theme constants |
| `apps/web/src/app/globals.css` | Safe-area vars · overscroll · chrome-control · input ≥16px |
| `apps/web/src/app/v/[token]/page.tsx` | Vendor safe-area padding |

### UI / shells

| Path | Change |
|------|--------|
| `components/pwa/native-shell-effects.tsx` | **Added** — mounts keyboard inset |
| `components/shell/application-shell.tsx` | Safe-area · NativeShellEffects · dvh |
| `components/shell/top-navigation.tsx` | Desktop safe-top |
| `components/shell/responsive-navigation.tsx` | Chrome zoom hygiene on Menu |
| `components/portal/portal-shell.tsx` | Safe-area · NativeShellEffects |
| `components/portal/owner-mobile-bottom-nav.tsx` | Keyboard inset + chrome-control |
| `components/presentation/entity-action-toolbelt.tsx` | Keyboard / safe-bottom |
| `components/ai/floating-ai-copilot.tsx` | Safe + keyboard bottom offset |
| `components/pwa/register-service-worker.tsx` | Keyboard inset + chrome-control |

### Docs

| Path | Change |
|------|--------|
| `docs/106-pmx-004-…/23-phase-3-implementation.md` | **Added** — this summary |
| Package / CORE-003 boards | Implementation status |

---

## 8. Acceptance criteria map (implementation coverage)

| ID | Coverage |
|----|----------|
| P3-01 | `viewport` + `viewportFit: "cover"` + themeColor |
| P3-02 | `appleWebApp` capable / statusBarStyle / title |
| P3-03 | Ops · portals · vendor safe-area |
| P3-04 | Navy / dark tokens via `native-shell-theme` + meta sync |
| P3-05 | Theme init paints branded bg + theme-color before interactive |
| P3-06 | Document / scroll overscroll rules |
| P3-07 | visualViewport → bottom-fixed consumers |
| P3-08 | touch-action manipulation + input ≥16px; pinch intact |
| P3-09 | No Phase 1–2 / AUTH / COM / OPS-A / UX-A–B / schema / IA changes |
| P3-10 | This summary; validation still pending |

---

## 9. Remaining PMX Phases 4–11 (not in this session)

| Phase | Status |
|-------|--------|
| 4 — Standalone Compliance | 🔒 Locked |
| 5 — Native Mobile UX matrix | 🔒 Locked |
| 6 — Push Notification Certification | 🔒 Locked |
| 7 — Offline Reliability / outbox | 🔒 Locked |
| 8 — Performance Optimization | 🔒 Locked |
| 9 — Premium Native Features | 🔒 Locked |
| 10 — Production Validation | 🔒 Locked |
| 11 — Real-World Pilot | 🔒 Locked |

Also locked: UX-012 C–E · OPS-001 C–E · FIN-003 C–E · partner marketplace UI.

---

## 10. Recommendation

1. ✅ Phase 3 implementation complete within authorized scope.  
2. ✅ Proceed to **`VALIDATE PMX-004 PHASE 3`** in a dedicated validation session (P3-01…P3-10).  
3. ❌ Do **not** begin validation in this implementation session.  
4. ❌ Do **not** authorize or implement Phase 4+ / UX-C / OPS-C / FIN-C / marketplace under this work.

---

## Sign-off

| Role | Decision | Date |
|------|----------|------|
| Implementation | ✅ **IMPLEMENTED** | 2026-07-26 |
| Validation | 🔒 Pending `VALIDATE PMX-004 PHASE 3` | — |
