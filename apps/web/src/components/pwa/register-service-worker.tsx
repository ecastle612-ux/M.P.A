"use client";

import { useEffect } from "react";

export function RegisterServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;
    void navigator.serviceWorker.register("/sw.js").then((registration) => {
      registration.addEventListener("updatefound", () => {
        // Placeholder update hook for future in-app update UX.
        // Intentionally non-intrusive in foundation phase.
      });
    });
  }, []);

  return null;
}
