"use client";

import { useEffect } from "react";
import { captureException } from "../lib/observability";

/**
 * Root error boundary. Catches render/runtime errors that escape nested boundaries and
 * reports them (critical severity) before showing a minimal recovery UI. It replaces the
 * root layout, so it renders its own <html>/<body> and avoids provider/token dependencies.
 */
export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureException(error, {
      module: "web.global-error",
      severity: "critical",
      ...(error.digest ? { digest: error.digest } : {})
    });
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main
          style={{
            display: "flex",
            minHeight: "100vh",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            fontFamily: "system-ui, -apple-system, sans-serif"
          }}
        >
          <div style={{ maxWidth: "28rem" }}>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 600, margin: 0 }}>Something went wrong</h1>
            <p style={{ marginTop: "0.5rem", color: "#555" }}>
              An unexpected error occurred. Please try again.
            </p>
            <button
              type="button"
              onClick={() => reset()}
              style={{ marginTop: "1rem", padding: "0.5rem 1rem", cursor: "pointer" }}
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
