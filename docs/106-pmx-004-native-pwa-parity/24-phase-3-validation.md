# 24 — PMX-004 Phase 3 Validation Report

**Package:** PMX-004 — Native PWA Parity  
**Phase:** 3 — Native Application Shell  
**Authorization:** [22](./22-phase-3-authorization.md)  
**Implementation:** [23](./23-phase-3-implementation.md)  
**Status:** ✅ **VALIDATED** · **PASS**  
**Date:** 2026-07-26  
**Binding phrase (issued):**

```
VALIDATE PMX-004 PHASE 3
```

**Program record:** [CORE-003 §65](../113-core-003-implementation-master-plan/65-pmx-004-phase-3-validation.md)  
**Package phase minimum:** **A7** — [06](./06-acceptance-criteria.md) §3  
**Design SoT:** [05](./05-implementation-order.md) Phase 3 · [02](./02-proposed-architecture.md) §5

> Validation only. No product-code changes in this session.  
> PMX-004 Phases 4–11 · UX-012 C–E · OPS-001 C–E · FIN-003 C–E · certified partner marketplace UI **not** authorized under this phrase.  
> Historical governance records preserved.

---

## 1. Final determination

| Field | Result |
|-------|--------|
| **Phase 3 Validation** | ✅ **PASS** |
| **Phrase** | ✅ `VALIDATE PMX-004 PHASE 3` recorded |
| **Remediation required before PASS?** | ❌ **No** |
| **Phase 3 approved for program progression?** | ✅ **YES** — Phase 3 **Validated** |
| **Recommend `AUTHORIZE PMX-004 PHASE 4`?** | ✅ **Eligible** after this Validation — phrase **not issued** here |
| **Begin Phase 4 / UX-C / OPS-C / FIN-C / marketplace?** | ❌ **NO** — locked until each explicit authorize |

---

## 2. Scope verified against [22] / [23]

| In-scope deliverable | Evidence | Result |
|----------------------|----------|--------|
| Viewport + themeColor | `app/layout.tsx` `export const viewport` · `viewportFit: "cover"` | ✅ |
| Apple Web App metadata | `metadata.appleWebApp` capable · title · `statusBarStyle: "black-translucent"` | ✅ |
| Safe-area insets | `--mpa-safe-*` · ops · portal · vendor `/v/[token]` · bottom nav | ✅ |
| Theme / status / splash | `native-shell-theme.ts` · manifest · runtime meta sync | ✅ |
| Cold-start hardening | `buildThemeInitScript` theme-color + branded backgrounds | ✅ |
| Overscroll containment | `globals.css` document `none` · scroll regions `contain` | ✅ |
| Keyboard avoidance | `visualViewport` · `--mpa-keyboard-inset` · bottom-fixed consumers | ✅ |
| Zoom hygiene | `.mpa-chrome-control` · mobile input ≥16px · no pinch disable | ✅ |
| Preserve Phases 1–2 | SW + onboarding/funnel modules intact | ✅ |
| No Phases 4–11 / unauthorized packages | No standalone-exit inventory work · no offline outbox · no UX-C/OPS-C/FIN-C/marketplace | ✅ |

**Evidence mode:** code + layout + automated unit tests (exit criteria allow “device or documented layout evidence”). Real-device notch/keyboard smoke remains recommended ops hygiene, not a Phase 3 code fail.

---

## 3. Acceptance checklist (P3-01 … P3-10)

| ID | Criterion | Result | Evidence / notes |
|----|-----------|--------|------------------|
| **P3-01** | Viewport metadata (`viewportFit` + themeColor) | ✅ PASS | `layout.tsx` `viewportFit: "cover"`; themeColor light/dark + default navy |
| **P3-02** | Apple web app metadata | ✅ PASS | `appleWebApp.capable` · `title` · `statusBarStyle: "black-translucent"`; apple-touch icon retained |
| **P3-03** | Safe-area on primary shells | ✅ PASS | Ops mobile header + desktop topnav safe-top; portal header; vendor page; bottom nav safe-bottom; side insets on shell roots |
| **P3-04** | Theme / status bar alignment | ✅ PASS | Canopy brand navy `#0D2645` · dark `#0B0D10` · light splash `#F3F4F6` via shared constants (no ad-hoc parallel palette) |
| **P3-05** | Cold-start flash | ✅ PASS | beforeInteractive script sets `data-theme`, brand surface, `theme-color` meta, html/body `backgroundColor`; ThemeProvider re-syncs via `applyDocumentBrandSurface` |
| **P3-06** | Overscroll containment | ✅ PASS | `html, body` `overscroll-behavior-y: none`; `.mpa-app-main` / `.mpa-native-shell-scroll` `contain` |
| **P3-07** | Keyboard avoidance | ✅ PASS | `computeKeyboardInset` + `useKeyboardInset`; consumers: portal bottom nav, SW banner, AI FAB, entity toolbelt; inset `0` when keyboard closed |
| **P3-08** | Zoom hygiene (pinch preserved) | ✅ PASS | `.mpa-chrome-control` `touch-action: manipulation`; mobile inputs `max(16px, 1em)`; no `user-scalable=no` / `maximumScale` |
| **P3-09** | Regression / non-negotiables | ✅ PASS | Phase 1 `/OneSignalSDKWorker.js` + `sw-offline.js`; Phase 2 BIP/A2HS/funnel/checklist intact; no schema; no IA redesign; AUTH/COM/OPS-A/UX-A–B not redesigned |
| **P3-10** | Documentation & scope | ✅ PASS | [23] + this report; Phases 4–11 / UX-C–E / OPS-C–E / FIN-C–E / marketplace not shipped |

**All P3-01–P3-10:** ✅ **PASS**

---

## 4. Detailed verification

### 4.1 Native Application Shell

| Check | Result |
|-------|--------|
| `viewportFit: "cover"` | ✅ |
| `themeColor` wired (Next viewport + runtime meta) | ✅ |
| `appleWebApp` capable + status bar style | ✅ |
| Manifest `theme_color` / `background_color` aligned | ✅ Shared `native-shell-theme` constants |
| Safe-area tokens (`--mpa-safe-*`) | ✅ |
| Ops shell safe-area (mobile header · lg topnav · main bottom · sides) | ✅ |
| Portal shell safe-area (header · sides) | ✅ |
| Vendor token surface safe-area | ✅ `/v/[token]` |
| Portal bottom nav safe-bottom | ✅ |

### 4.2 Theme / status / splash / cold-start

| Check | Result |
|-------|--------|
| Light status navy `#0D2645` | ✅ Package-approved Canopy brand navy |
| Dark status / bg `#0B0D10` | ✅ Matches dark `--mpa-color-bg-app` |
| Splash light `#F3F4F6` | ✅ Matches light `--mpa-color-bg-app` |
| Cold-start script paints theme-color + backgrounds | ✅ `buildThemeInitScript` (+ unit assertions) |
| Mode toggle re-syncs chrome | ✅ `syncNativeShellThemeChrome` via `applyDocumentBrandSurface` |

### 4.3 Keyboard & viewport

| Check | Result |
|-------|--------|
| `visualViewport` listeners | ✅ resize/scroll + window resize/orientation |
| CSS var `--mpa-keyboard-inset` | ✅ |
| Bottom nav lifts with keyboard | ✅ `bottom: var(--mpa-keyboard-inset)` |
| No layout jump when inset = 0 | ✅ Pure clamp ≥ 0; unit tests |
| Routing / IA unchanged | ✅ |

### 4.4 Gesture & scroll

| Check | Result |
|-------|--------|
| Document overscroll none | ✅ |
| Content scroll contain | ✅ |
| Double-tap hygiene on chrome | ✅ bottom-nav links · Menu · SW Reload |
| Pinch-zoom preserved | ✅ No global disable |
| Mobile input focus-zoom mitigation | ✅ ≥16px on text controls |

### 4.5 Platform consistency (code-level)

| Surface | Result |
|---------|--------|
| Installed PWA (standalone) | ✅ Same shell CSS + viewport-fit; Phase 2 standalone detection unchanged |
| Browser mode | ✅ Shell effects mount on authenticated/portal shells; auth routes retain root viewport/metadata |
| iOS / Android / desktop | ✅ Shared CSS env() + visualViewport (graceful no-op when VV absent) |
| Transition install ↔ browser | ✅ Phase 2 onboarding/standalone paths untouched |

### 4.6 Regression

| Check | Result |
|-------|--------|
| Phase 1 unified SW preserved | ✅ `OneSignalSDKWorker.js` · `sw-offline.js` · register path |
| Phase 2 install / funnel / checklist preserved | ✅ `pwa-native-onboarding` · BIP · A2HS · funnel · storage |
| AUTH-001 integrations | ✅ No auth redesign under Phase 3 |
| COM-001 integrations | ✅ Not touched |
| OPS-001 Slice A | ✅ Not redesigned |
| UX-012 Slice A/B | ✅ Shell uses `--mpa-*` / Canopy; no parallel design system |
| Breaking API / schema | ✅ No schema migrations in Phase 3 scope |
| Workflow / IA redesign | ✅ Navigation structure preserved |

### 4.7 Exclusions confirmed

| Excluded | Confirmed absent from Phase 3 ship |
|----------|-------------------------------------|
| Phase 4 standalone compliance (exit inventory / Stripe interstitial) | ✅ (`target="_blank"` remains — deferred to Phase 4) |
| Phase 5 UX matrix | ✅ |
| Phase 6 push matrix | ✅ |
| Phase 7 offline outbox | ✅ |
| Phases 8–11 | ✅ |
| UX-012 C–E · OPS-001 C–E · FIN-003 C–E | ✅ |
| Partner marketplace UI | ✅ |
| IA redesign | ✅ |

---

## 5. Automated evidence

| Check | Result |
|-------|--------|
| `src/lib/pwa/*` + `theme-sync.test.ts` | ✅ **22/22 PASS** (2026-07-26 validation session) |
| Keyboard inset unit cases | ✅ missing VV · closed · open · offsetTop · non-negative |
| Theme init cold-start assertions | ✅ theme-color · `#0D2645` · `#0B0D10` · `#F3F4F6` |

---

## 6. Exit criteria ([22] §6)

| Criterion | Result |
|-----------|--------|
| P3-01–P3-10 satisfied | ✅ |
| Safe-area / viewport-fit evidenced (layout/code) | ✅ |
| Cold-start / theme flash mitigation evidenced | ✅ |
| Keyboard avoidance evidenced (bottom nav + helpers) | ✅ |
| No unresolved critical defects; Phases 1–2 not regressed | ✅ |
| Documentation updated | ✅ |
| Governance recommendation recorded | ✅ |
| `VALIDATE PMX-004 PHASE 3` recorded | ✅ |

---

## 7. Remediation

| Severity | Item | Action |
|----------|------|--------|
| Critical | — | None |
| High | — | None |
| Low (optional) | Real-device notch / Dynamic Island / soft-keyboard smoke on Galaxy · Pixel · iPhone (installed + browser) | Recommended ops hygiene; not a Phase 3 code fail |
| Low (optional) | Broaden `.mpa-chrome-control` to additional sticky form footers | Optional polish; primary bottom-fixed surfaces covered |

**No code changes required for this Validation PASS.**

---

## 8. Recommendation — Phase 3 approval & Phase 4

| Question | Answer |
|----------|--------|
| Is Phase 3 **Validated / approved for progression?** | ✅ **Yes — PASS** |
| May PMX-004 Phase 4 be **authorized**? | ✅ **Eligible** at validation · subsequently **AUTHORIZED** ([25](./25-phase-4-authorization.md)) |
| May UX-012 C / OPS-001 C / FIN-003 C / marketplace be authorized? | ❌ **No** under this phrase |
| Begin any locked implementation now? | ❌ **No** |

**Program next:** Phase 4 subsequently **AUTHORIZED** — [25](./25-phase-4-authorization.md) · [CORE-003 §66](../113-core-003-implementation-master-plan/66-pmx-004-phase-4-authorization.md). Implementation pending dedicated session.

---

## Sign-off

| Role | Decision | Date |
|------|----------|------|
| Validation | ✅ **PASS** · `VALIDATE PMX-004 PHASE 3` | 2026-07-26 |
| PMX-004 Phase 4 | ✅ Subsequently **AUTHORIZED** ([25](./25-phase-4-authorization.md)) | Implementation pending |
| UX-012 C–E · OPS-001 C–E · FIN-003 C–E · marketplace UI | 🔒 Locked | — |
