/**
 * PMX-004 Phase 1 — client helpers for the unified service worker message protocol.
 * Safe no-ops when SW is unavailable.
 */

export type MpaSwStatusMessage = {
  type: "MPA_STATUS";
  version: string;
  offlineReady: boolean;
  pending: number;
};

export type MpaSwWaitingMessage = {
  type: "MPA_WAITING";
  version: string;
};

export type MpaSwIncomingMessage =
  | MpaSwStatusMessage
  | MpaSwWaitingMessage
  | { type: "MPA_SYNC_REQUEST"; tag?: string };

export function postToServiceWorker(message: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;
  const worker = navigator.serviceWorker.controller;
  if (!worker) return;
  worker.postMessage(message);
}

/** Clear runtime / user-sensitive caches on logout (multi-user shared device safety). */
export function clearServiceWorkerUserCaches(): void {
  postToServiceWorker({ type: "MPA_CLEAR_USER_CACHES" });
}

export function requestServiceWorkerSkipWaiting(): void {
  postToServiceWorker({ type: "MPA_SKIP_WAITING" });
  // Also message any waiting worker directly when controller is still old.
  void navigator.serviceWorker.ready.then((registration) => {
    registration.waiting?.postMessage({ type: "MPA_SKIP_WAITING" });
  });
}
