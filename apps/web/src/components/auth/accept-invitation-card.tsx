"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card } from "@mpa/ui";

export function AcceptInvitationCard({ token }: { token: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function acceptInvitation() {
    setError(null);
    setNotice(null);
    setLoading(true);
    const response = await fetch(`/api/invitations/${token}/accept`, { method: "POST" });
    const payload = (await response.json()) as { error?: string; organizationId?: string };
    setLoading(false);

    if (!response.ok) {
      setError(payload.error ?? "Could not accept invitation.");
      return;
    }

    setNotice("Invitation accepted. Redirecting...");
    window.setTimeout(() => {
      router.replace("/dashboard");
    }, 700);
  }

  return (
    <Card className="w-full max-w-md space-y-3">
      <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
        Accept organization invitation
      </h1>
      <p className="text-sm text-[var(--mpa-color-text-secondary)]">
        Confirm to join this organization and activate your membership context.
      </p>
      {error ? <p className="text-sm text-[var(--mpa-color-feedback-error)]">{error}</p> : null}
      {notice ? <p className="text-sm text-[var(--mpa-color-brand-primary)]">{notice}</p> : null}
      <Button disabled={loading} onClick={acceptInvitation}>
        {loading ? "Accepting..." : "Accept invitation"}
      </Button>
    </Card>
  );
}
