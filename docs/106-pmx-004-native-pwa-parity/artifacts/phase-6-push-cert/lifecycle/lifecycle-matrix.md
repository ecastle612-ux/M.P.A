# Phase 6 — Notification lifecycle verification

**Package:** PMX-004 Phase 6  
**Date:** 2026-07-26  

## Method

| Layer | Evidence |
|-------|----------|
| On-device closed / background / permission / tap | Phase 1 Owner Checklist **T4 Push PASS** on Galaxy · Pixel · iPhone |
| Code paths | Enrollment (`client-push.ts`) · unified SW (`OneSignalSDKWorker.js` + `sw-offline.js` does not own push/click) · OneSignal CDN handles `push` / `notificationclick` |
| Prod SW probe (2026-07-26) | Live `/OneSignalSDKWorker.js` HTTP 200 · `Service-Worker-Allowed: /` · `Cache-Control: no-cache, no-store, must-revalidate` · body imports OneSignal CDN + `/sw-offline.js` |

## Lifecycle cells

| State | Android (Galaxy/Pixel) | iPhone installed PWA | Notes |
|-------|------------------------|----------------------|-------|
| Permission / enroll | PASS (T4) | PASS (T4 · OS constraints) | API-001A path |
| Foreground | PASS (T4 as applicable) | PASS (T4 as applicable) | OS may coalesce |
| Background | PASS (T4) | PASS within Apple web-push capability | |
| Closed-app / cold | PASS (T4 delivery + tap) | PASS within Apple capability | |
| Notification click / deep link | PASS (T4 tap routing) | PASS (T4) | Absolute `url` via provider |
| Dismissal | N/A OS-owned | N/A OS-owned | No M.P.A.-only dismiss path required |
| Wi‑Fi | PASS (attested devices) | PASS | |
| LTE / poor network / battery saver | Accepted / N/A where not separately logged | Accepted / N/A | Non-blocking Product Accept — OS cells not re-instrumented |

## SW certification

| Check | Result |
|-------|--------|
| Single canonical worker registration | ✅ `/OneSignalSDKWorker.js` only (`register-service-worker.tsx` · `client-push.ts`) |
| Offline module does not steal push | ✅ `sw-offline.js` documents no `push` / `notificationclick` ownership |
| Provider | ✅ OneSignal primary (ADR-017) — no swap |
| Phase 1–5 preserved | ✅ No offline-queue / IA / schema changes in Phase 6 |
