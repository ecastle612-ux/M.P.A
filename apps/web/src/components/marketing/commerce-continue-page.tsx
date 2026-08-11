"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  MarketingChrome,
  marketingNarrowMainClass,
  marketingPrimaryCtaClass,
  marketingSecondaryCtaClass
} from "./marketing-chrome";

type StatusPayload = {
  checkpoint: string;
  ready: boolean;
  canAccessModules: boolean;
  awaitingClaim?: boolean;
  maskedOwnerEmail?: string | null;
  organizationPrepared?: boolean;
  hasTemporaryIssue?: boolean;
  steps: Array<{ id: number; done?: boolean; current?: boolean; label?: string }>;
  nextPath: string | null;
};

/** Presentation-only customer labels — does not change provisioning machine. */
const CUSTOMER_STEP_LABELS: Record<number, string> = {
  1: "Confirming your purchase",
  2: "Confirming your email",
  3: "Creating your account identity",
  4: "Creating your organization",
  5: "Activating your product",
  6: "Assigning you as organization admin",
  7: "Applying default workspace settings",
  8: "Preparing Guided Setup",
  9: "Ready for Guided Setup"
};

function customerPhase(checkpoint: string | undefined): { title: string; detail: string } {
  switch (checkpoint) {
    case "ready":
    case "welcome_sent":
    case "owner_bound":
      return {
        title: "Workspace ready",
        detail: "Your organization is set up. Continue to Guided Setup, then Mission Control."
      };
    case "owner_pending":
    case "entitled":
    case "org_created":
      return {
        title: "Almost there — claim your workspace",
        detail: "Payment is secured and your organization is prepared. Sign in with your purchase email to claim admin access."
      };
    case "customer_linked":
    case "received":
      return {
        title: "Preparing your workspace",
        detail: "Payment secured. We are creating your identity, organization, and product activation automatically."
      };
    default:
      return {
        title: "Preparing your workspace",
        detail: "Payment secured. We are creating your identity, organization, and product activation automatically."
      };
  }
}

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
  const [polling, setPolling] = useState(Boolean(sessionId));
  const autoClaimStarted = useRef(false);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    async function poll() {
      const bindQuery =
        bindToken && bindToken.length > 0
          ? `&bind_token=${encodeURIComponent(bindToken)}`
          : "";
      const res = await fetch(
        `/api/commerce/provision/status?session_id=${encodeURIComponent(sessionId!)}${bindQuery}`
      );
      if (!res.ok) {
        if (!cancelled) {
          setError("We could not load your workspace status. Refresh this page to try again.");
          setPolling(false);
        }
        return;
      }
      const data = (await res.json()) as StatusPayload;
      if (!cancelled) {
        setError(null);
        setStatus(data);
        setPolling(false);
      }
    }
    void poll();
    const timer = window.setInterval(() => void poll(), 2000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [sessionId, bindToken]);

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
        setError(data.error ?? "Could not claim your workspace. Please try again.");
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
      setError(data.error ?? "Could not claim your workspace. Please try again.");
      return;
    }
    router.push(data.nextPath ?? "/setup");
  }

  const awaitingClaim =
    status?.awaitingClaim === true ||
    status?.checkpoint === "owner_pending" ||
    status?.checkpoint === "entitled" ||
    status?.checkpoint === "org_created";

  const phase = customerPhase(status?.checkpoint);
  const doneCount = status?.steps.filter((step) => step.done).length ?? 0;
  const totalSteps = status?.steps.length ?? 0;
  const currentStep = useMemo(
    () => status?.steps.find((step) => step.current) ?? null,
    [status?.steps]
  );

  if (!sessionId) {
    return (
      <MarketingChrome isAuthenticated={isAuthenticated} denseNav>
        <main className={marketingNarrowMainClass}>
          <header className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
              After purchase
            </p>
            <h1 className="font-display text-3xl font-semibold">Missing purchase session</h1>
            <p className="text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
              This page needs your Stripe checkout session to continue. Open the link from your
              purchase confirmation email, or return to checkout success.
            </p>
          </header>
          <div className="flex flex-wrap gap-3">
            <Link href="/checkout/success" className={marketingPrimaryCtaClass}>
              Back to purchase confirmation
            </Link>
            <Link href="/login" className={marketingSecondaryCtaClass}>
              Sign in
            </Link>
          </div>
        </main>
      </MarketingChrome>
    );
  }

  const nextActionLabel = !isAuthenticated
    ? "Create your password with the same email used at purchase"
    : awaitingClaim
      ? "Claim your workspace to continue Guided Setup"
      : status?.ready || status?.canAccessModules
        ? "Continue to Guided Setup"
        : "Wait a moment while we finish preparing your workspace";

  return (
    <MarketingChrome isAuthenticated={isAuthenticated} denseNav>
      <main className={marketingNarrowMainClass}>
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
            After purchase
          </p>
          <h1 className="font-display text-3xl font-semibold">
            {status?.ready || status?.canAccessModules ? "Workspace ready" : phase.title}
          </h1>
          <p className="text-sm leading-6 text-[var(--mpa-color-text-secondary)]">
            {status?.ready || status?.canAccessModules
              ? "Your organization is provisioned. Next: Guided Setup, then Mission Control."
              : phase.detail}
          </p>
        </header>

        <section
          aria-label="What to do next"
          className="rounded-md border border-[var(--mpa-color-brand-primary)]/30 bg-[var(--mpa-color-brand-primary-subtle,#E6F4EF)] p-4"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-brand-primary)]">
            What to do next
          </p>
          <p className="mt-1 text-sm font-semibold text-[var(--mpa-color-text-primary)]">
            {nextActionLabel}
          </p>
        </section>

        {polling && !status ? (
          <p className="text-sm text-[var(--mpa-color-text-secondary)]" role="status">
            Loading your workspace status…
          </p>
        ) : null}

        {status ? (
          <section className="space-y-4 rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">
                Setup progress
              </p>
              <p className="text-xs text-[var(--mpa-color-text-muted)]">
                {doneCount} of {totalSteps} complete
              </p>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-[var(--mpa-color-bg-subtle,#F7F8FA)]"
              role="progressbar"
              aria-valuenow={doneCount}
              aria-valuemin={0}
              aria-valuemax={totalSteps}
              aria-label="Workspace preparation progress"
            >
              <div
                className="h-full rounded-full bg-[var(--mpa-color-brand-primary)] transition-[width] duration-300"
                style={{ width: `${totalSteps ? (doneCount / totalSteps) * 100 : 0}%` }}
              />
            </div>
            {currentStep ? (
              <p className="text-sm text-[var(--mpa-color-text-secondary)]">
                Current:{" "}
                <span className="font-medium text-[var(--mpa-color-text-primary)]">
                  {CUSTOMER_STEP_LABELS[currentStep.id] ?? currentStep.label}
                </span>
              </p>
            ) : null}
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              {status.maskedOwnerEmail ? (
                <div>
                  <dt className="text-xs text-[var(--mpa-color-text-muted)]">Purchase email</dt>
                  <dd className="font-medium">{status.maskedOwnerEmail}</dd>
                </div>
              ) : null}
              {status.organizationPrepared ? (
                <div>
                  <dt className="text-xs text-[var(--mpa-color-text-muted)]">Organization</dt>
                  <dd className="font-medium">Prepared</dd>
                </div>
              ) : null}
            </dl>
            <ol className="space-y-2 text-sm">
              {status.steps.map((step) => {
                const label = CUSTOMER_STEP_LABELS[step.id] ?? step.label;
                return (
                  <li
                    key={step.id}
                    className={`flex gap-2 rounded-md px-2 py-1.5 ${
                      step.current
                        ? "bg-[var(--mpa-color-brand-primary-subtle,#E6F4EF)] font-semibold"
                        : ""
                    }`}
                  >
                    <span aria-hidden>{step.done ? "✓" : step.current ? "→" : "·"}</span>
                    <span>
                      {label}
                      <span className="sr-only">
                        {step.done ? " complete" : step.current ? " in progress" : " pending"}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ol>
          </section>
        ) : null}

        {error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
            {error}
          </p>
        ) : null}
        {status?.hasTemporaryIssue ? (
          <p className="text-sm text-[var(--mpa-color-text-secondary)]" role="status">
            We hit a temporary issue while preparing your workspace and are retrying automatically.
            You can stay on this page.
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          {!isAuthenticated ? (
            <Link
              href={`/login?mode=sign_up&saas_checkout_session=${encodeURIComponent(sessionId)}${
                bindToken ? `&bind_token=${encodeURIComponent(bindToken)}` : ""
              }`}
              className={marketingPrimaryCtaClass}
            >
              Set password & claim workspace
            </Link>
          ) : awaitingClaim ? (
            <button
              type="button"
              disabled={claimBusy}
              aria-busy={claimBusy}
              onClick={() => void claim()}
              className={marketingPrimaryCtaClass}
            >
              {claimBusy ? "Claiming workspace…" : "Claim workspace"}
            </button>
          ) : status?.ready || status?.canAccessModules ? (
            <Link href="/setup" className={marketingPrimaryCtaClass}>
              Continue to Guided Setup
            </Link>
          ) : (
            <p className="text-sm text-[var(--mpa-color-text-secondary)]" role="status">
              Provisioning in progress… this page updates automatically.
            </p>
          )}
          <Link href="/checkout/success" className={marketingSecondaryCtaClass}>
            Back to confirmation
          </Link>
        </div>
        {isAuthenticated && userEmail ? (
          <p className="text-xs text-[var(--mpa-color-text-muted)]">Signed in as {userEmail}</p>
        ) : (
          <p className="text-xs text-[var(--mpa-color-text-muted)]">
            Use the same email address you entered at Stripe Checkout.
          </p>
        )}
      </main>
    </MarketingChrome>
  );
}
