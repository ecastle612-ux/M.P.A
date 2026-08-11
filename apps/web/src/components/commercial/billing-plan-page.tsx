"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Skeleton } from "@mpa/ui";
import { useCommercialContext } from "../shell/commercial-context";
import { Breadcrumbs } from "../shell/breadcrumbs";
import {
  AdditionalUnitCapacityGate,
  type CapacityGatePayload
} from "./additional-unit-capacity-gate";

type BillingPayload = {
  status: string | null;
  phase: string | null;
  moduleAccess: boolean;
  productSku?: string;
  planLabel?: string;
  billingCycle?: string;
  billingCycleLabel?: string;
  cancelAtPeriodEnd?: boolean;
  currentPeriodEnd?: string | null;
  scaRequired?: boolean;
  title?: string;
  detail?: string;
  requiredAction?: string | null;
  paymentHistory?: Array<{ at: string; kind: string; note: string; amountCents?: number }>;
  message?: string;
  managedUnitCount?: number | null;
  authorizedUnitCapacity?: number | null;
  authorizedAdditionalBlocks?: number | null;
  pendingAdditionalBlocks?: number | null;
  trialEndsAt?: string | null;
  trialActive?: boolean;
};

type CapacityPayload = {
  linked?: boolean;
  capacityStatus?: string;
  actualUnits?: number;
  authorizedCapacity?: number;
  additionalBlocks?: number;
  currentBillingAmountMonthlyUsd?: number;
  nextBillingAmountMonthlyUsd?: number;
  nextBillingPeriodEnd?: string | null;
  trialActive?: boolean;
  gate?: CapacityGatePayload | null;
  message?: string;
};

export function BillingPlanPage() {
  const router = useRouter();
  const { productLabel } = useCommercialContext();
  const [data, setData] = useState<BillingPayload | null>(null);
  const [capacity, setCapacity] = useState<CapacityPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [gateOpen, setGateOpen] = useState(false);
  const [authorizeBusy, setAuthorizeBusy] = useState(false);
  const [authorizeError, setAuthorizeError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      fetch("/api/commerce/subscription", { signal: controller.signal }).then(async (res) => {
        if (!res.ok) throw new Error("Could not load subscription status.");
        return (await res.json()) as BillingPayload;
      }),
      fetch("/api/commerce/capacity", { signal: controller.signal }).then(async (res) => {
        if (!res.ok) return null;
        return (await res.json()) as CapacityPayload;
      })
    ])
      .then(([subscription, capacityPayload]) => {
        setError(null);
        setData(subscription);
        setCapacity(capacityPayload);
        if (capacityPayload?.capacityStatus === "requires_authorization" && capacityPayload.gate) {
          setGateOpen(true);
        }
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

  async function authorizeFromBilling() {
    setAuthorizeBusy(true);
    setAuthorizeError(null);
    const res = await fetch("/api/commerce/capacity/authorize", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({})
    });
    const payload = (await res.json().catch(() => ({}))) as { error?: string };
    setAuthorizeBusy(false);
    if (!res.ok) {
      setAuthorizeError(payload.error ?? "Authorization failed.");
      return;
    }
    setGateOpen(false);
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
          Property Manager, Facility Operations, and Complete Platform renewals, recovery, and
          Additional Unit Capacity run automatically — no employee involvement.
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
                <dt className="text-[var(--mpa-color-text-muted)]">Module</dt>
                <dd>{data.planLabel ?? productLabel ?? "Property Manager"}</dd>
              </div>
              <div>
                <dt className="text-[var(--mpa-color-text-muted)]">Billing interval</dt>
                <dd>{data.billingCycleLabel ?? "Monthly"}</dd>
              </div>
              <div>
                <dt className="text-[var(--mpa-color-text-muted)]">Workspace access</dt>
                <dd>{data.moduleAccess ? "Available" : "Paused — billing recovery required"}</dd>
              </div>
              <div>
                <dt className="text-[var(--mpa-color-text-muted)]">Managed units</dt>
                <dd>{capacity?.actualUnits ?? data.managedUnitCount ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-[var(--mpa-color-text-muted)]">Included capacity</dt>
                <dd>500 units</dd>
              </div>
              <div>
                <dt className="text-[var(--mpa-color-text-muted)]">Authorized capacity</dt>
                <dd>
                  {capacity?.authorizedCapacity ?? data.authorizedUnitCapacity ?? 500} units
                </dd>
              </div>
              <div>
                <dt className="text-[var(--mpa-color-text-muted)]">Additional Unit Capacity</dt>
                <dd>
                  {capacity?.additionalBlocks ?? data.authorizedAdditionalBlocks ?? 0} block
                  {(capacity?.additionalBlocks ?? data.authorizedAdditionalBlocks ?? 0) === 1
                    ? ""
                    : "s"}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--mpa-color-text-muted)]">Trial status</dt>
                <dd>
                  {data.trialActive
                    ? data.trialEndsAt
                      ? `30-Day Free Trial · ends ${new Date(data.trialEndsAt).toLocaleDateString()}`
                      : "30-Day Free Trial"
                    : "Not on trial"}
                </dd>
              </div>
              <div>
                <dt className="text-[var(--mpa-color-text-muted)]">Next billing date</dt>
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

      {capacity?.linked ? (
        <section className="space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-5">
          <h2 className="font-display text-lg font-semibold">Additional Unit Capacity</h2>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            Included capacity is 500 units. Additional blocks are $39/month each and take effect
            next billing period after authorization — never a surprise mid-period charge.
          </p>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-[var(--mpa-color-text-muted)]">Status</dt>
              <dd className="font-medium">
                {(capacity.capacityStatus ?? "").replace(/_/g, " ")}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--mpa-color-text-muted)]">Additional blocks</dt>
              <dd>{capacity.additionalBlocks ?? 0}</dd>
            </div>
            <div>
              <dt className="text-[var(--mpa-color-text-muted)]">Current recurring</dt>
              <dd>
                {typeof capacity.currentBillingAmountMonthlyUsd === "number"
                  ? `$${capacity.currentBillingAmountMonthlyUsd}/month`
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--mpa-color-text-muted)]">Next period recurring</dt>
              <dd>
                {typeof capacity.nextBillingAmountMonthlyUsd === "number"
                  ? `$${capacity.nextBillingAmountMonthlyUsd}/month`
                  : "—"}
              </dd>
            </div>
          </dl>
          {capacity.capacityStatus === "requires_authorization" && capacity.gate ? (
            <Button type="button" onClick={() => setGateOpen(true)}>
              Authorize Additional Capacity
            </Button>
          ) : null}
        </section>
      ) : null}

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

      <AdditionalUnitCapacityGate
        open={gateOpen}
        gate={capacity?.gate ?? null}
        busy={authorizeBusy}
        error={authorizeError}
        onClose={() => {
          setGateOpen(false);
          setAuthorizeError(null);
        }}
        onAuthorize={() => void authorizeFromBilling()}
      />
    </main>
  );
}
