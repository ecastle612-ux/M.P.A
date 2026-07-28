"use client";

import { useState } from "react";
import { Button, Card } from "@mpa/ui/auth";

export function VerifyContactPendingCard() {
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function resend() {
    setLoading(true);
    setError(null);
    setNotice(null);
    const response = await fetch("/api/contact-verification/resend", { method: "POST" });
    const payload = (await response.json()) as { error?: string; sent?: boolean };
    setLoading(false);
    if (!response.ok) {
      setError(payload.error ?? "Could not resend verification email.");
      return;
    }
    setNotice(payload.sent ? "Verification email sent." : "Contact email already verified.");
  }

  return (
    <Card className="w-full max-w-md space-y-3">
      <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
        Verify your contact email
      </h1>
      <p className="text-sm text-[var(--mpa-color-text-secondary)]">
        We sent a verification link to your contact email. This does not change your username sign-in.
        Open the link to continue.
      </p>
      {error ? <p className="text-sm text-[var(--mpa-color-feedback-error)]">{error}</p> : null}
      {notice ? <p className="text-sm text-[var(--mpa-color-brand-primary)]">{notice}</p> : null}
      <Button disabled={loading} onClick={resend}>
        {loading ? "Sending…" : "Resend verification email"}
      </Button>
    </Card>
  );
}
