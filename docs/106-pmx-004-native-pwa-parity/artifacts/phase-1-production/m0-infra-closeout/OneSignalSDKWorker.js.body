/* PMX-004 Phase 1 — Canonical production service worker (scope "/").
 *
 * Single registration target for:
 *   1) OneSignal Web Push (CDN SW)
 *   2) M.P.A. offline / cache / update / sync foundation (sw-offline.js)
 *
 * Do NOT register /sw.js (or any second root-scope worker) alongside this file —
 * competing script URLs abort pushManager.subscribe (CP-003).
 *
 * OneSignal dashboard Typical site: path `/`, worker `OneSignalSDKWorker.js`, scope `/`.
 */
importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");
importScripts("/sw-offline.js");
