"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatMoney } from "@mpa/shared";
import { Badge, Button, EmptyState, Input, Select } from "@mpa/ui";

type Property = {
  id: string;
  name: string;
  property_units?: Array<{ id: string; unit_label: string }>;
};

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
  const [properties, setProperties] = useState<Property[]>([]);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [selectedLeaseId, setSelectedLeaseId] = useState<string>("");
  const [ledger, setLedger] = useState<LedgerResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [residentName, setResidentName] = useState("");
  const [residentEmail, setResidentEmail] = useState("");
  const [rentAmount, setRentAmount] = useState("1500");
  const [oneTimeLabel, setOneTimeLabel] = useState("Pet fee");
  const [oneTimeAmount, setOneTimeAmount] = useState("50");
  const [manualAmount, setManualAmount] = useState("");
  const [manualMethod, setManualMethod] = useState("manual_cash");

  const selectedLease = useMemo(
    () => leases.find((lease) => lease.id === selectedLeaseId) ?? null,
    [leases, selectedLeaseId]
  );

  const refresh = useCallback(async () => {
    setError(null);
    const [propertiesRes, leasesRes, snapshotRes] = await Promise.all([
      fetchJson<{ properties: Property[] }>("/api/finance/properties"),
      fetchJson<{ leases: Lease[] }>("/api/finance/leases"),
      fetchJson<{ snapshot: Snapshot }>("/api/finance/snapshot")
    ]);
    setProperties(propertiesRes.properties);
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
        const [propertiesRes, leasesRes, snapshotRes] = await Promise.all([
          fetchJson<{ properties: Property[] }>("/api/finance/properties"),
          fetchJson<{ leases: Lease[] }>("/api/finance/leases"),
          fetchJson<{ snapshot: Snapshot }>("/api/finance/snapshot")
        ]);
        if (cancelled) {
          return;
        }
        setProperties(propertiesRes.properties);
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
      {error ? (
        <p className="rounded-md border border-[var(--mpa-color-danger,#C0392B)] bg-[#FCE8E6] px-3 py-2 text-sm text-[#C0392B]">
          {error}
        </p>
      ) : null}

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
          {(snapshot?.vendorInvoicesAwaitingApproval?.length ?? 0) > 0
            ? `Review ${snapshot?.vendorInvoicesAwaitingApproval?.length} vendor invoice(s) awaiting approval, then schedule payment.`
            : (snapshot?.residentsOverdue?.length ?? snapshot?.delinquentResidents.length ?? 0) > 0
              ? `Focus collections on ${snapshot?.residentsOverdue?.length ?? snapshot?.delinquentResidents.length} overdue resident(s). Assess late fees after grace, send a reminder, or record a payment arrangement.`
              : (snapshot?.outstandingBalance ?? 0) > 0
                ? "Balances are open but not delinquent yet. Generate this month’s rent early and confirm residents can reach Billing → Pay now."
                : "No open balances. Create recurring rent schedules for active leases so the next period posts automatically."}
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

        <form
          className="space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4"
          onSubmit={(event) => {
            event.preventDefault();
            void run(async () => {
              const property = properties[0];
              if (!property) {
                throw new Error("Create a property first");
              }
              const unitId = property.property_units?.[0]?.id;
              const result = await fetchJson<{ lease: { id: string } }>("/api/finance/leases", {
                method: "POST",
                body: JSON.stringify({
                  propertyId: property.id,
                  unitId,
                  displayName: residentName,
                  email: residentEmail || null,
                  rentAmount: Number(rentAmount)
                })
              });
              setSelectedLeaseId(result.lease.id);
              setResidentName("");
              setResidentEmail("");
            });
          }}
        >
          <h3 className="text-sm font-semibold">Add resident lease</h3>
          <Input
            value={residentName}
            onChange={(event) => setResidentName(event.target.value)}
            placeholder="Resident name"
            required
          />
          <Input
            value={residentEmail}
            onChange={(event) => setResidentEmail(event.target.value)}
            placeholder="Resident email (optional)"
            type="email"
          />
          <Input
            value={rentAmount}
            onChange={(event) => setRentAmount(event.target.value)}
            placeholder="Monthly rent"
            type="number"
            min="1"
            step="0.01"
            required
          />
          <Button type="submit" disabled={busy || !residentName.trim() || properties.length === 0}>
            Create lease
          </Button>
        </form>
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
            title="Select a resident lease"
            description="Create a property and lease, then post rent or one-time charges."
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
                      amount: Number(selectedLease?.rent_amount ?? rentAmount),
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
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b text-[var(--mpa-color-text-secondary)]">
                  <th className="py-2 pr-3">Charge</th>
                  <th className="py-2 pr-3">Due</th>
                  <th className="py-2 pr-3">Amount</th>
                  <th className="py-2 pr-3">Paid</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {ledger.charges.map((charge) => (
                  <tr key={charge.id} className="border-b border-[var(--mpa-color-border-subtle)]">
                    <td className="py-2 pr-3">{charge.label}</td>
                    <td className="py-2 pr-3">{charge.due_at}</td>
                    <td className="py-2 pr-3">{formatMoney(Number(charge.amount))}</td>
                    <td className="py-2 pr-3">{formatMoney(Number(charge.amount_paid))}</td>
                    <td className="py-2 pr-3">{charge.status}</td>
                    <td className="py-2">
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
          </div>
        ) : null}
      </section>

      <section id="payments" className="space-y-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4">
        <h3 className="text-sm font-semibold">Record manual payment</h3>
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
            });
          }}
        >
          <Input
            value={manualAmount}
            onChange={(event) => setManualAmount(event.target.value)}
            type="number"
            min="0.01"
            step="0.01"
            placeholder="Amount"
            required
          />
          <Select value={manualMethod} onChange={(event) => setManualMethod(event.target.value)}>
            <option value="manual_cash">Cash</option>
            <option value="manual_check">Check</option>
            <option value="manual_other">Other</option>
          </Select>
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
                  <span>
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
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">No payment history for this lease yet.</p>
        )}
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[var(--mpa-color-border-default)] bg-white px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">{label}</p>
      <p className="mt-1 font-display text-xl font-semibold text-[var(--mpa-color-text-primary)]">{value}</p>
    </div>
  );
}
