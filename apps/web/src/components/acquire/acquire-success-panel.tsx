"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { AcqSelfServePlan } from "../../lib/acquire/decisions";
import { ACQ_FUNNEL_EVENTS, emitAcqFunnelEvent } from "../../lib/acquire/funnel";

type Intent = {
  plan: AcqSelfServePlan;
  interval: string;
  companyName: string;
  workEmail: string;
};

function readIntent(): Intent | null {
  try {
    const raw = window.sessionStorage.getItem("mpa.acq.checkoutIntent");
    if (!raw) return null;
    return JSON.parse(raw) as Intent;
  } catch {
    return null;
  }
}

export function AcquireSuccessPanel({ sessionId }: { sessionId: string | null }) {
  const [intent, setIntent] = useState<Intent | null>(null);
  const [status, setStatus] = useState<"provisioning" | "ready" | "delayed" | "error">("provisioning");
  const [message, setMessage] = useState("Payment received — preparing your workspace…");
  const [error, setError] = useState<string | null>(null);

  const isSandboxSession = useMemo(
    () =>
      Boolean(
        sessionId &&
          (sessionId.startsWith("cs_saas_sandbox_") || sessionId.startsWith("noop_cs_"))
      ),
    [sessionId]
  );

  useEffect(() => {
    setIntent(readIntent());
    emitAcqFunnelEvent(
      ACQ_FUNNEL_EVENTS.checkoutSuccessReturned,
      { session_present: Boolean(sessionId) },
      { oncePerSession: true, dedupeKey: sessionId ?? "success" }
    );
  }, [sessionId]);

  useEffect(() => {
    if (!intent?.workEmail) return;
    let cancelled = false;
    let attempts = 0;

    async function tick() {
      attempts += 1;
      try {
        if (isSandboxSession && sessionId && attempts === 1) {
          await fetch("/api/acquire/checkout/simulate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId,
              companyName: intent!.companyName,
              workEmail: intent!.workEmail,
              planCode: intent!.plan
            })
          });
        }

        const params = new URLSearchParams({
          email: intent!.workEmail,
          company: intent!.companyName
        });
        const response = await fetch(`/api/acquire/status?${params.toString()}`, {
          cache: "no-store"
        });
        const payload = (await response.json()) as {
          status?: string;
          message?: string;
          error?: string;
        };
        if (cancelled) return;
        if (payload.status === "ready") {
          setStatus("ready");
          setMessage(
            payload.message ??
              "Your workspace is ready. Check your email for login credentials, then sign in."
          );
          emitAcqFunnelEvent(
            ACQ_FUNNEL_EVENTS.provisionReady,
            { plan_code: intent!.plan },
            { oncePerSession: true, dedupeKey: `ready:${intent!.plan}` }
          );
          return;
        }
        if (attempts >= 20) {
          setStatus("delayed");
          setMessage(
            "Still preparing your workspace. Keep this page open, or sign in later after you receive credentials."
          );
          emitAcqFunnelEvent(
            ACQ_FUNNEL_EVENTS.provisionDelayed,
            {},
            { oncePerSession: true, dedupeKey: "delayed" }
          );
          return;
        }
        setStatus("provisioning");
        setMessage(payload.message ?? "Preparing your workspace…");
        window.setTimeout(() => void tick(), 2000);
      } catch {
        if (cancelled) return;
        if (attempts >= 8) {
          setStatus("error");
          setError("We could not confirm provisioning yet. Check your email or contact support.");
          emitAcqFunnelEvent(
            ACQ_FUNNEL_EVENTS.provisionFailed,
            {},
            { oncePerSession: true, dedupeKey: "failed" }
          );
          return;
        }
        window.setTimeout(() => void tick(), 2500);
      }
    }

    void tick();
    return () => {
      cancelled = true;
    };
  }, [intent, isSandboxSession, sessionId]);

  return (
    <div className="rounded-[var(--mpa-radius-lg)] border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] p-6">
      <h1 className="font-display text-2xl font-semibold">
        {status === "ready" ? "Welcome to M.P.A." : "Checkout complete"}
      </h1>
      <p className="mt-3 text-sm text-[var(--mpa-color-text-secondary)]" aria-live="polite">
        {error ?? message}
      </p>
      {intent ? (
        <p className="mt-2 text-sm text-[var(--mpa-color-text-muted)]">
          {intent.companyName} · {intent.workEmail} · {intent.plan}
        </p>
      ) : null}
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/login"
          onClick={() => emitAcqFunnelEvent(ACQ_FUNNEL_EVENTS.loginFromSuccess, {})}
          className="inline-flex h-11 items-center rounded-[var(--mpa-radius-md)] bg-[var(--mpa-color-brand-primary)] px-4 text-sm font-semibold text-[var(--mpa-color-text-inverse)]"
        >
          Go to sign in
        </Link>
        <Link
          href="/first-login"
          className="inline-flex h-11 items-center rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-default)] px-4 text-sm font-medium"
        >
          First login
        </Link>
        {status === "delayed" || status === "error" ? (
          <Link
            href="/contact-sales"
            className="inline-flex h-11 items-center px-2 text-sm font-medium text-[var(--mpa-color-text-secondary)] underline-offset-4 hover:underline"
          >
            Contact support
          </Link>
        ) : null}
      </div>
      <p className="mt-4 text-xs text-[var(--mpa-color-text-muted)]">
        We never sign you in automatically after payment. Use the credentials emailed to your work address,
        then complete Guided Setup.
      </p>
    </div>
  );
}
