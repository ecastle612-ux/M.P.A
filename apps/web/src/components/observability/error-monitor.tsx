"use client";

import { useEffect } from "react";
import { captureException } from "../../lib/observability";

/**
 * Captures uncaught browser runtime errors and unhandled promise rejections into the
 * observability sink. Mounted once near the app root; fail-open and side-effect only.
 */
export function ErrorMonitor() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const onError = (event: ErrorEvent) => {
      captureException(event.error ?? event.message, { module: "web.window.error" });
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      captureException(event.reason, { module: "web.unhandledrejection" });
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
