/**
 * PMX-004 Phase 2 — consume Phase 1 MPA_STATUS.offlineReady (no SW changes).
 */

import { postToServiceWorker, type MpaSwStatusMessage } from "./sw-client";

export function subscribeOfflineReady(onReady: (ready: boolean) => void): () => void {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return () => undefined;
  }

  const handleMessage = (event: MessageEvent) => {
    const data = event.data as MpaSwStatusMessage | undefined;
    if (data?.type === "MPA_STATUS") {
      onReady(Boolean(data.offlineReady));
    }
  };

  navigator.serviceWorker.addEventListener("message", handleMessage);
  postToServiceWorker({ type: "MPA_GET_STATUS" });

  void navigator.serviceWorker.ready.then(() => {
    postToServiceWorker({ type: "MPA_GET_STATUS" });
  });

  return () => {
    navigator.serviceWorker.removeEventListener("message", handleMessage);
  };
}
