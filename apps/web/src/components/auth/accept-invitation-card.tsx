"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card } from "@mpa/ui/auth";

type Preview = {
  organizationName: string;
  username: string | null;
  email: string;
  status: string;
  expired: boolean;
};

export function AcceptInvitationCard({ token }: { token: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const response = await fetch(`/api/invitations/${token}/accept`);
      const payload = (await response.json()) as { invitation?: Preview; error?: string };
      if (cancelled) return;
      if (!response.ok || !payload.invitation) {
        setError(payload.error ?? "Invitation not found.");
        return;
      }
      setPreview(payload.invitation);
    })().catch(() => {
      if (!cancelled) setError("Could not load invitation.");
    });
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function acceptInvitation() {
    setError(null);
    setNotice(null);
    setLoading(true);
    const response = await fetch(`/api/invitations/${token}/accept`, { method: "POST" });
    const payload = (await response.json()) as {
      error?: string;
      organizationId?: string;
      requiresFirstLogin?: boolean;
    };
    setLoading(false);

    if (response.status === 401) {
      const next = encodeURIComponent(`/accept-invitation/${token}`);
      router.replace(`/login?next=${next}`);
      return;
    }

    if (!response.ok) {
      if (payload.requiresFirstLogin) {
        router.replace("/first-login");
        return;
      }
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
      {preview ? (
        <div className="space-y-1 text-sm text-[var(--mpa-color-text-secondary)]">
          <p>
            Join <span className="text-[var(--mpa-color-text-primary)]">{preview.organizationName}</span>
          </p>
          {preview.username ? (
            <p>
              Sign in with username{" "}
              <span className="font-medium text-[var(--mpa-color-text-primary)]">{preview.username}</span>{" "}
              and the temporary password from your email, then accept.
            </p>
          ) : (
            <p>Sign in with your existing account, then accept to activate membership.</p>
          )}
          {preview.expired || preview.status === "expired" ? (
            <p className="text-[var(--mpa-color-feedback-error)]">This invitation has expired.</p>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">Loading invitation…</p>
      )}
      {error ? <p className="text-sm text-[var(--mpa-color-feedback-error)]">{error}</p> : null}
      {notice ? <p className="text-sm text-[var(--mpa-color-brand-primary)]">{notice}</p> : null}
      <Button
        disabled={
          loading || !preview || preview.expired || preview.status === "expired" || preview.status === "revoked"
        }
        onClick={acceptInvitation}
      >
        {loading ? "Accepting..." : "Accept invitation"}
      </Button>
    </Card>
  );
}
