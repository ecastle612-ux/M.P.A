"use client";

import { useCallback, useEffect, useState } from "react";
import {
  requestServiceWorkerSkipWaiting,
  type MpaSwIncomingMessage
} from "../../lib/pwa/sw-client";

const CANONICAL_WORKER_URL = "/OneSignalSDKWorker.js";

/**
 * PMX-004 Phase 1 — single production registration for the unified worker.
 *
 * Always registers `/OneSignalSDKWorker.js` (OneSignal + offline). Never registers `/sw.js`.
 * Same script URL as OneSignal SDK init — idempotent; does not recreate CP-003 dual-worker race.
 */
export function RegisterServiceWorker() {
  const [updateVersion, setUpdateVersion] = useState<string | null>(null);

  const onReload = useCallback(() => {
    requestServiceWorkerSkipWaiting();
    // Reload after the new worker claims (controllerchange) or shortly after.
    const reload = () => window.location.reload();
    navigator.serviceWorker.addEventListener("controllerchange", reload, { once: true });
    window.setTimeout(reload, 800);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    let cancelled = false;

    function onMessage(event: MessageEvent<MpaSwIncomingMessage>) {
      const data = event.data;
      if (!data || typeof data !== "object") return;
      if (data.type === "MPA_WAITING" && data.version) {
        setUpdateVersion(data.version);
      }
    }

    navigator.serviceWorker.addEventListener("message", onMessage);

    void (async () => {
      try {
        const registration = await navigator.serviceWorker.register(CANONICAL_WORKER_URL, {
          scope: "/"
        });

        if (cancelled) return;

        if (registration.waiting) {
          setUpdateVersion("update");
        }

        registration.addEventListener("updatefound", () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (installing.state === "installed" && navigator.serviceWorker.controller) {
              setUpdateVersion("update");
            }
          });
        });
      } catch {
        // Registration failure must not break the app shell.
      }
    })();

    return () => {
      cancelled = true;
      navigator.serviceWorker.removeEventListener("message", onMessage);
    };
  }, []);

  if (!updateVersion) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-0 z-[80] border-t border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
    >
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
        <p className="text-sm text-[var(--mpa-color-text-primary)]">
          An update is available. Reload to get the latest version.
        </p>
        <button
          type="button"
          onClick={onReload}
          className="min-h-11 shrink-0 rounded-[var(--mpa-radius-md)] bg-[var(--mpa-color-brand-primary)] px-4 text-sm font-medium text-[var(--mpa-color-text-on-brand)]"
        >
          Reload
        </button>
      </div>
    </div>
  );
}
