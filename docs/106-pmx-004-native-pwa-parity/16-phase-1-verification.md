# 16 — Phase 1 Verification & Implementation Report

**Package:** PMX-004  
**Phase:** 1 — Unified Service Worker  
**Date:** 2026-07-23  
**Status:** Implementation complete · **Awaiting Phase 2 authorization**  
**Verdict:** **CONDITIONAL PASS** (code) — Phase 2 remains locked until [17-phase-1-production-validation.md](./17-phase-1-production-validation.md) records **Final PASS** on real devices after deploy.

---

## 1. Files modified

| File | Change |
| --- | --- |
| `apps/web/public/sw-offline.js` | **Added** — offline/cache/update/sync-foundation module |
| `apps/web/public/OneSignalSDKWorker.js` | Composes OneSignal CDN SW + `/sw-offline.js` |
| `apps/web/public/sw.js` | Deprecated stub → `importScripts("/sw-offline.js")` only; never registered |
| `apps/web/public/push/onesignal/OneSignalSDKWorker.js` | Mirrors canonical unified worker (legacy path) |
| `apps/web/src/components/pwa/register-service-worker.tsx` | Registers **only** `/OneSignalSDKWorker.js`; update Reload banner |
| `apps/web/src/lib/pwa/sw-client.ts` | **Added** — message helpers (`SKIP_WAITING`, `CLEAR_USER_CACHES`) |
| `apps/web/src/lib/notifications/client-push.ts` | Comment corrected (offline lives in unified worker) |
| `apps/web/src/components/shell/profile-menu.tsx` | Clears SW user caches on logout |
| `apps/web/next.config.ts` | `Cache-Control: no-store` + `Service-Worker-Allowed: /` for SW scripts |
| `docs/106-pmx-004-native-pwa-parity/16-phase-1-verification.md` | This report |

**Not modified:** Auth, Supabase clients, Stripe, messaging/maintenance/documents business logic, manifest.ts, OneSignal provider/server paths.

---

## 2. Architecture before

```
Production + OneSignal
  └─ OneSignalSDKWorker.js  (push only)
  └─ /sw.js NOT registered  → offline DISABLED

Production − OneSignal
  └─ /sw.js (mpa-foundation-v4) → offline only, no push
```

Dual root-scope script URLs were forbidden after CP-003 (subscribe race).

---

## 3. Architecture after

```
Production (always)
  └─ ONE registration: /OneSignalSDKWorker.js (scope "/")
        ├─ importScripts(OneSignal CDN SW)     → push
        └─ importScripts(/sw-offline.js)       → offline + update + sync hook

Client
  └─ RegisterServiceWorker → register("/OneSignalSDKWorker.js") only
  └─ OneSignal.init → same path/scope (idempotent; no second script URL)
  └─ Update banner → MPA_SKIP_WAITING → reload
  └─ Logout → MPA_CLEAR_USER_CACHES
```

| Concern | Implementation |
| --- | --- |
| Offline asset cache | Network-first static + runtime cache `mpa-runtime-v1` (max 64) |
| Shell precache | `mpa-shell-v1`: `/`, `/offline.html`, manifest, icons 192/512 |
| API cache | **None** (Phase 1 design — bypass `/api/*`) |
| Offline fallback | `/offline.html` on navigation failure |
| Update detection | Waiting worker → banner → Reload |
| Cache version mgmt | Activate deletes obsolete `mpa-*` caches |
| Background Sync | Foundation: `sync` tag `mpa-outbox-sync` + client wake (Phase 7 fills outbox) |

---

## 4. Regression results

| Area | Method | Result |
| --- | --- | --- |
| Typecheck (changed TS) | IDE lints on touched files | PASS (no new errors) |
| Full `tsc` @mpa/web | Ran | Pre-existing fail: missing `tenant-home-skeleton` (unrelated) |
| Authentication | Code review — no auth path changes except logout cache clear | PASS (static) |
| Supabase | Untouched | PASS (static) |
| Messaging / Maintenance / Documents / Photos / Reports / Stripe | Untouched business logic | PASS (static) |
| Navigation / Manifest / Installability | Manifest unchanged; SW registration path aligned to installable worker | PASS (static) |
| OneSignal init path | Still `OneSignalSDKWorker.js` + scope `/` | PASS (static) |
| Duplicate registration | Only canonical URL registered | PASS (static) |
| Device push enroll + offline airplane | Requires production/preview deploy | **PENDING** |
| Lighthouse PWA | Requires deployed URL | **PENDING** |

---

## 5. Remaining risks

| Risk | Mitigation / next step |
| --- | --- |
| importScripts order / listener clash with OneSignal | OneSignal first (approved); validate on real device after deploy |
| First paint registers SW before OneSignal.init | Same script URL — should be safe; watch enrollment in MA diagnostics |
| HTML navigations briefly in runtime cache | Cleared on logout; no `/api` cache |
| Users stuck on old `/sw.js` controller | Next visit registers canonical URL (replaces scope); deprecated stub still offline-capable |
| Device validation not yet run | **Block Phase 2** until CP-003-style checklist on prod/preview |

---

## 6. Acceptance criteria (Phase 1)

| Criterion | Result |
| --- | --- |
| One production SW responsible for push + offline | **PASS** (code) |
| Compatible with CP-003 / OneSignal root worker | **PASS** (composition strategy) |
| No duplicate root-scope registrations | **PASS** (code) |
| Offline page available when OneSignal configured | **PASS** (code path) · **PENDING** device proof |
| Push registration still works | **PENDING** device proof after deploy |
| SW installs / activates | **PASS** (code) · **PENDING** device proof |
| Existing users upgrade safely | **PASS** (design: same scope, new script URL replaces) · **PENDING** field confirm |
| Cache migration (delete old `mpa-*`) | **PASS** (activate handler) |
| Update detection UX | **PASS** (Reload banner) |
| No console errors from dual SW | **PENDING** device |
| No Lighthouse PWA regression | **PENDING** post-deploy |
| Auth / Supabase / Stripe / routes / manifest preserved | **PASS** (static) |

**Phase 1 gate for Phase 2:** After deploy, run [08-testing-strategy.md](./08-testing-strategy.md) §3 Phase 1 protocol. Record evidence under `artifacts/phase-1-sw/`. Then request Phase 2 authorization.

---

## 7. Native Experience impact

| Before | After (expected) |
| --- | --- |
| Offline dead when push on | Offline shell restored alongside push |
| No update UX | Reload banner when new SW waiting |
| Baseline Native ~42 | Modest uplift (offline confidence); still far from ≥95 |

Estimated Phase 1 contribution: **+4 to +8** Native Experience (offline + update), pending device confirm.

---

## 8. PWA Readiness impact

| Before | After (expected) |
| --- | --- |
| Split SW / offline gap | Unified installable worker with offline fallback |
| Baseline PWA ~58 | Material step toward 100 (still need install UX, meta, cert in later phases) |

Estimated Phase 1 contribution: **+10 to +15** PWA Readiness when device offline+push both green.

---

## 9. Production Readiness impact

| Before | After |
| --- | --- |
| Known prod tradeoff (push XOR offline) | Tradeoff removed in code |
| Baseline Production ~48 | Slightly improved once device checklist PASS |

**Do not raise Production Readiness to ≥95 on Phase 1 alone.**

---

## 10. Stop

Phase 1 **implementation** is complete. Phase 1 **production validation** is tracked in [17-phase-1-production-validation.md](./17-phase-1-production-validation.md).

**Phase 2 is not started and is not authorized** until:

1. Deploy containing Phase 1 SW files  
2. Real-device matrix in doc 17 → Final PASS  
3. Explicit `AUTHORIZE PMX-004 PHASE 2`
