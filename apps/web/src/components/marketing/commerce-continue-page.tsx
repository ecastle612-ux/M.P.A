"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { MarketingChrome, marketingPrimaryCtaClass, marketingSecondaryCtaClass } from "./marketing-chrome";

type StatusPayload = {
  checkpoint: string;
  ready: boolean;
  canAccessModules: boolean;
  ownerEmail: string;
  organizationName: string | null;
  lastError: string | null;
  steps: Array<{ id: number; label: string; done: boolean; current: boolean }>;
  nextPath: string | null;
};

export function CommerceContinuePage({
  sessionId,
  bindToken,
  isAuthenticated = false,
  userEmail = null
}: {
  sessionId: string | null;
  bindToken?: string | null;
  isAuthenticated?: boolean;
  userEmail?: string | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<StatusPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [claimBusy, setClaimBusy] = useState(false);
  const autoClaimStarted = useRef(false);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    async function poll() {
      const res = await fetch(
        `/api/commerce/provision/status?session_id=${encodeURIComponent(sessionId!)}`
      );
      if (!res.ok) {
        if (!cancelled) setError("Provisioning status unavailable. Refresh to retry.");
        return;
      }
      const data = (await res.json()) as StatusPayload;
      if (!cancelled) {
        setError(null);
        setStatus(data);
      }
    }
    void poll();
    const timer = window.setInterval(() => void poll(), 2000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [sessionId]);

  // Authenticated owners auto-claim — no operator step.
  useEffect(() => {
    if (!sessionId || !isAuthenticated || autoClaimStarted.current) return;
    if (
      status?.checkpoint !== "owner_pending" &&
      status?.checkpoint !== "entitled" &&
      status?.checkpoint !== "org_created"
    ) {
      return;
    }
    if (status.ready || status.canAccessModules) return;
    autoClaimStarted.current = true;
    void (async () => {
      setClaimBusy(true);
      const res = await fetch("/api/commerce/provision/claim", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sessionId,
          ...(bindToken ? { bindToken } : {})
        })
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; nextPath?: string };
      setClaimBusy(false);
      if (!res.ok) {
        autoClaimStarted.current = false;
        setError(data.error ?? "Could not claim workspace.");
        return;
      }
      router.push(data.nextPath ?? "/setup");
    })();
  }, [
    sessionId,
    isAuthenticated,
    status?.checkpoint,
    status?.ready,
    status?.canAccessModules,
    bindToken,
    router
  ]);

  async function claim() {
    if (!sessionId) return;
    setClaimBusy(true);
    setError(null);
    const res = await fetch("/api/commerce/provision/claim", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sessionId,
        ...(bindToken ? { bindToken } : {})
      })
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string; nextPath?: string };
    setClaimBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Could not claim workspace.");
      return;
    }
    router.push(data.nextPath ?? "/setup");
  }

  const awaitingClaim =
    status?.checkpoint === "owner_pending" ||
    status?.checkpoint === "entitled" ||
    status?.checkpoint === "org_created";

  return (
    <MarketingChrome isAuthenticated={isAuthenticated} denseNav>
      <main className="mx-auto max-w-3xl space-y-8 px-4 pb-16 pt-10 md:px-6">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
            Automatic provisioning
          </p>
          <h1 className="font-display text-3xl font-semibold">
            {status?.ready ? "Workspace ready" : "Preparing your workspace"}
          </h1>
          <p className="text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
            {status?.ready
              ? "Your organization is provisioned. Continue to Guided Setup, then Mission Control."
              : "Payment secured. We are creating your identity, organization, and product activation automatically."}
          </p>
        </header>

        {status ? (
          <section className="space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-5">
            <p className="text-sm">
              <span className="font-semibold">Checkpoint:</span> {status.checkpoint}
            </p>
            <p className="text-sm">
              <span className="font-semibold">Owner email:</span> {status.ownerEmail}
            </p>
            {status.organizationName ? (
              <p className="text-sm">
                <span className="font-semibold">Organization:</span> {status.organizationName}
              </p>
            ) : null}
            <ul className="space-y-1 text-sm">
              {status.steps.map((step) => (
                <li key={step.id} className="flex gap-2">
                  <span>{step.done ? "✓" : step.current ? "→" : "·"}</span>
                  <span className={step.current ? "font-semibold" : ""}>{step.label}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {error ? (
          <p className="text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}
        {status?.lastError ? (
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            Recoverable detail: {status.lastError}. Safe retries are automatic.
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          {!isAuthenticated ? (
            <Link
              href={
                sessionId
                  ? `/login?mode=sign_up&saas_checkout_session=${encodeURIComponent(sessionId)}${
                      bindToken ? `&bind_token=${encodeURIComponent(bindToken)}` : ""
                    }`
                  : "/login?mode=sign_up"
              }
              className={marketingPrimaryCtaClass}
            >
              Verify email & create password
            </Link>
          ) : awaitingClaim ? (
            <button
              type="button"
              disabled={claimBusy}
              onClick={() => void claim()}
              className={marketingPrimaryCtaClass}
            >
              {claimBusy ? "Claiming…" : "Claim workspace"}
            </button>
          ) : status?.ready || status?.canAccessModules ? (
            <Link href="/setup" className={marketingPrimaryCtaClass}>
              Continue to Guided Setup
            </Link>
          ) : (
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">Provisioning in progress…</p>
          )}
          <Link href="/checkout/success" className={marketingSecondaryCtaClass}>
            Back
          </Link>
        </div>
        {isAuthenticated && userEmail ? (
          <p className="text-xs text-[var(--mpa-color-text-muted)]">Signed in as {userEmail}</p>
        ) : null}
      </main>
    </MarketingChrome>
  );
}
