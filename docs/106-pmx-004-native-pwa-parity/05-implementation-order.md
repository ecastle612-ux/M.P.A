# 05 — Implementation Order

**Package:** PMX-004  
**Status:** ✅ Approved with Amendments (2026-07-23)  

**Rule:** Approved package — begin with Phase 1. Complete each phase’s verification before starting the next **high-risk** phase (1 → 4 → 6 → 7 → 10 → **11** are hard gates). Phases 2–3 and 5, 8–9 may partially overlap only when Phase 1 is production-proven. **COMPLETE requires Phase 11.**

---

## Phase map

| Phase | Name | Depends on | Risk |
| --- | --- | --- | --- |
| 1 | Unified Service Worker | Approve + amendments incorporated | Critical |
| 2 | Native Installation Experience | Phase 1 verified | Medium |
| 3 | Native Application Shell | Phase 1 merge | Medium |
| 4 | Standalone Compliance | Phase 3 recommended | High |
| 5 | Native Mobile UX + UX matrix pass | Phase 3 | Medium |
| 6 | Push Notification Certification | Phase 1 + PUSH-001 | High (ops) |
| 7 | Offline Reliability | Phase 1 | Critical |
| 8 | Performance Optimization | Phase 1 (SW stable) | Medium |
| 9 | Premium Native Features | Phases 2–3 | Low–Med |
| 10 | Production Validation | Phases 1–9 | High (gate) |
| **11** | **Real-World Pilot** | Phase 10 | **Critical (COMPLETE gate)** |

---

## Phase 1 — Unified Service Worker

**Design:** [09-unified-service-worker-design.md](./09-unified-service-worker-design.md)

### Work

1. Extract offline logic from `/sw.js` into `/sw-offline.js`.  
2. Compose into `OneSignalSDKWorker.js` via `importScripts("/sw-offline.js")` **after** or carefully ordered with OneSignal import (validate event listener coexistence).  
3. Ensure **single registration path** — stop registering `/sw.js` when OneSignal present; ultimately stop dual paths entirely.  
4. Implement update detection message protocol + in-app “Reload to update”.  
5. Cache version bump strategy; logout cache clear for navigations if any HTML cached.  
6. Fix false comment in `client-push.ts`.  
7. Deprecate duplicate `/push/onesignal/` worker or document single canonical path.

### Done when

- Push enrollment + delivery still PASS on Android Chrome.  
- Offline fallback works with OneSignal configured.  
- Post-deploy phones receive new JS within one update cycle.

---

## Phase 2 — Native Installation Experience

**Funnel:** [14-installation-success-funnel.md](./14-installation-success-funnel.md)

### Work

1. Platform detection utilities (Android Chrome, iOS Safari, desktop).  
2. `beforeinstallprompt` capture + Install CTA.  
3. iOS A2HS step-by-step sheet (Canopy-styled; no redesign of app).  
4. Standalone detection (`display-mode` + `navigator.standalone`).  
5. Post-install: prompt notifications (reuse API-001A).  
6. Camera readiness: **lazy** — mark ready on first camera intent or Permissions query; never blanket prompt at onboarding.  
7. Checklist UI: Installed · Notifications Enabled · Offline Ready · Camera Ready.  
8. Persist completion; Settings entry to re-open help.  
9. Emit installation funnel events (Landing → … → Setup Completed) per doc 14.

### Done when

- Android can install from in-app prompt (when browser allows).  
- iOS user can follow A2HS without leaving “confused website” state.  
- Checklist completes and does not reappear every session.  
- Funnel events fire and are capturable for KPI reporting.

---

## Phase 3 — Native Application Shell

### Work

1. Next.js `viewport` + `themeColor` + `appleWebApp` metadata.  
2. `viewport-fit=cover`; safe-area insets on all primary shells (PM, portals, vendor token where applicable).  
3. Status bar / theme-color alignment with Canopy brand navy.  
4. Reduce browser flash (theme init already exists — verify PWA cold start).  
5. Overscroll / scroll containment on shell chrome.  
6. Keyboard avoidance for bottom-fixed UI via `visualViewport`.  
7. Prevent accidental double-tap zoom on chrome controls **without** disabling pinch-zoom globally.  
8. Splash/background consistency with manifest `background_color`.

### Done when

- Notch / Dynamic Island / home indicator do not clip critical chrome.  
- Standalone cold start shows branded colors, not white flash / wrong theme.  
- Keyboard does not permanently cover primary sticky actions.

---

## Phase 4 — Standalone Compliance

**Inventory:** [10-standalone-exit-inventory.md](./10-standalone-exit-inventory.md)

### Work

1. Replace high-traffic `target="_blank"` document/report opens with in-app viewer or same-tab.  
2. Replace `window.open` report downloads.  
3. Stripe: verify absolute return URLs; optional “Returning to M.P.A.…” interstitial.  
4. E-sign: same-window where possible; else documented exit + return deep link.  
5. Audit `rel=noopener` external links; add confirm when leaving app.  
6. Password-reset / invite links: document iOS limitation; prefer paths that reopen PWA when OS allows.

### Done when

- PM document/report flows stay in standalone on Android + iPhone for primary paths.  
- Stripe checkout round-trip returns to authenticated app.  
- Exit inventory items marked Mitigated or Accepted-with-return.

---

## Phase 5 — Native Mobile UX

**Matrix:** [13-native-ux-acceptance-matrix.md](./13-native-ux-acceptance-matrix.md)

### Work (polish only — no redesign)

1. Touch targets ≥ 44×44 CSS px on primary interactive controls (Buttons, icon buttons, list rows).  
2. Spacing rhythm on dense mobile lists (token-consistent).  
3. Prefer skeletons over full-shell spinners (align EP-019 H5).  
4. Subtle route/section transitions; honor `prefers-reduced-motion`.  
5. Haptics (`navigator.vibrate`) only for confirm/destructive where supported — optional, off if reduced motion.  
6. Long-press / context menu: only where it duplicates an existing explicit action (no gesture-only).  
7. Bottom sheets: ensure drawer scroll-lock + focus trap (extend existing Drawer).  
8. Do **not** invent new navigation IA.  
9. Execute Native UX Acceptance Matrix for all major screens; remediate FAILs.

### Done when

- Touch audit PASS on PM critical paths.  
- No new a11y regressions.  
- Motion feels intentional and sparse.  
- Matrix Overall PASS for critical paths (full matrix PASS required by Phase 11 / COMPLETE).

---

## Phase 6 — Push Notification Certification

Aligns with [PUSH-001](../99-push-001-pwa-push-commercial-certification/10-pass-criteria.md).

### Work

1. Real-device matrix: Android Chrome, Samsung Internet, Pixel, iPhone (installed PWA).  
2. States: app closed, locked, background, poor network, Wi‑Fi, LTE, battery saver.  
3. Tap → deep link correctness (never wrong dashboard dump).  
4. Package evidence under `artifacts/` (no secrets).  
5. Close remaining PUSH-001 gaps that are SW-related after Phase 1.

### Done when

- PUSH-001 G1–G10 PASS (or explicit deferred with Product Accept for non-blocking cells).

---

## Phase 7 — Offline Reliability

**Design:** [11-offline-queue-design.md](./11-offline-queue-design.md)

### Work

1. IndexedDB outbox + sync manager.  
2. Allowlist workflows: maintenance notes/photos, message drafts, inspection checklist items, form drafts as listed in Phase 7 design.  
3. Background Sync registration when available; always online-event fallback.  
4. Sync status UI (global or shell-level).  
5. Conflict / failure UX — never silent drop.  
6. Documents: offline **read** of previously opened only if explicitly cached; uploads queue when allowlisted.

### Done when

- Allowlisted offline submit survives airplane mode → reconnect sync.  
- No double-create in test suite.  
- Non-allowlisted actions show clear “requires connection”.

---

## Phase 8 — Performance Optimization

Aligns with [EP-019](../87-ep-019-performance-speed-certification/README.md) discipline.

### Work

1. Baseline Lighthouse + Web Vitals on mid-tier Android + iPhone (measure first).  
2. Adopt `next/image` for media surfaces (coordinate MediaImage).  
3. Route-level / interaction `dynamic()` for heavy panels.  
4. Hydration reduction where safe (server components).  
5. Font / cache already mostly good — verify.  
6. Animation performance (transform/opacity only).

### Done when

- Performance ≥ 95, Accessibility ≥ 95, Best Practices ≥ 100 on agreed reference profiles **or** documented evidence-based waivers with Product Accept.  
- PWA category ≥ 100 after Phases 1–3.

---

## Phase 9 — Premium Native Features

### Work

1. Manifest shortcuts.  
2. Badge API wired to unread notifications (feature detect).  
3. `navigator.share` on shareable entities.  
4. Evaluate Share Target — implement only if low risk.  
5. Wake Lock during long uploads (optional).  
6. Image compression before upload (coordinate UX-010 / media pipeline) if not already sufficient.  
7. Graceful degrade matrix documented.

### Done when

- Features work where supported; no crashes where unsupported.  
- Shortcuts open correct routes in standalone.

---

## Phase 10 — Production Validation

### Work

1. Full regression matrix (auth, payments, messaging, documents, leases, properties, maintenance, AI, reports, calendar, notifications, offline, install, SW update).  
2. Standalone vs browser tab parity checklist.  
3. Draft scorecard: Native / PWA / Production Readiness (finalized after Phase 11).  
4. Confirm no Sev-1/2 regressions; functionality preserved.  
5. Update architecture index if stale.

### Done when

- No Severity-1/2 regressions.  
- Internal regression PASS.  
- Ready to enter Phase 11 (scores not final until pilot).

---

## Phase 11 — Real-World Pilot

**Design / script:** [15-real-world-pilot.md](./15-real-world-pilot.md)

### Work

1. Execute full pilot script on Samsung Galaxy, Google Pixel, iPhone, iPad.  
2. Re-verify push closed-app, offline queue, payments return, no surprise browser exits.  
3. Attach install funnel KPI report ([14](./14-installation-success-funnel.md)).  
4. Confirm Native UX matrix all PASS ([13](./13-native-ux-acceptance-matrix.md)).  
5. Finalize scorecard (≥95 / =100 / ≥95).  
6. Package evidence under `artifacts/phase-11-pilot/`.

### Done when

- Phase 11 verdict PASS (all four devices).  
- A13–A17 true.  
- Package status → **COMPLETE**.
