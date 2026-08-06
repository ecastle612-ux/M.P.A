"use client";

import { useEffect, useState } from "react";
import { formatMoney } from "@mpa/shared";
import { Badge, Button, EmptyState, Skeleton } from "@mpa/ui";

type ResidentAccount = {
  resident: {
    id: string;
    lease_id: string;
    display_name: string;
    financial_status: string;
  };
  balance: { openBalance: number; hasPastDue: boolean; status: string };
  openCharges: Array<{ id: string; label: string; amount: number; amount_paid: number; due_at: string; status: string }>;
  upcomingCharges: Array<{ id: string; label: string; amount: number; due_at: string }>;
  recentPayments: Array<{
    id: string;
    amount: number;
    status: string;
    method: string;
    paid_at: string | null;
    financial_receipts?: Array<{ receipt_number: string }> | { receipt_number: string } | null;
  }>;
  receipts: Array<{ receipt_number: string; amount: number; issued_at: string }>;
  recentTransactions: Array<{ id: string; description: string; amount: number; direction: string; occurred_at: string }>;
};

export function ResidentBillingPortal() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [linked, setLinked] = useState(false);
  const [onlinePaymentsEnabled, setOnlinePaymentsEnabled] = useState(false);
  const [accounts, setAccounts] = useState<ResidentAccount[]>([]);
  const [payingLeaseId, setPayingLeaseId] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch("/api/finance/resident/billing");
        const body = await response.json();
        if (!response.ok) {
          throw new Error(body.error ?? "Failed to load billing");
        }
        setLinked(Boolean(body.linked));
        setOnlinePaymentsEnabled(Boolean(body.onlinePaymentsEnabled));
        setAccounts(body.accounts ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load billing");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function payNow(leaseId: string) {
    setPayingLeaseId(leaseId);
    setError(null);
    try {
      const response = await fetch("/api/finance/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leaseId })
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error ?? "Unable to start payment");
      }
      if (body.checkoutUrl) {
        globalThis.location.assign(body.checkoutUrl as string);
        return;
      }
      throw new Error("Checkout URL missing");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed to start");
      setPayingLeaseId(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!linked) {
    return (
      <EmptyState
        title="No billing account yet"
        description="When your property manager links you to a lease, your balance and pay options will show here."
      />
    );
  }

  return (
    <div className="space-y-6">
      {error ? (
        <p className="rounded-md border border-[#C0392B] bg-[#FCE8E6] px-3 py-2 text-sm text-[#C0392B]">{error}</p>
      ) : null}

      {accounts.map((account) => {
        const status = account.balance.status;
        return (
          <section
            key={account.resident.id}
            className="space-y-4 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4"
          >
            <header className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-semibold text-[var(--mpa-color-text-primary)]">
                  Your balance
                </h2>
                <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
                  Hi {account.resident.display_name} — keep it simple. Pay what’s due when you’re ready.
                </p>
              </div>
              <Badge variant={status === "delinquent" ? "danger" : status === "current" ? "success" : "info"}>
                {status === "delinquent" ? "Past due" : status === "prepaid" ? "Paid ahead" : "Up to date"}
              </Badge>
            </header>

            <div className="rounded-md border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-subtle,#fafafa)] px-4 py-5">
              <p className="text-xs uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">Current balance</p>
              <p className="mt-1 font-display text-3xl font-semibold text-[var(--mpa-color-text-primary)]">
                {formatMoney(account.balance.openBalance)}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  onClick={() => void payNow(account.resident.lease_id)}
                  disabled={!onlinePaymentsEnabled || account.balance.openBalance <= 0 || payingLeaseId === account.resident.lease_id}
                >
                  {payingLeaseId === account.resident.lease_id ? "Starting checkout…" : "Pay now"}
                </Button>
                {!onlinePaymentsEnabled ? (
                  <p className="self-center text-xs text-[var(--mpa-color-text-secondary)]">
                    Online pay isn’t configured yet — your manager can record a payment for you.
                  </p>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold">Upcoming charges</h3>
                {account.upcomingCharges.length === 0 ? (
                  <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">Nothing upcoming.</p>
                ) : (
                  <ul className="mt-2 space-y-2 text-sm">
                    {account.upcomingCharges.map((charge) => (
                      <li key={charge.id} className="flex justify-between gap-2 border-b py-1">
                        <span>
                          {charge.label}
                          <span className="block text-xs text-[var(--mpa-color-text-secondary)]">Due {charge.due_at}</span>
                        </span>
                        <span>{formatMoney(Number(charge.amount))}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <h3 className="text-sm font-semibold">Open charges</h3>
                {account.openCharges.length === 0 ? (
                  <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">You’re all caught up.</p>
                ) : (
                  <ul className="mt-2 space-y-2 text-sm">
                    {account.openCharges.map((charge) => (
                      <li key={charge.id} className="flex justify-between gap-2 border-b py-1">
                        <span>{charge.label}</span>
                        <span>
                          {formatMoney(Number(charge.amount) - Number(charge.amount_paid))}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold">Payment history</h3>
              {account.recentPayments.length === 0 ? (
                <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">No payments yet.</p>
              ) : (
                <ul className="mt-2 space-y-2 text-sm">
                  {account.recentPayments.map((payment) => {
                    const receipt = Array.isArray(payment.financial_receipts)
                      ? payment.financial_receipts[0]
                      : payment.financial_receipts;
                    return (
                      <li key={payment.id} className="flex flex-wrap justify-between gap-2 border-b py-1">
                        <span>
                          {formatMoney(Number(payment.amount))} · {payment.status}
                        </span>
                        <span className="text-[var(--mpa-color-text-secondary)]">
                          {receipt?.receipt_number ?? payment.method}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div>
              <h3 className="text-sm font-semibold">Receipts</h3>
              {account.receipts.length === 0 ? (
                <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">Receipts appear after a successful payment.</p>
              ) : (
                <ul className="mt-2 space-y-2 text-sm">
                  {account.receipts.map((receipt) => (
                    <li key={receipt.receipt_number} className="flex justify-between gap-2 border-b py-1">
                      <span>{receipt.receipt_number}</span>
                      <span>{formatMoney(Number(receipt.amount))}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h3 className="text-sm font-semibold">Recent activity</h3>
              {account.recentTransactions.length === 0 ? (
                <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">No recent activity.</p>
              ) : (
                <ul className="mt-2 space-y-2 text-sm">
                  {account.recentTransactions.map((item) => (
                    <li key={item.id} className="flex justify-between gap-2 border-b py-1">
                      <span>{item.description}</span>
                      <span>
                        {item.direction === "debit" ? "+" : "−"}
                        {formatMoney(Number(item.amount))}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
