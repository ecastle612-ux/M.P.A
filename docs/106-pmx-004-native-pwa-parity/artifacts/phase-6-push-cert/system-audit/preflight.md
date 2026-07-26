# Phase 6 — System audit (secret-free)

**Date:** 2026-07-26  

## Production SW probe

| Check | Result |
|-------|--------|
| URL | `https://www.my-property-assistant.com/OneSignalSDKWorker.js` |
| HTTP | 200 |
| `Service-Worker-Allowed` | `/` |
| `Cache-Control` | `no-cache, no-store, must-revalidate` |
| Body | Phase 1 header · imports OneSignal CDN SW + `/sw-offline.js` |
| Secrets in response | None |

## Automated tests (this session)

| Suite | Result |
|-------|--------|
| `deep-links.test.ts` | ✅ 5 PASS |
| `onesignal-provider.test.ts` (incl. absolute url) | ✅ (run with suite) |

## Provider

| Item | Status |
|------|--------|
| OneSignal primary | ✅ Preserved (ADR-017) |
| VAPID swap | ❌ Not performed |

## Out of scope repairs

No offline outbox · no IA · no schema · no Phases 7–11.
