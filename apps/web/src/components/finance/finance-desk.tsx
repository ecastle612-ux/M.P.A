"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatMoney, ownerEmptyStateCopy } from "@mpa/shared";
import { resolveStatusBadgeVariant, Alert, Badge, Button, EmptyState, Input, Select, TableScroll } from "@mpa/ui";

type Lease = {
  id: string;
  property_id: string;
  rent_amount: number;
  currency: string;
  property_properties?: { id: string; name: string } | null;
  lease_residents?: Array<{
    id: string;
    display_name: string;
    financial_status: string;
    email?: string | null;
  }>;
};

type Snapshot = {
  outstandingBalance: number;
  collectedThisMonth: number;
  delinquentResidents: Array<{ id: string; display_name: string; financial_status: string }>;
  upcomingRent: Array<{ id: string; label: string; amount: number; due_at: string }>;
  recentPayments: Array<{ id: string; amount: number; paid_at: string | null; method: string }>;
  alerts: string[];
  totalDelinquency?: number;
  residentsOverdue?: Array<unknown>;
  vendorInvoicesAwaitingApproval?: Array<unknown>;
  vendorPaymentsDue?: Array<unknown>;
  upcomingLateFees?: Array<unknown>;
};

type LedgerResponse = {
  charges: Array<{
    id: string;
    label: string;
    amount: number;
    amount_paid: number;
    status: string;
    due_at: string;
    charge_type: string;
  }>;
  payments: Array<{
    id: string;
    amount: number;
    status: string;
    method: string;
    paid_at: string | null;
    financial_receipts?: Array<{ receipt_number: string }> | { receipt_number: string } | null;
  }>;
  balance: { openBalance: number; hasPastDue: boolean; status: string };
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
    throw new Error(body.error ?? "Request failed");
  }
  return body as T;
}

export function FinanceDesk() {
  const [leases, setLeases] = useState<Lease[]>([]);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [selectedLeaseId, setSelectedLeaseId] = useState<string>("");
  const [ledger, setLedger] = useState<LedgerResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [oneTimeLabel, setOneTimeLabel] = useState("Pet fee");
  const [oneTimeAmount, setOneTimeAmount] = useState("50");
  const [manualAmount, setManualAmount] = useState("");
  const [manualMethod, setManualMethod] = useState("manual_cash");

  const selectedLease = useMemo(
    () => leases.find((lease) => lease.id === selectedLeaseId) ?? null,
    [leases, selectedLeaseId]
  );
  const hasCollected = (snapshot?.recentPayments.length ?? 0) > 0 || (snapshot?.collectedThisMonth ?? 0) > 0;
  const firstCollectMode = !hasCollected;

  const refresh = useCallback(async () => {
    setError(null);
    const [leasesRes, snapshotRes] = await Promise.all([
      fetchJson<{ leases: Lease[] }>("/api/finance/leases"),
      fetchJson<{ snapshot: Snapshot }>("/api/finance/snapshot")
    ]);
    setLeases(leasesRes.leases);
    setSnapshot(snapshotRes.snapshot);
    if (!selectedLeaseId && leasesRes.leases[0]) {
      setSelectedLeaseId(leasesRes.leases[0].id);
    }
  }, [selectedLeaseId]);

  const refreshLedger = useCallback(async (leaseId: string) => {
    if (!leaseId) {
      setLedger(null);
      return;
    }
    const data = await fetchJson<LedgerResponse>(`/api/finance/leases/${leaseId}/ledger`);
    setLedger(data);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [leasesRes, snapshotRes] = await Promise.all([
          fetchJson<{ leases: Lease[] }>("/api/finance/leases"),
          fetchJson<{ snapshot: Snapshot }>("/api/finance/snapshot")
        ]);
        if (cancelled) {
          return;
        }
        setLeases(leasesRes.leases);
        setSnapshot(snapshotRes.snapshot);
        setSelectedLeaseId((current) => current || leasesRes.leases[0]?.id || "");
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load finance desk");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const hash = window.location.hash.replace("#", "");
    if (!hash) {
      return;
    }
    const target = document.getElementById(hash);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [leases, snapshot]);

  useEffect(() => {
    if (!selectedLeaseId) {
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const data = await fetchJson<LedgerResponse>(`/api/finance/leases/${selectedLeaseId}/ledger`);
        if (!cancelled) {
          setLedger(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load ledger");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedLeaseId]);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      await refresh();
      if (selectedLeaseId) {
        await refreshLedger(selectedLeaseId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {error ? <Alert variant="danger">{error}</Alert> : null}
      {notice ? <Alert variant="success">{notice}</Alert> : null}

      <section
        id="record"
        aria-labelledby="record-payment-title"
        className="space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4"
      >
        <h2
          id="record-payment-title"
          className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]"
        >
          {firstCollectMode ? "Record your first payment" : "Record payment"}
        </h2>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          One payment workflow: review open balances, send a payment reminder, then record a manual
          payment. Receipts, ledger, property money, and owner summary update automatically.
        </p>
        {firstCollectMode ? (
          <ol className="list-decimal space-y-1 pl-5 text-sm text-[var(--mpa-color-text-secondary)]">
            <li>Confirm the lease has an open rent charge below.</li>
            <li>Send a payment reminder so the resident can open Billing.</li>
            <li>Record a manual payment and receipt when funds are received.</li>
          </ol>
        ) : (
          <p className="text-sm font-medium text-emerald-800">First payment recorded.</p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={busy || !selectedLeaseId}
            onClick={() => {
              void run(async () => {
                if (!selectedLeaseId) {
                  throw new Error("Select a lease");
                }
                const result = await fetchJson<{ notice?: string }>("/api/finance/reminders", {
                  method: "POST",
                  body: JSON.stringify({ leaseId: selectedLeaseId })
                });
                setNotice(result.notice ?? "Payment reminder sent.");
              });
            }}
          >
            Send payment reminder
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              document.getElementById("charges")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Review charges
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              document.getElementById("payments")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Record manual payment
          </Button>
        </div>
      </section>

      <section id="command-metrics" className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <Metric
          label="Outstanding balance"
          value={formatMoney(snapshot?.outstandingBalance ?? 0)}
        />
        <Metric
          label="Collected this month"
          value={formatMoney(snapshot?.collectedThisMonth ?? 0)}
        />
        <Metric
          label="Total delinquency"
          value={formatMoney(snapshot?.totalDelinquency ?? 0)}
        />
        <Metric
          label="Residents overdue"
          value={String(snapshot?.residentsOverdue?.length ?? snapshot?.delinquentResidents.length ?? 0)}
        />
        <Metric
          label="Invoices awaiting approval"
          value={String(snapshot?.vendorInvoicesAwaitingApproval?.length ?? 0)}
        />
        <Metric
          label="Vendor payments due"
          value={String(snapshot?.vendorPaymentsDue?.length ?? 0)}
        />
      </section>

      <section
        aria-label="Assistant recommendation"
        className="rounded-md border border-[var(--mpa-color-border-default)] bg-white px-4 py-3"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          Assistant recommendation
        </p>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-primary)]">
          {firstCollectMode
            ? "Record your first payment. Review open charges, send a reminder if needed, then record a manual payment."
            : (snapshot?.vendorInvoicesAwaitingApproval?.length ?? 0) > 0
              ? `Review ${snapshot?.vendorInvoicesAwaitingApproval?.length} vendor invoice(s) awaiting approval, then schedule payment.`
              : (snapshot?.residentsOverdue?.length ?? snapshot?.delinquentResidents.length ?? 0) > 0
                ? `Focus on ${snapshot?.residentsOverdue?.length ?? snapshot?.delinquentResidents.length} overdue resident(s). Open balances and record a payment when funds are received.`
                : (snapshot?.outstandingBalance ?? 0) > 0
                  ? "Balances are open but not delinquent yet. Open balances and record a manual payment when funds are received."
                  : "First payment recorded. Review your maintenance queue next."}
        </p>
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        <div className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
          <h3 className="text-sm font-semibold">Financial alerts</h3>
          <ul className="mt-2 space-y-1 text-sm text-[var(--mpa-color-text-secondary)]">
            {(snapshot?.alerts ?? ["Loading…"]).map((alert) => (
              <li key={alert}>• {alert}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
          <h3 className="text-sm font-semibold">Recent payments</h3>
          {(snapshot?.recentPayments.length ?? 0) === 0 ? (
            <p className="mt-2 text-sm text-[var(--mpa-color-text-secondary)]">No payments yet this month.</p>
          ) : (
            <ul className="mt-2 space-y-2 text-sm">
              {snapshot?.recentPayments.map((payment) => (
                <li key={payment.id} className="flex justify-between gap-2 border-b border-[var(--mpa-color-border-subtle)] py-1">
                  <span>{formatMoney(Number(payment.amount))}</span>
                  <span className="text-[var(--mpa-color-text-secondary)]">{payment.method}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section id="setup" className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
          <h3 className="text-sm font-semibold">Properties</h3>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            Create properties in the Properties directory — one creation path for the portfolio (J1).
            Financial Operations consumes those properties for leases and money.
          </p>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              window.location.href = "/pm/properties?new=1";
            }}
          >
            Open Properties to add
          </Button>
        </div>

        <div className="space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
          <h3 className="text-sm font-semibold">Residents & leases</h3>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            Create residents on Residents (J3) and leases on Leasing (J4) — one path each. Financial
            Operations consumes activated leases for rent collection.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                window.location.href = "/pm/residents?new=1";
              }}
            >
              Open Residents
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                window.location.href = "/pm/leasing?new=1";
              }}
            >
              Open Leasing
            </Button>
          </div>
        </div>
      </section>

      <section id="charges" className="space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="mb-1 block text-[var(--mpa-color-text-secondary)]">Resident lease</span>
            <Select
              value={selectedLeaseId}
              onChange={(event) => setSelectedLeaseId(event.target.value)}
              className="min-w-[240px]"
            >
              <option value="">Select lease</option>
              {leases.map((lease) => (
                <option key={lease.id} value={lease.id}>
                  {lease.lease_residents?.[0]?.display_name ?? "Resident"} ·{" "}
                  {lease.property_properties?.name ?? "Property"}
                </option>
              ))}
            </Select>
          </label>
          {selectedLease ? (
            <Badge
              variant={
                selectedLease.lease_residents?.[0]?.financial_status === "delinquent" ? "danger" : "success"
              }
            >
              {selectedLease.lease_residents?.[0]?.financial_status ?? "current"}
            </Badge>
          ) : null}
          {ledger ? (
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">
              Balance {formatMoney(ledger.balance.openBalance)}
            </p>
          ) : null}
        </div>

        {!selectedLeaseId ? (
          <EmptyState
            title={
              leases.length === 0
                ? ownerEmptyStateCopy("finance").title
                : "Select a resident lease"
            }
            description={
              leases.length === 0
                ? ownerEmptyStateCopy("finance").description
                : "Create a property and lease, then post rent or one-time charges."
            }
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            <form
              className="space-y-2"
              onSubmit={(event) => {
                event.preventDefault();
                void run(async () => {
                  await fetchJson("/api/finance/charges", {
                    method: "POST",
                    body: JSON.stringify({
                      kind: "recurring",
                      leaseId: selectedLeaseId,
                      chargeType: "rent",
                      label: "Monthly rent",
                      amount: Number(selectedLease?.rent_amount ?? 1500),
                      generateCurrentPeriod: true
                    })
                  });
                });
              }}
            >
              <h4 className="text-sm font-semibold">Create recurring rent</h4>
              <Button type="submit" disabled={busy}>
                Generate this month’s rent
              </Button>
            </form>

            <form
              className="space-y-2"
              onSubmit={(event) => {
                event.preventDefault();
                void run(async () => {
                  await fetchJson("/api/finance/charges", {
                    method: "POST",
                    body: JSON.stringify({
                      kind: "one_time",
                      leaseId: selectedLeaseId,
                      label: oneTimeLabel,
                      amount: Number(oneTimeAmount),
                      dueAt: new Date().toISOString().slice(0, 10),
                      chargeType: oneTimeLabel.toLowerCase().includes("credit") ? "credit" : "one_time"
                    })
                  });
                });
              }}
            >
              <h4 className="text-sm font-semibold">One-time charge / credit</h4>
              <Input value={oneTimeLabel} onChange={(event) => setOneTimeLabel(event.target.value)} required />
              <Input
                value={oneTimeAmount}
                onChange={(event) => setOneTimeAmount(event.target.value)}
                type="number"
                min="0.01"
                step="0.01"
                required
              />
              <Button type="submit" disabled={busy}>
                Post charge
              </Button>
            </form>
          </div>
        )}

        {ledger ? (
          <TableScroll className="mt-4">
            <table className="min-w-[36rem] text-left text-sm">
              <thead className="bg-[var(--mpa-color-bg-subtle,#F4F6F5)]">
                <tr className="border-b border-[var(--mpa-color-border-subtle)] text-[var(--mpa-color-text-secondary)]">
                  <th scope="col" className="px-3 py-2.5">Charge</th>
                  <th scope="col" className="px-3 py-2.5">Due</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Amount</th>
                  <th scope="col" className="px-3 py-2.5 text-right">Paid</th>
                  <th scope="col" className="px-3 py-2.5">Status</th>
                  <th scope="col" className="px-3 py-2.5">Actions</th>
                </tr>
              </thead>
              <tbody>
                {ledger.charges.map((charge) => (
                  <tr key={charge.id} className="border-b border-[var(--mpa-color-border-subtle)]">
                    <td className="px-3 py-2.5">{charge.label}</td>
                    <td className="px-3 py-2.5">{charge.due_at}</td>
                    <td className="px-3 py-2.5 text-right font-medium tabular-nums">{formatMoney(Number(charge.amount))}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{formatMoney(Number(charge.amount_paid))}</td>
                    <td className="px-3 py-2.5">
                      <Badge variant={resolveStatusBadgeVariant(charge.status)}>{charge.status}</Badge>
                    </td>
                    <td className="px-3 py-2.5">
                      {charge.status !== "void" && charge.status !== "paid" ? (
                        <button
                          type="button"
                          className="text-xs text-[var(--mpa-color-brand-primary)] underline"
                          disabled={busy}
                          onClick={() =>
                            void run(async () => {
                              await fetchJson("/api/finance/charges", {
                                method: "POST",
                                body: JSON.stringify({
                                  kind: "adjust",
                                  chargeId: charge.id,
                                  action: "void",
                                  reason: "Adjusted by property manager"
                                })
                              });
                            })
                          }
                        >
                          Void
                        </button>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableScroll>
        ) : null}
      </section>

      <section id="payments" className="space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
        <h3 className="text-sm font-semibold">Record manual payment</h3>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Same canonical payment path as Stripe checkout — balance, receipt, property snapshot, owner
          summary, timeline, and audit update automatically.
        </p>
        <form
          className="flex flex-wrap items-end gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            void run(async () => {
              if (!selectedLeaseId) {
                throw new Error("Select a lease");
              }
              await fetchJson("/api/finance/payments", {
                method: "POST",
                body: JSON.stringify({
                  leaseId: selectedLeaseId,
                  amount: Number(manualAmount),
                  method: manualMethod
                })
              });
              setManualAmount("");
              setNotice("My first rent has been collected.");
            });
          }}
        >
          <label className="block space-y-1 text-sm sm:col-span-1" htmlFor="manual-payment-amount">
            <span className="text-xs text-[var(--mpa-color-text-secondary)]">Amount</span>
            <Input
              id="manual-payment-amount"
              value={manualAmount}
              onChange={(event) => setManualAmount(event.target.value)}
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              required
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="text-xs text-[var(--mpa-color-text-secondary)]">Method</span>
            <Select value={manualMethod} onChange={(event) => setManualMethod(event.target.value)}>
              <option value="manual_cash">Cash</option>
              <option value="manual_check">Check</option>
              <option value="manual_other">Other</option>
            </Select>
          </label>
          <Button type="submit" disabled={busy || !selectedLeaseId}>
            Record payment + receipt
          </Button>
        </form>

        {ledger?.payments?.length ? (
          <ul className="space-y-2 text-sm">
            {ledger.payments.map((payment) => {
              const receipt = Array.isArray(payment.financial_receipts)
                ? payment.financial_receipts[0]
                : payment.financial_receipts;
              return (
                <li
                  key={payment.id}
                  className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--mpa-color-border-subtle)] py-2"
                >
                  <span className="tabular-nums">
                    {formatMoney(Number(payment.amount))} · {payment.method} · {payment.status}
                  </span>
                  <span className="text-[var(--mpa-color-text-secondary)]">
                    {receipt?.receipt_number ?? "No receipt"}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState
            title="No payment history yet"
            description="Recorded payments and receipts for this lease will appear here."
          />
        )}
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[var(--mpa-color-border-default)] bg-white px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">{label}</p>
      <p className="mt-1 font-display text-xl font-semibold tabular-nums text-[var(--mpa-color-text-primary)]">{value}</p>
    </div>
  );
}
