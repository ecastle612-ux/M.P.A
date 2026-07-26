"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@mpa/ui";

export function PmRunDueButton() {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onRun() {
    setRunning(true);
    setMessage(null);
    try {
      const response = await fetch("/api/facility/pm/run", { method: "POST" });
      const payload = (await response.json().catch(() => null)) as {
        result?: { materialized?: number; skipped?: number; errors?: unknown[] };
        error?: string;
      } | null;
      if (!response.ok) throw new Error(payload?.error ?? "Run failed");
      const materialized = payload?.result?.materialized ?? 0;
      const skipped = payload?.result?.skipped ?? 0;
      setMessage(`Materialized ${materialized}, skipped ${skipped}.`);
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Run failed");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant="secondary" disabled={running} onClick={() => void onRun()}>
        {running ? "Running…" : "Run due schedules now"}
      </Button>
      {message ? <p className="text-sm text-[var(--mpa-color-text-secondary)]">{message}</p> : null}
    </div>
  );
}
