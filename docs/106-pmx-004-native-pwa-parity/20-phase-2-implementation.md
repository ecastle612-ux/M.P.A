# 20 — PMX-004 Phase 2 Implementation Summary

**Package:** PMX-004  
**Phase:** 2 — Native Installation Experience  
**Authorization:** [19](./19-phase-2-authorization.md) · [CORE-003 §61](../113-core-003-implementation-master-plan/61-pmx-004-phase-2-authorization.md)  
**Status:** ✅ **IMPLEMENTED** · ✅ **VALIDATED PASS** ([21](./21-phase-2-validation.md))  
**Date:** 2026-07-26  

> Phases 3–11 **not** implemented. UX-012 C–E · OPS-001 C–E · FIN-003 C–E · partner marketplace UI **not** touched.  
> Phase 1 unified SW / push / offline preserved. AUTH / COM / OPS-A / UX-012 A–B preserved. No schema migrations.

---

## 1. Deliverables completed

| Area | Result |
|------|--------|
| Platform detection | `detectPwaPlatform` — android-chrome · ios-safari · desktop · other |
| BIP + Install CTA | `beforeinstallprompt` capture · deferred prompt · Install CTA · dismiss/backoff |
| iOS A2HS | Tokenized step sheet (Share → Add to Home Screen) · confirm / remind later |
| Standalone detection | `display-mode` + `navigator.standalone` · `appinstalled` · checklist Installed |
| Post-install notifications | After install only; API-001A `obtainPushSubscription` + `registerDeviceWithServer` (`enrolledVia: "pwa"`); generic push banner deferred until installed |
| Lazy camera | No onboarding camera prompt; Permissions sync + `mpa:pwa-camera-intent` from capture uploads |
| Install checklist | Installed · Notifications · Offline Ready · Camera Ready; org-scoped `mpa.pwa.onboarding.v1:<orgId>` |
| Funnel analytics | `pwa_funnel_*` via `trackEvent` (secret-free; org id + platform + standalone + role only) |
| Settings re-entry | `/settings/notifications` → `PwaInstallSettingsPanel` |

---

## 2. Files changed (primary)

### Lib

| Path | Change |
|------|--------|
| `apps/web/src/lib/pwa/platform.ts` | **Added** — platform detection |
| `apps/web/src/lib/pwa/standalone.ts` | **Added** — standalone helpers |
| `apps/web/src/lib/pwa/before-install-prompt.ts` | **Added** — BIP capture / prompt |
| `apps/web/src/lib/pwa/onboarding-storage.ts` | **Added** — org-safe checklist persistence |
| `apps/web/src/lib/pwa/funnel.ts` | **Added** — funnel event emitters |
| `apps/web/src/lib/pwa/camera-readiness.ts` | **Added** — lazy camera readiness |
| `apps/web/src/lib/pwa/offline-ready.ts` | **Added** — Phase 1 `MPA_STATUS` consumer |
| `apps/web/src/lib/pwa/*.test.ts` | **Added** — platform · storage · funnel tests |

### UI

| Path | Change |
|------|--------|
| `components/pwa/pwa-native-onboarding.tsx` | **Added** — orchestrator (banner / notify / checklist) |
| `components/pwa/ios-a2hs-sheet.tsx` | **Added** — iOS A2HS sheet |
| `components/pwa/install-checklist.tsx` | **Added** — checklist UI |
| `components/pwa/pwa-install-settings-panel.tsx` | **Added** — Settings re-entry |
| `components/shell/application-shell.tsx` | Mount onboarding |
| `components/portal/portal-shell.tsx` | Mount onboarding |
| `components/communication/push-enrollment-banner.tsx` | Defer until installed when coaching active |
| `components/media/media-upload.tsx` | Camera intent event on capture |
| `components/vendor-jobs/vendor-job-card.tsx` · `vendor-invoice-upload.tsx` | Camera intent event |
| `app/(app)/settings/notifications/page.tsx` | Install settings panel |

### Docs

| Path | Change |
|------|--------|
| `docs/106-pmx-004-…/20-phase-2-implementation.md` | **Added** — this summary |
| `docs/106-pmx-004-…/19-phase-2-authorization.md` | Implementation status |
| `docs/106-pmx-004-…/README.md` | Board status |
| `docs/113-core-003-…/61-pmx-004-phase-2-authorization.md` | Implementation status |

---

## 3. Flows

### Android / desktop BIP

1. Capture `beforeinstallprompt` (preventDefault) → deferred prompt.  
2. Non-blocking Install CTA after shell idle (~1.2s).  
3. Accept → `pwa_funnel_install_accepted` · checklist Installed (or standalone / `appinstalled`).  
4. Dismiss → org-scoped backoff (1d → 3d → 7d → 30d).  

### iOS A2HS

1. Detect `ios-safari` + not standalone.  
2. “How to install” → Share → Add to Home Screen sheet.  
3. Return in standalone → Installed + funnel installed event.  
4. Notifications only after installed.  

### Post-install notifications

1. Surface “Enable notifications” after Installed.  
2. API-001A enroll path; retry-safe on failure.  
3. `PushEnrollmentBanner` suppressed until install/coaching complete.  

### Lazy camera

1. Never requested during install onboarding.  
2. Permissions API `granted` sync marks Camera Ready.  
3. First capture file selection dispatches `mpa:pwa-camera-intent`.  

### Checklist persistence

- Key: `mpa.pwa.onboarding.v1:<organizationId|none>`  
- Setup Completed = Installed + Notifications + Offline Ready (camera enrichment).  
- Idempotent `completed` / `setupCompletedAt`.  

### Funnel events

| Event | When |
|-------|------|
| `pwa_funnel_landing` | Eligible shell ready |
| `pwa_funnel_install_prompt_viewed` | CTA / A2HS sheet shown |
| `pwa_funnel_install_accepted` | BIP accept / iOS confirm |
| `pwa_funnel_installed` | Standalone detected |
| `pwa_funnel_notifications_granted` | Post-install enroll success |
| `pwa_funnel_camera_granted` | Camera ready marked |
| `pwa_funnel_setup_completed` | Setup criteria met |

---

## 4. Acceptance mapping (pre-validation)

| ID | Evidence |
|----|----------|
| **P2-01** | `platform.ts` + tests |
| **P2-02** | BIP capture + Install CTA |
| **P2-03** | `IosA2hsSheet` |
| **P2-04** | `standalone.ts` + checklist Installed |
| **P2-05** | Post-install notify + banner deferral |
| **P2-06** | Checklist + org storage + Settings panel |
| **P2-07** | Camera readiness + capture intents |
| **P2-08** | `funnel.ts` + `trackEvent` |
| **P2-09** | Phase 1 SW untouched; no schema; no AUTH/COM/OPS redesign |
| **P2-10** | This summary; Phases 3–11 not shipped |

---

## 5. Remaining work (Phases 3–11 — not started)

| Phase | Scope |
|-------|--------|
| 3 | Native Application Shell (viewport/safe-area/keyboard) |
| 4 | Standalone Compliance (exit inventory) |
| 5 | Native Mobile UX + matrix |
| 6 | Push Notification Certification matrix |
| 7 | Offline Reliability / outbox |
| 8 | Performance Optimization |
| 9 | Premium Native Features |
| 10 | Production Validation |
| 11 | Real-World Pilot / package COMPLETE |

---

## 6. Tests

| Suite | Result |
|-------|--------|
| `platform.test.ts` | ✅ |
| `onboarding-storage.test.ts` | ✅ |
| `funnel.test.ts` | ✅ |
| **Total** | ✅ **9/9 PASS** |

---

## 7. Recommendation

| Field | Result |
|-------|--------|
| **Phase 2 implemented?** | ✅ **YES** |
| **Begin validation?** | ✅ Completed — [21](./21-phase-2-validation.md) |
| **Authorize Phase 3+ / UX-C / OPS-C / FIN-C / marketplace?** | ❌ **NO** |

**Follow-on:** `VALIDATE PMX-004 PHASE 2` → ✅ **PASS** ([21](./21-phase-2-validation.md) · [CORE-003 §62](../113-core-003-implementation-master-plan/62-pmx-004-phase-2-validation.md)).

---

## Sign-off

| Role | Decision | Date |
|------|----------|------|
| Implementation | ✅ **IMPLEMENTED** (Phase 2 scope) | 2026-07-26 |
| Validation | ✅ **PASS** · `VALIDATE PMX-004 PHASE 2` | 2026-07-26 |
