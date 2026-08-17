"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FINANCIAL_WORKSPACE_SECTIONS } from "@mpa/shared";
import { Alert, Badge, Button, Card } from "@mpa/ui";
import { Breadcrumbs } from "../shell/breadcrumbs";

type OnlinePaymentsStatus = {
  status: "not_connected" | "setup_incomplete" | "ready_to_enable" | "active" | "action_required";
  label: string;
  summary: string;
  availability: "off" | "waiting" | "ready" | "active" | "action";
  execution_enabled: boolean;
  connect_ready: boolean;
  requirements: string[];
  primary_action: "connect" | "continue_setup" | "enable" | "manage";
  secondary_action: "manage" | "disable" | null;
  onboardingUrl?: string;
  manageUrl?: string;
};

const BADGE_VARIANT: Record<OnlinePaymentsStatus["availability"], "neutral" | "warning" | "info" | "success" | "danger"> =
  {
    off: "neutral",
    waiting: "warning",
    ready: "info",
    active: "success",
    action: "danger"
  };

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    }
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error((body as { error?: string; message?: string }).message ?? (body as { error?: string }).error ?? "Request failed");
  }
  return body as T;
}

export function OnlinePaymentsSettings() {
  const [status, setStatus] = useState<OnlinePaymentsStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<"enable" | "disable" | null>(null);

  const load = useCallback(async (syncReturn = false) => {
    setError(null);
    if (syncReturn) {
      await fetchJson<OnlinePaymentsStatus>("/api/finance/online-payments", {
        method: "POST",
        body: JSON.stringify({ action: "sync" })
      }).catch(() => null);
    }
    const next = await fetchJson<OnlinePaymentsStatus>("/api/finance/online-payments");
    setStatus(next);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connect = params.get("connect");
    void load(connect === "return" || connect === "refresh").catch((err) => {
      setError(err instanceof Error ? err.message : "Unable to load Online Payments");
    });
  }, [load]);

  const runAction = useCallback(
    async (action: string) => {
      setBusy(true);
      setError(null);
      try {
        const body = await fetchJson<OnlinePaymentsStatus>("/api/finance/online-payments", {
          method: "POST",
          body: JSON.stringify({ action })
        });
        if (body.onboardingUrl) {
          window.location.assign(body.onboardingUrl);
          return;
        }
        if (body.manageUrl) {
          window.location.assign(body.manageUrl);
          return;
        }
        setStatus(body);
        setConfirm(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Update failed");
      } finally {
        setBusy(false);
      }
    },
    []
  );

  const primaryLabel = useMemo(() => {
    if (!status) {
      return "Connect with Stripe";
    }
    if (status.primary_action === "connect") {
      return "Connect with Stripe";
    }
    if (status.primary_action === "continue_setup") {
      return "Continue Stripe Setup";
    }
    if (status.primary_action === "enable") {
      return "Enable Online Payments";
    }
    return "Manage Stripe Account";
  }, [status]);

  return (
    <main className="flex-1 space-y-4 bg-[var(--mpa-color-bg-app)] p-4 md:p-6">
      <Breadcrumbs
        items={[
          { href: "/launcher", label: "Launcher" },
          { href: "/pm/mission-control", label: "Property Manager" },
          { href: "/pm/financial-operations", label: "Financial Operations" },
          { label: "Online Payments" }
        ]}
      />

      <header className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          Financial Operations
        </p>
        <h1 className="mt-1 font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
          Online Payments
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--mpa-color-text-secondary)]">
          Take rent online with Stripe. Tenants can pay a posted balance once, or turn on AutoPay
          for recurring rent and eligible fees. You set every amount.
        </p>
      </header>

      <nav
        aria-label="Financial Operations sections"
        className="flex flex-wrap gap-2 border-b border-[var(--mpa-color-border-default)] pb-3"
      >
        {FINANCIAL_WORKSPACE_SECTIONS.map((section) => (
          <Link
            key={section.id}
            href={section.href}
            className="rounded-md border border-[var(--mpa-color-brand-primary)] bg-white px-3 py-1.5 text-sm font-medium text-[var(--mpa-color-text-primary)]"
            aria-current={section.id === "online_payments" ? "page" : undefined}
          >
            {section.label}
          </Link>
        ))}
      </nav>

      {error ? <Alert variant="danger">{error}</Alert> : null}

      <Card className="max-w-3xl space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
              Status
            </p>
            <h2 className="mt-1 font-display text-xl font-semibold text-[var(--mpa-color-text-primary)]">
              {status?.label ?? "Loading…"}
            </h2>
            <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">
              {status?.summary ?? "Checking Stripe setup for this organization."}
            </p>
          </div>
          {status ? <Badge variant={BADGE_VARIANT[status.availability]}>{status.label}</Badge> : null}
        </div>

        {status?.requirements.length ? (
          <div className="rounded-md border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-subtle,#fafafa)] px-3 py-3">
            <p className="text-sm font-medium">Stripe needs a few more details</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--mpa-color-text-secondary)]">
              {status.requirements.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {confirm === "enable" ? (
          <Alert variant="info">
            <p className="text-sm">
              Enable online payments for this organization? Current tenants will be able to pay
              posted balances with Stripe. AutoPay stays off until each tenant turns it on. Tenants
              who already authorized AutoPay will be charged again on the next posted eligible
              charges, unless their payment method or occupancy is no longer valid.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="button" disabled={busy} onClick={() => void runAction("enable")}>
                Enable Online Payments
              </Button>
              <Button type="button" variant="secondary" disabled={busy} onClick={() => setConfirm(null)}>
                Cancel
              </Button>
            </div>
          </Alert>
        ) : null}

        {confirm === "disable" ? (
          <Alert variant="warning">
            <p className="text-sm">
              Turn off online payments? Tenants will not be able to start new payments. Payment
              history, receipts, and the ledger stay as they are. Your Stripe account stays
              connected. Tenants who already authorized AutoPay will not be charged until you turn
              online payments back on.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="button" disabled={busy} onClick={() => void runAction("disable")}>
                Disable Online Payments
              </Button>
              <Button type="button" variant="secondary" disabled={busy} onClick={() => setConfirm(null)}>
                Cancel
              </Button>
            </div>
          </Alert>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {status?.primary_action === "enable" ? (
            <Button type="button" disabled={busy} onClick={() => setConfirm("enable")}>
              {primaryLabel}
            </Button>
          ) : (
            <Button
              type="button"
              disabled={busy || !status}
              onClick={() => void runAction(status?.primary_action ?? "connect")}
            >
              {primaryLabel}
            </Button>
          )}
          {status?.secondary_action === "manage" ? (
            <Button type="button" variant="secondary" disabled={busy} onClick={() => void runAction("manage")}>
              Manage Stripe Account
            </Button>
          ) : null}
          {status?.secondary_action === "disable" ? (
            <Button type="button" variant="secondary" disabled={busy} onClick={() => setConfirm("disable")}>
              Disable Online Payments
            </Button>
          ) : null}
        </div>
      </Card>
    </main>
  );
}
