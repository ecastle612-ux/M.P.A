"use client";

import { useEffect } from "react";

export function RegisterServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    // OneSignal owns root scope `/` via OneSignalSDKWorker.js when configured.
    // Registering a second root worker races pushManager.subscribe and leaves players=0.
    if (process.env["NEXT_PUBLIC_ONESIGNAL_APP_ID"]) return;

    void navigator.serviceWorker.register("/sw.js").then((registration) => {
      registration.addEventListener("updatefound", () => {
        // Placeholder update hook for future in-app update UX.
      });
    });
  }, []);

  return null;
}
