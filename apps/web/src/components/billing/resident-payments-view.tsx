"use client";

import { useEffect, useState, useTransition } from "react";
import { Button, Card } from "@mpa/ui";
import type { ResidentPaymentDashboard } from "../../lib/billing/contracts";
import { formatCurrency } from "../../lib/financial/contracts";

export function ResidentPaymentsView() {
  const [dashboard, setDashboard] = useState<ResidentPaymentDashboard | null>(null);
  const [consentVersion, setConsentVersion] = useState("autopay-v1");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function load() {
    startTransition(async () => {
      try {
        const res = await fetch("/api/resident/payments", { cache: "no-store" });
        const json = (await res.json()) as {
          dashboard?: ResidentPaymentDashboard | null;
          consentVersion?: string;
          error?: { message?: string };
          message?: string;
        };
        if (!res.ok) throw new Error(json.error?.message ?? "Failed to load payments");
        setDashboard(json.dashboard ?? null);
        if (json.consentVersion) setConsentVersion(json.consentVersion);
        if (json.message) setMessage(json.message);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      }
    });
  }

  useEffect(() => {
    load();
  }, []);

  async function paySelected() {
    if (!dashboard?.upcomingCharges.length) return;
    setError(null);
    setMessage(null);
    const chargeIds = dashboard.upcomingCharges.map((c) => c.id);
    const methodId = dashboard.methods.find((m) => m.isDefault)?.id ?? dashboard.methods[0]?.id;
    const res = await fetch("/api/resident/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "pay",
        chargeIds,
        leaseId: dashboard.upcomingCharges[0]?.leaseId ?? undefined,
        paymentMethodId: methodId ?? undefined
      })
    });
    const json = (await res.json()) as {
      attempt?: { status: string; failureMessage?: string | null; attemptNumber?: string };
      checkoutUrl?: string | null;
      error?: { message?: string };
      friendlyError?: string;
    };
    if (!res.ok) {
      setError(json.friendlyError ?? json.error?.message ?? "Payment failed");
      return;
    }
    if (json.checkoutUrl) {
      window.location.assign(json.checkoutUrl);
      return;
    }
    if (json.attempt?.status === "failed") {
      setError(json.attempt.failureMessage ?? "Payment failed");
    } else {
      setMessage(`Payment ${json.attempt?.attemptNumber ?? ""} ${json.attempt?.status ?? "submitted"}`);
    }
    load();
  }

  async function addSandboxMethod(kind: "card" | "ach") {
    setError(null);
    const res = await fetch("/api/resident/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "attach_method",
        externalPaymentMethodId: kind === "ach" ? `pm_ach_${Date.now()}` : `pm_card_${Date.now()}`,
        setDefault: true
      })
    });
    const json = (await res.json()) as { error?: { message?: string } };
    if (!res.ok) {
      setError(json.error?.message ?? "Could not save method");
      return;
    }
    setMessage(kind === "ach" ? "ACH method saved" : "Card method saved");
    load();
  }

  async function toggleAutopay(enroll: boolean) {
    setError(null);
    const methodId = dashboard?.methods.find((m) => m.isDefault)?.id ?? dashboard?.methods[0]?.id;
    const leaseId =
      dashboard?.autopay?.leaseId ?? dashboard?.upcomingCharges.find((c) => c.leaseId)?.leaseId ?? null;

    if (enroll) {
      if (!methodId) {
        setError("Add a payment method before enabling AutoPay.");
        return;
      }
      if (!leaseId) {
        setError("A lease-linked charge is required before AutoPay enrollment.");
        return;
      }
    } else if (!dashboard?.autopay?.leaseId) {
      setError("No AutoPay enrollment to disable.");
      return;
    }

    const res = await fetch("/api/resident/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        enroll
          ? {
              action: "enroll_autopay",
              leaseId,
              paymentMethodId: methodId,
              consentVersion
            }
          : {
              action: "disable_autopay",
              leaseId: dashboard?.autopay?.leaseId
            }
      )
    });
    const json = (await res.json()) as { error?: { message?: string } };
    if (!res.ok) {
      setError(json.error?.message ?? "AutoPay update failed");
      return;
    }
    setMessage(enroll ? "AutoPay enrolled" : "AutoPay disabled");
    load();
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Payments</h1>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Pay rent, manage methods, AutoPay, and receipts — mobile friendly.
        </p>
      </header>

      {error ? <p className="text-sm text-[var(--mpa-color-danger)]">{error}</p> : null}
      {message ? <p className="text-sm text-[var(--mpa-color-success)]">{message}</p> : null}

      <Card className="space-y-3 p-4">
        <div className="text-sm text-[var(--mpa-color-text-secondary)]">Balance due</div>
        <div className="text-3xl font-semibold">{formatCurrency(dashboard?.balanceDue ?? 0)}</div>
        {dashboard?.alerts?.map((alert) => (
          <p key={alert} className="text-sm text-[var(--mpa-color-warning)]">
            {alert}
          </p>
        ))}
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void paySelected()} disabled={pending || !dashboard?.upcomingCharges.length}>
            Pay balance
          </Button>
          <Button variant="secondary" onClick={() => void addSandboxMethod("card")} disabled={pending}>
            Add card
          </Button>
          <Button variant="secondary" onClick={() => void addSandboxMethod("ach")} disabled={pending}>
            Add ACH
          </Button>
        </div>
      </Card>

      <Card className="space-y-3 p-4">
        <h2 className="font-semibold">Upcoming charges</h2>
        {!dashboard?.upcomingCharges.length ? (
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">You’re all caught up.</p>
        ) : (
          <ul className="space-y-2">
            {dashboard.upcomingCharges.map((charge) => (
              <li key={charge.id} className="flex items-center justify-between gap-3 text-sm">
                <div>
                  <div className="font-medium">{charge.description}</div>
                  <div className="text-[var(--mpa-color-text-secondary)]">Due {charge.dueDate}</div>
                </div>
                <div className="font-medium">{formatCurrency(charge.outstandingBalance)}</div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="space-y-3 p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-semibold">AutoPay</h2>
          {dashboard?.autopay?.status === "active" ? (
            <Button variant="secondary" onClick={() => void toggleAutopay(false)} disabled={pending}>
              Disable
            </Button>
          ) : (
            <Button onClick={() => void toggleAutopay(true)} disabled={pending}>
              Enroll
            </Button>
          )}
        </div>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          {dashboard?.autopay?.status === "active"
            ? `Enrolled (${dashboard.autopay.consentVersion}) on ${new Date(dashboard.autopay.consentedAt).toLocaleDateString()}`
            : `Explicit consent required (${consentVersion}). Revocable anytime.`}
        </p>
      </Card>

      <Card className="space-y-3 p-4">
        <h2 className="font-semibold">Saved methods</h2>
        {!dashboard?.methods.length ? (
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">No methods on file.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {dashboard.methods.map((method) => (
              <li key={method.id}>
                {method.methodType.toUpperCase()} •••• {method.last4 ?? "****"}
                {method.brand ? ` (${method.brand})` : ""}
                {method.isDefault ? " · Default" : ""}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="space-y-3 p-4">
        <h2 className="font-semibold">Recent payments & receipts</h2>
        {!dashboard?.recentPayments.length && !dashboard?.receipts.length ? (
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">No history yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {dashboard?.recentPayments.map((payment) => (
              <li key={payment.id} className="flex justify-between gap-2">
                <span>
                  {payment.paymentDate} · {payment.paymentMethod} · {payment.status}
                </span>
                <span>{formatCurrency(payment.amount)}</span>
              </li>
            ))}
            {dashboard?.receipts.map((receipt) => (
              <li key={receipt.id} className="flex justify-between gap-2">
                <span>
                  Receipt {receipt.receiptNumber} · {new Date(receipt.issuedAt).toLocaleDateString()}
                </span>
                <span>{formatCurrency(receipt.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
