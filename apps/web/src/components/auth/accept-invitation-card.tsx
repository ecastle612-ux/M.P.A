"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card } from "@mpa/ui";
import { createAuthClient } from "../../lib/auth/client";

type InvitationPreview = {
  email: string;
  status: string;
  expiresAt: string;
  roleLabel: string;
  organizationName: string;
  expired: boolean;
};

export function AcceptInvitationCard({ token }: { token: string }) {
  const router = useRouter();
  const supabase = createAuthClient();
  const [preview, setPreview] = useState<InvitationPreview | null>(null);
  const [signedInEmail, setSignedInEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [{ data }, previewResponse] = await Promise.all([
        supabase.auth.getUser(),
        fetch(`/api/invitations/${token}`)
      ]);
      if (cancelled) {
        return;
      }
      setSignedInEmail(data.user?.email ?? null);
      if (previewResponse.ok) {
        const payload = (await previewResponse.json()) as { invitation?: InvitationPreview };
        setPreview(payload.invitation ?? null);
      } else {
        setError("Invitation not found or no longer valid.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase.auth, token]);

  async function acceptInvitation() {
    setError(null);
    setNotice(null);
    setLoading(true);
    const response = await fetch(`/api/invitations/${token}/accept`, { method: "POST" });
    const payload = (await response.json()) as {
      error?: string;
      homeHref?: string;
      roleLabel?: string;
    };
    setLoading(false);

    if (!response.ok) {
      setError(payload.error ?? "Could not accept invitation.");
      return;
    }

    setNotice(`You're in as ${payload.roleLabel ?? "a teammate"}. Opening your workspace…`);
    window.setTimeout(() => {
      router.replace(payload.homeHref ?? "/dashboard");
      router.refresh();
    }, 700);
  }

  const loginHref = `/login?next=${encodeURIComponent(`/accept-invitation/${token}`)}`;
  const emailMismatch =
    signedInEmail && preview && signedInEmail.toLowerCase() !== preview.email.toLowerCase();

  return (
    <Card className="w-full max-w-md space-y-3">
      <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
        Accept invitation
      </h1>
      {preview ? (
        <div className="space-y-1 text-sm text-[var(--mpa-color-text-secondary)]">
          <p>
            Join <span className="font-medium text-[var(--mpa-color-text-primary)]">{preview.organizationName}</span>{" "}
            as <span className="font-medium text-[var(--mpa-color-text-primary)]">{preview.roleLabel}</span>.
          </p>
          <p>Invited email: {preview.email}</p>
          {preview.expired || preview.status !== "pending" ? (
            <p className="text-[#C0392B]">This invitation is no longer available.</p>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Confirm to join this organization and open your workspace.
        </p>
      )}

      {!signedInEmail ? (
        <div className="space-y-2">
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            Sign in or create an account with the invited email, then return here to accept.
          </p>
          <Button type="button" onClick={() => router.push(loginHref)}>
            Sign in to accept
          </Button>
          <p className="text-xs text-[var(--mpa-color-text-secondary)]">
            <Link className="underline" href={loginHref}>
              {loginHref}
            </Link>
          </p>
        </div>
      ) : null}

      {emailMismatch ? (
        <p className="text-sm text-[#C0392B]">
          You are signed in as {signedInEmail}. Sign in as {preview?.email} to accept.
        </p>
      ) : null}

      {error ? <p className="text-sm text-[#C0392B]">{error}</p> : null}
      {notice ? <p className="text-sm text-[#0F6B56]">{notice}</p> : null}

      {signedInEmail && !emailMismatch && preview && !preview.expired && preview.status === "pending" ? (
        <Button disabled={loading} onClick={() => void acceptInvitation()}>
          {loading ? "Accepting…" : "Accept invitation"}
        </Button>
      ) : null}
    </Card>
  );
}
