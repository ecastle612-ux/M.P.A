"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Skeleton } from "@mpa/ui";
import { useCommercialContext } from "../shell/commercial-context";
import { Breadcrumbs } from "../shell/breadcrumbs";

type BillingPayload = {
  status: string | null;
  phase: string | null;
  moduleAccess: boolean;
  planTier?: string;
  planLabel?: string;
  billingCycleLabel?: string;
  cancelAtPeriodEnd?: boolean;
  currentPeriodEnd?: string | null;
  pendingPlanTier?: string | null;
  scaRequired?: boolean;
  title?: string;
  detail?: string;
  requiredAction?: string | null;
  paymentHistory?: Array<{ at: string; kind: string; note: string; amountCents?: number }>;
  message?: string;
};

export function BillingPlanPage() {
  const router = useRouter();
  const { productLabel } = useCommercialContext();
  const [data, setData] = useState<BillingPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/commerce/subscription", { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("Could not load subscription status.");
        }
        return (await res.json()) as BillingPayload;
      })
      .then((payload) => {
        setError(null);
        setData(payload);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Could not load subscription status.");
      });
    return () => controller.abort();
  }, [reloadToken]);

  async function post(path: string, body?: Record<string, string>) {
    setBusy(path);
    setError(null);
    const res = await fetch(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: body ? JSON.stringify(body) : "{}"
    });
    setBusy(null);
    if (!res.ok) {
      const payload = (await res.json().catch(() => ({}))) as { error?: string };
      setError(payload.error ?? "Request failed.");
      return;
    }
    setReloadToken((value) => value + 1);
    router.refresh();
  }

  return (
    <main className="flex-1 space-y-6 bg-[var(--mpa-color-bg-app)] p-4 md:p-6">
      <Breadcrumbs items={[{ href: "/launcher", label: "Launcher" }, { label: "Billing & Plan" }]} />
      <section>
        <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
          Billing & Plan
        </h1>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
          Property Manager renewals, recovery, and cancellation run automatically — no employee
          involvement.
        </p>
      </section>

      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      <section className="space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-5">
        <h2 className="font-display text-lg font-semibold">Subscription status</h2>
        {data?.title ? (
          <>
            <p className="text-base font-semibold text-[var(--mpa-color-text-primary)]">{data.title}</p>
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">{data.detail}</p>
            {data.requiredAction ? (
              <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">
                {data.requiredAction}
              </p>
            ) : null}
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[var(--mpa-color-text-muted)]">Plan</dt>
                <dd>
                  {data.planLabel ?? productLabel ?? "Property Manager"} · {data.billingCycleLabel}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--mpa-color-text-muted)]">Workspace access</dt>
                <dd>{data.moduleAccess ? "Available" : "Paused — billing recovery required"}</dd>
              </div>
              <div>
                <dt className="text-[var(--mpa-color-text-muted)]">Capacity</dt>
                <dd>Managed units (Additional Unit Capacity)</dd>
              </div>
              <div>
                <dt className="text-[var(--mpa-color-text-muted)]">Next renewal</dt>
                <dd>
                  {data.cancelAtPeriodEnd
                    ? "Cancels at period end"
                    : data.currentPeriodEnd
                      ? new Date(data.currentPeriodEnd).toLocaleString()
                      : "Automatic on your billing date"}
                </dd>
              </div>
            </dl>
            {data.scaRequired ? (
              <p className="text-sm text-[var(--mpa-color-text-secondary)]">
                Your bank needs a quick confirmation to finish payment. Check your email or banking
                app, then return here.
              </p>
            ) : null}
            {data.pendingPlanTier ? (
              <p className="text-sm text-[var(--mpa-color-text-secondary)]">
                Plan change to {data.pendingPlanTier} is scheduled for the end of this billing period.
              </p>
            ) : null}
          </>
        ) : data === null && !error ? (
          <div className="space-y-3" aria-busy="true" aria-label="Loading subscription">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-full max-w-md" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : (
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            {data?.message ?? "Subscription details unavailable."}
          </p>
        )}
      </section>

      <section className="flex flex-wrap gap-3">
        {data?.phase === "grace" || data?.phase === "past_due" || data?.phase === "expired" ? (
          <Button
            type="button"
            disabled={busy !== null}
            onClick={() => void post("/api/commerce/subscription/reactivate")}
          >
            {busy ? "Working…" : "Restore subscription"}
          </Button>
        ) : null}
        {data?.cancelAtPeriodEnd || data?.phase === "canceled" ? (
          <Button
            type="button"
            disabled={busy !== null}
            onClick={() => void post("/api/commerce/subscription/reactivate")}
          >
            {busy ? "Working…" : "Reactivate"}
          </Button>
        ) : data?.status === "active" || data?.phase === "active" || data?.phase === "reactivated" ? (
          <Button
            type="button"
            variant="secondary"
            disabled={busy !== null}
            onClick={() => void post("/api/commerce/subscription/cancel")}
          >
            {busy ? "Working…" : "Cancel at period end"}
          </Button>
        ) : null}
        {data?.planTier === "professional" ? (
          <Button
            type="button"
            variant="secondary"
            disabled={busy !== null}
            onClick={() =>
              void post("/api/commerce/subscription/change-plan", { planTier: "business" })
            }
          >
            Upgrade to Business
          </Button>
        ) : null}
        {data?.planTier === "business" ? (
          <Button
            type="button"
            variant="secondary"
            disabled={busy !== null}
            onClick={() =>
              void post("/api/commerce/subscription/change-plan", { planTier: "professional" })
            }
          >
            Schedule Professional (period end)
          </Button>
        ) : null}
        <Link href="/pm/mission-control">
          <Button type="button" variant="secondary">
            Mission Control
          </Button>
        </Link>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-lg font-semibold">Payment history</h2>
        {!data?.paymentHistory?.length ? (
          <p className="text-sm text-[var(--mpa-color-text-muted)]">No payments recorded yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {data.paymentHistory.map((row) => (
              <li
                key={`${row.at}-${row.kind}`}
                className="rounded-md border border-[var(--mpa-color-border-default)] bg-white px-3 py-2"
              >
                <span className="font-medium capitalize">{row.kind.replace("_", " ")}</span>
                <span className="text-[var(--mpa-color-text-secondary)]"> — {row.note}</span>
                <div className="text-xs text-[var(--mpa-color-text-muted)]">
                  {new Date(row.at).toLocaleString()}
                  {typeof row.amountCents === "number"
                    ? ` · $${(row.amountCents / 100).toFixed(2)}`
                    : ""}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
