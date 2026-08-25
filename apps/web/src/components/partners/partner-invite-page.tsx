"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, buttonClassName } from "@mpa/ui";

type InviteView = {
  state: "valid" | "expired" | "unavailable";
  message: string;
  companyName: string | null;
  partnerTypeLabel: string | null;
  expiresAt: string | null;
  benefits: string[];
  error?: string;
};

export function PartnerInvitePage({
  token,
  isAuthenticated,
  userEmail
}: {
  token: string;
  isAuthenticated: boolean;
  userEmail: string | null;
}) {
  const router = useRouter();
  const [view, setView] = useState<InviteView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      const response = await fetch(`/api/partners/invite/${encodeURIComponent(token)}`, {
        signal: controller.signal
      });
      const payload = (await response.json()) as InviteView;
      if (controller.signal.aborted) return;
      setView(payload);
    })().catch(() => {
      if (!controller.signal.aborted) {
        setView({
          state: "unavailable",
          message: "This partner invitation is not available.",
          companyName: null,
          partnerTypeLabel: null,
          expiresAt: null,
          benefits: []
        });
      }
    });
    return () => controller.abort();
  }, [token]);

  const loginHref = `/login?next=${encodeURIComponent(`/partner/invite/${token}`)}`;
  const signupHref = `/login?mode=sign_up&next=${encodeURIComponent(`/partner/invite/${token}`)}`;

  async function accept() {
    setLoading(true);
    setError(null);
    const response = await fetch(`/api/partners/invite/${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({})
    });
    const payload = (await response.json()) as { error?: string; nextPath?: string };
    setLoading(false);
    if (!response.ok) {
      setError(payload.error ?? "This partner invitation is not available.");
      return;
    }
    router.replace(payload.nextPath ?? "/partner");
  }

  return (
    <main className="mx-auto w-full max-w-xl space-y-5 px-4 py-10">
      <h1 className="font-display text-3xl font-semibold">You're invited to M.P.A. Partners</h1>
      {!view ? <p className="text-sm text-[var(--mpa-color-text-secondary)]">Checking invitation…</p> : null}
      {view?.state === "expired" ? (
        <section className="space-y-3" aria-live="polite">
          <p className="text-sm" role="status">
            {view.message}
          </p>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            Ask M.P.A. to send a new invitation. For security, expired links do not show company details.
          </p>
        </section>
      ) : null}
      {view?.state === "unavailable" ? (
        <p className="text-sm" role="status">
          {view.message}
        </p>
      ) : null}
      {view?.state === "valid" ? (
        <section className="space-y-4">
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            {view.companyName} · {view.partnerTypeLabel}
          </p>
          {view.expiresAt ? (
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">
              This invitation expires on {new Date(view.expiresAt).toUTCString()}.
            </p>
          ) : null}
          <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--mpa-color-text-secondary)]">
            {view.benefits.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          {isAuthenticated ? (
            <div className="space-y-3">
              <p className="text-sm text-[var(--mpa-color-text-secondary)]">
                Signed in as {userEmail ?? "your account"}. Accept to connect this partner membership.
              </p>
              <Button type="button" disabled={loading} onClick={() => void accept()}>
                Accept Invitation
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link className={buttonClassName()} href={loginHref}>
                Sign in to accept
              </Link>
              <Link className={buttonClassName({ variant: "secondary" })} href={signupHref}>
                Create account
              </Link>
            </div>
          )}
        </section>
      ) : null}
      {error ? (
        <p className="text-sm text-[var(--mpa-color-text-danger,#B42318)]" role="alert">
          {error}
        </p>
      ) : null}
    </main>
  );
}
