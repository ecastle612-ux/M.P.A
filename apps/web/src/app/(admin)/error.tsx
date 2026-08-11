"use client";

import { useEffect } from "react";
import { Button, Card } from "@mpa/ui";

export default function AdminError({
  error,
  reset
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    void fetch("/api/observability/client-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: error.message,
        name: error.name,
        stack: error.stack,
        route: typeof window !== "undefined" ? window.location.pathname : "admin-error"
      })
    }).catch(() => {
      /* fail-open */
    });
  }, [error]);

  return (
    <main className="p-6">
      <Card className="max-w-xl">
        <h2 className="font-display text-xl font-semibold text-[var(--mpa-color-text-primary)]">
          Owner Operations could not load
        </h2>
        <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">
          {error.message || "Retry, or open System Health if the issue continues."}
        </p>
        <Button className="mt-4" onClick={reset}>
          Retry
        </Button>
      </Card>
    </main>
  );
}
