# 08 — Testing Strategy

**Package:** PMX-004  
**Status:** Draft — Ready for Approval  

---

## 1. Test layers

| Layer | Tooling | Purpose |
| --- | --- | --- |
| Unit | Vitest / existing unit runner | Outbox idempotency, platform detect, URL helpers |
| Component | Existing component tests | Onboarding sheet states; SyncStatus |
| E2E | Playwright (QA-001) | Install banner visibility (mocked BIP); standalone query; document viewer; outbox online transition |
| Manual device | Physical Android + iPhone | Push closed-app, A2HS, safe areas, Stripe return |
| Lighthouse CI / lab | Chrome mobile emulation + real device | Perf / a11y / BP / PWA |
| Regression | Phase 10 checklist | Full product smoke |

---

## 2. Device matrix (required for PASS)

| Device class | Browsers | Must test |
| --- | --- | --- |
| Android mid-tier | Chrome | Install, push closed, offline, WO, docs, Stripe |
| Android OEM | Samsung Internet | Install/push quirks |
| Android Pixel | Chrome | Push + battery saver |
| iPhone (recent iOS) | Safari A2HS | A2HS, push installed, safe area, docs, camera capture |
| iPad | Safari A2HS | Shell + docs |
| Desktop | Chrome, Edge | Non-blocking onboarding; push where supported |

**Phase 11 mandatory devices** (see [15-real-world-pilot.md](./15-real-world-pilot.md)): Samsung Galaxy, Google Pixel, iPhone, iPad — full pilot script; no workflow may fail.

Firefox: smoke only; not a PASS blocker.

---

## 2b. Native UX matrix & install funnel

| Artifact | When |
| --- | --- |
| [13 Native UX Acceptance Matrix](./13-native-ux-acceptance-matrix.md) | Phase 5 first pass; Phase 11 final PASS all screens |
| [14 Installation Success Funnel](./14-installation-success-funnel.md) | Phase 2 instrumentation; KPI report before COMPLETE |

---

## 3. Phase 1 test protocol (mandatory)

1. Unregister all SWs; clear site data.  
2. Load prod/preview with OneSignal configured.  
3. Confirm single worker: `OneSignalSDKWorker.js`.  
4. Enroll push; verify DB device + OneSignal player.  
5. Send Master Admin test notify; receive with app backgrounded/closed.  
6. Enable airplane mode; navigate; see offline fallback.  
7. Disable airplane; app recovers.  
8. Deploy new build (or bump cache); see update prompt; reload; new asset hash loads.  
9. Logout; login other user; confirm no private cached HTML leak.

---

## 4. Standalone parity protocol

For each critical workflow (maintenance, messages, documents, reports, payments, e-sign):

| Step | Browser tab | Installed standalone |
| --- | --- | --- |
| Start | Record | Record |
| Complete happy path | Pass/Fail | Pass/Fail |
| External leave? | Y/N | Y/N + return OK? |

Failures that only appear in standalone are Phase 4 blockers.

---

## 5. Offline outbox protocol (Phase 7)

1. Online: create allowlisted item — works as today.  
2. Offline: create allowlisted item — appears pending in SyncStatus.  
3. Online: auto-sync — server row exists once.  
4. Offline: create; kill tab; reopen online — sync resumes.  
5. Offline: non-allowlisted action — clear requires-connection message; no fake success.  
6. Conflict/fail: item remains; user can retry/discard.

---

## 6. Automation additions (post-Approve)

| Spec idea | Notes |
| --- | --- |
| `pwa-sw-registration.spec.ts` | Assert single controller scriptURL |
| `pwa-offline-fallback.spec.ts` | Route offline via CDP / context.setOffline |
| `pwa-onboarding.spec.ts` | Completion persistence |
| `pwa-outbox.spec.ts` | IndexedDB queue + flush mock |

Do not claim device push from Playwright alone — physical evidence still required.

---

## 7. Performance / Lighthouse protocol

1. Cold load authenticated dashboard (mid-tier throttling).  
2. Soft navigate WO list → detail.  
3. Property media-heavy page for LCP.  
4. Record before/after in optimization log (EP-019 style).  
5. Fail PR if a11y score drops without waiver.

---

## 8. Sign-off artifacts

Store under `docs/106-pmx-004-native-pwa-parity/artifacts/`:

- `phase-1-sw/`  
- `phase-6-push/`  
- `phase-10-regression/`  
- `lighthouse/`  

Redact subscription ids / PII in screenshots when possible; never commit API keys.
