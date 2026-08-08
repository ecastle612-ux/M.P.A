"use client";

import { useState } from "react";

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
      <button
        type="button"
        disabled={busy}
        onClick={() => void run()}
        className="rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-subtle,#F7F8FA)] px-3 py-1.5 text-xs font-semibold"
      >
        {busy ? "Enforcing…" : "Enforce grace expirations"}
      </button>
      {message ? <p className="text-xs text-[var(--mpa-color-text-muted)]">{message}</p> : null}
    </div>
  );
}
