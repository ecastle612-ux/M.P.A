"use client";

import { useState } from "react";
import { Button } from "@mpa/ui";

export function RetryProvisioningButton({ checkoutSessionId }: { checkoutSessionId: string }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function retry() {
    setBusy(true);
    setMessage(null);
    const res = await fetch("/api/admin/commerce/provisioning/retry", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sessionId: checkoutSessionId })
    });
    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      checkpoint?: string;
    };
    setBusy(false);
    if (!res.ok) {
      setMessage(data.error ?? "retry_failed");
      return;
    }
    setMessage(`Resumed → ${data.checkpoint ?? "ok"}`);
    window.location.reload();
  }

  return (
    <div className="space-y-1">
      <Button type="button" variant="secondary" size="sm" disabled={busy} onClick={() => void retry()}>
        {busy ? "Retrying…" : "Retry / resume"}
      </Button>
      {message ? <p className="text-xs text-[var(--mpa-color-text-muted)]">{message}</p> : null}
    </div>
  );
}
