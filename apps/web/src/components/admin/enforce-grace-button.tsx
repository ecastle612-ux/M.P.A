"use client";

import { useState } from "react";
import { Button } from "@mpa/ui";

export function EnforceGraceButton() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setMessage(null);
    const res = await fetch("/api/admin/commerce/lifecycle/enforce-grace", { method: "POST" });
    const data = (await res.json().catch(() => ({}))) as { error?: string; expired?: number };
    setBusy(false);
    if (!res.ok) {
      setMessage(data.error ?? "failed");
      return;
    }
    setMessage(`Expired ${data.expired ?? 0} subscription(s)`);
    window.location.reload();
  }

  return (
    <div className="space-y-1">
      <Button type="button" variant="secondary" size="sm" disabled={busy} onClick={() => void run()}>
        {busy ? "Enforcing…" : "Enforce grace expirations"}
      </Button>
      {message ? <p className="text-xs text-[var(--mpa-color-text-muted)]">{message}</p> : null}
    </div>
  );
}
