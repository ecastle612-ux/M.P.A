"use client";

import { useCallback, useEffect, useState } from "react";
import { formatMoney } from "@mpa/shared";
import { Badge, Button, EmptyState, Input, Select } from "@mpa/ui";

type Aging = {
  current: number;
  "1_30": number;
  "31_60": number;
  "61_90": number;
  "90_plus": number;
};

type DelinquencyCase = {
  id: string;
  lease_id: string;
  status: string;
  open_balance: number;
  days_past_due: number;
  aging_bucket: string;
  reminder_count: number;
  lease_residents?: { display_name: string } | Array<{ display_name: string }> | null;
  property_properties?: { name: string } | Array<{ name: string }> | null;
};

type Vendor = { id: string; name: string; email?: string | null };
type VendorInvoice = {
  id: string;
  invoice_number: string;
  description?: string | null;
  amount: number;
  status: string;
  due_at?: string | null;
  scheduled_for?: string | null;
  vendor_vendors?: { name: string } | Array<{ name: string }> | null;
};

type CollectionsSnapshot = {
  residentsOverdue: DelinquencyCase[];
  totalDelinquency: number;
  aging: Aging;
  upcomingLateFees: Array<{ id: string; label: string; amount: number; due_at: string }>;
  vendorInvoicesAwaitingApproval: VendorInvoice[];
  vendorPaymentsDue: Array<{
    id: string;
    amount: number;
    scheduled_for: string | null;
    vendor_vendors?: { name: string } | Array<{ name: string }> | null;
    financial_vendor_invoices?: { invoice_number: string } | Array<{ invoice_number: string }> | null;
  }>;
  activeArrangements: Array<{
    id: string;
    lease_id: string;
    total_amount: number;
    installment_amount: number;
    installments_total: number;
    next_due_on: string | null;
    status: string;
  }>;
  alerts: string[];
};

type LateFeePolicy = {
  id: string;
  name: string;
  grace_days: number;
  fee_type: string;
  fee_amount: number;
  fee_percent: number;
  property_id: string | null;
};

type Property = { id: string; name: string };

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
    throw new Error((body as { error?: string }).error ?? "Request failed");
  }
  return body as T;
}

function nestedName(
  value: { name?: string; display_name?: string; invoice_number?: string } | Array<{ name?: string; display_name?: string; invoice_number?: string }> | null | undefined,
  key: "name" | "display_name" | "invoice_number"
): string {
  if (!value) {
    return "—";
  }
  const row = Array.isArray(value) ? value[0] : value;
  return (row?.[key] as string | undefined) ?? "—";
}

export function CollectionsDesk() {
  const [snapshot, setSnapshot] = useState<CollectionsSnapshot | null>(null);
  const [policies, setPolicies] = useState<LateFeePolicy[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [invoices, setInvoices] = useState<VendorInvoice[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [graceDays, setGraceDays] = useState("5");
  const [feeAmount, setFeeAmount] = useState("50");
  const [vendorName, setVendorName] = useState("");
  const [invoiceVendorId, setInvoiceVendorId] = useState("");
  const [invoicePropertyId, setInvoicePropertyId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceAmount, setInvoiceAmount] = useState("");
  const [invoiceDescription, setInvoiceDescription] = useState("");
  const [arrangementLeaseId, setArrangementLeaseId] = useState("");
  const [arrangementTotal, setArrangementTotal] = useState("");
  const [arrangementInstallment, setArrangementInstallment] = useState("");
  const [arrangementCount, setArrangementCount] = useState("3");
  const [arrangementNextDue, setArrangementNextDue] = useState("");

  const refresh = useCallback(async () => {
    const [collections, vendorsRes, invoicesRes, propertiesRes] = await Promise.all([
      fetchJson<{ snapshot: CollectionsSnapshot; policies: LateFeePolicy[] }>("/api/finance/collections"),
      fetchJson<{ vendors: Vendor[] }>("/api/finance/vendors"),
      fetchJson<{ invoices: VendorInvoice[] }>("/api/finance/vendor-invoices"),
      fetchJson<{ properties: Property[] }>("/api/finance/properties")
    ]);
    setSnapshot(collections.snapshot);
    setPolicies(collections.policies);
    setVendors(vendorsRes.vendors);
    setInvoices(invoicesRes.invoices);
    setProperties(propertiesRes.properties);
    setInvoiceVendorId((current) => current || vendorsRes.vendors[0]?.id || "");
    setInvoicePropertyId((current) => current || propertiesRes.properties[0]?.id || "");
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await refresh();
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load collections");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }

  const aging = snapshot?.aging;
  const overdue = snapshot?.residentsOverdue ?? [];

  return (
    <div className="space-y-6">
      {error ? (
        <p className="rounded-md border border-[#C0392B] bg-[#FCE8E6] px-3 py-2 text-sm text-[#C0392B]">{error}</p>
      ) : null}

      <section
        aria-label="Collections assistant recommendation"
        className="rounded-md border border-[var(--mpa-color-border-default)] bg-white px-4 py-3"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
          Assistant recommendation
        </p>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-primary)]">
          {(snapshot?.vendorInvoicesAwaitingApproval.length ?? 0) > 0
            ? `Approve or request changes on ${snapshot?.vendorInvoicesAwaitingApproval.length} vendor invoice(s), then schedule payment.`
            : overdue.length > 0
              ? `Assess late fees where grace has ended, send reminders for ${overdue.length} overdue resident(s), and record payment arrangements when needed.`
              : "No active delinquency or AP blockers. Keep late-fee policy current and sync delinquency after posting rent."}
        </p>
      </section>

      <section id="delinquency" className="scroll-mt-24 space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold">Delinquency dashboard</h3>
            <p className="text-xs text-[var(--mpa-color-text-secondary)]">
              One collections path: grace → late fee → reminder → arrangement → payment.
            </p>
          </div>
          <Button
            type="button"
            disabled={busy}
            onClick={() =>
              void run(async () => {
                await fetchJson("/api/finance/collections", {
                  method: "POST",
                  body: JSON.stringify({ kind: "sync_delinquency" })
                });
              })
            }
          >
            Sync delinquency
          </Button>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Metric label="Total delinquency" value={formatMoney(snapshot?.totalDelinquency ?? 0)} />
          <Metric label="Residents overdue" value={String(overdue.length)} />
          <Metric label="Active arrangements" value={String(snapshot?.activeArrangements.length ?? 0)} />
          <Metric
            label="Open late fees"
            value={String(snapshot?.upcomingLateFees.length ?? 0)}
          />
        </div>

        <div className="grid gap-3 md:grid-cols-5">
          {(
            [
              ["current", "Current"],
              ["1_30", "1–30"],
              ["31_60", "31–60"],
              ["61_90", "61–90"],
              ["90_plus", "90+"]
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="rounded-md border border-[var(--mpa-color-border-default)] bg-white px-3 py-2">
              <p className="text-xs text-[var(--mpa-color-text-secondary)]">{label}</p>
              <p className="font-display text-lg font-semibold">{formatMoney(aging?.[key] ?? 0)}</p>
            </div>
          ))}
        </div>

        {overdue.length === 0 ? (
          <EmptyState title="No delinquent residents" description="Open balances past due will appear here after sync." />
        ) : (
          <div className="overflow-x-auto rounded-md border border-[var(--mpa-color-border-default)] bg-white">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b text-[var(--mpa-color-text-secondary)]">
                  <th scope="col" className="px-3 py-2">Resident</th>
                  <th scope="col" className="px-3 py-2">Property</th>
                  <th scope="col" className="px-3 py-2">Balance</th>
                  <th scope="col" className="px-3 py-2">Days</th>
                  <th scope="col" className="px-3 py-2">Bucket</th>
                  <th scope="col" className="px-3 py-2">Status</th>
                  <th scope="col" className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {overdue.map((item) => (
                  <tr key={item.id} className="border-b border-[var(--mpa-color-border-subtle)]">
                    <td className="px-3 py-2">{nestedName(item.lease_residents, "display_name")}</td>
                    <td className="px-3 py-2">{nestedName(item.property_properties, "name")}</td>
                    <td className="px-3 py-2">{formatMoney(Number(item.open_balance))}</td>
                    <td className="px-3 py-2">{item.days_past_due}</td>
                    <td className="px-3 py-2">{item.aging_bucket}</td>
                    <td className="px-3 py-2">
                      <Badge variant={item.status === "escalated" ? "danger" : "info"}>{item.status}</Badge>
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        className="text-xs text-[var(--mpa-color-brand-primary)] underline"
                        disabled={busy}
                        onClick={() =>
                          void run(async () => {
                            await fetchJson("/api/finance/collections", {
                              method: "POST",
                              body: JSON.stringify({ kind: "reminder", caseId: item.id })
                            });
                          })
                        }
                      >
                        Send reminder ({item.reminder_count})
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <form
          className="grid gap-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4 md:grid-cols-2 lg:grid-cols-3"
          onSubmit={(event) => {
            event.preventDefault();
            void run(async () => {
              await fetchJson("/api/finance/collections", {
                method: "POST",
                body: JSON.stringify({
                  kind: "arrangement",
                  leaseId: arrangementLeaseId,
                  totalAmount: Number(arrangementTotal),
                  installmentAmount: Number(arrangementInstallment),
                  installmentsTotal: Number(arrangementCount),
                  nextDueOn: arrangementNextDue
                })
              });
              setArrangementTotal("");
              setArrangementInstallment("");
            });
          }}
        >
          <h4 className="md:col-span-2 lg:col-span-3 text-sm font-semibold">Record payment arrangement</h4>
          <Select
            value={arrangementLeaseId}
            onChange={(event) => setArrangementLeaseId(event.target.value)}
            required
          >
            <option value="">Select overdue lease</option>
            {overdue.map((item) => (
              <option key={item.id} value={item.lease_id}>
                {nestedName(item.lease_residents, "display_name")} · {formatMoney(Number(item.open_balance))}
              </option>
            ))}
          </Select>
          <Input
            value={arrangementTotal}
            onChange={(event) => setArrangementTotal(event.target.value)}
            type="number"
            min="0.01"
            step="0.01"
            placeholder="Total amount"
            required
          />
          <Input
            value={arrangementInstallment}
            onChange={(event) => setArrangementInstallment(event.target.value)}
            type="number"
            min="0.01"
            step="0.01"
            placeholder="Installment"
            required
          />
          <Input
            value={arrangementCount}
            onChange={(event) => setArrangementCount(event.target.value)}
            type="number"
            min="1"
            max="36"
            placeholder="Installments"
            required
          />
          <Input
            value={arrangementNextDue}
            onChange={(event) => setArrangementNextDue(event.target.value)}
            type="date"
            required
          />
          <Button type="submit" disabled={busy || !arrangementLeaseId}>
            Save arrangement
          </Button>
        </form>
      </section>

      <section id="late-fees" className="scroll-mt-24 space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold">Late fee queue</h3>
            <p className="text-xs text-[var(--mpa-color-text-secondary)]">
              Assess fees after grace per property policy — residents get a plain-language notice.
            </p>
          </div>
          <Button
            type="button"
            disabled={busy}
            onClick={() =>
              void run(async () => {
                await fetchJson("/api/finance/collections", {
                  method: "POST",
                  body: JSON.stringify({ kind: "assess_late_fees" })
                });
              })
            }
          >
            Assess late fees now
          </Button>
        </div>

        <form
          className="flex flex-wrap items-end gap-3 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4"
          onSubmit={(event) => {
            event.preventDefault();
            void run(async () => {
              await fetchJson("/api/finance/collections", {
                method: "POST",
                body: JSON.stringify({
                  kind: "policy",
                  name: "Default late fee",
                  graceDays: Number(graceDays),
                  feeType: "flat",
                  feeAmount: Number(feeAmount),
                  feePercent: 0,
                  active: true
                })
              });
            });
          }}
        >
          <label className="text-sm">
            <span className="mb-1 block text-[var(--mpa-color-text-secondary)]">Grace days</span>
            <Input value={graceDays} onChange={(event) => setGraceDays(event.target.value)} type="number" min="0" max="60" />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-[var(--mpa-color-text-secondary)]">Flat fee</span>
            <Input value={feeAmount} onChange={(event) => setFeeAmount(event.target.value)} type="number" min="0" step="0.01" />
          </label>
          <Button type="submit" disabled={busy}>
            Save org policy
          </Button>
          {policies[0] ? (
            <p className="text-xs text-[var(--mpa-color-text-secondary)]">
              Active: {policies[0].grace_days}d grace · {formatMoney(Number(policies[0].fee_amount))}{" "}
              {policies[0].fee_type}
            </p>
          ) : null}
        </form>

        {(snapshot?.upcomingLateFees.length ?? 0) === 0 ? (
          <EmptyState title="No open late fees" description="Assessed late fees still unpaid show here." />
        ) : (
          <ul className="space-y-2 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-3 text-sm">
            {snapshot?.upcomingLateFees.map((fee) => (
              <li key={fee.id} className="flex justify-between gap-2 border-b border-[var(--mpa-color-border-subtle)] py-1">
                <span>
                  {fee.label}
                  <span className="block text-xs text-[var(--mpa-color-text-secondary)]">Due {fee.due_at}</span>
                </span>
                <span>{formatMoney(Number(fee.amount))}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section id="vendor-invoices" className="scroll-mt-24 space-y-3">
        <h3 className="text-sm font-semibold">Vendor invoice queue</h3>
        <p className="text-xs text-[var(--mpa-color-text-secondary)]">
          Reuses Vendor Operations identity — invoice → review → approve → schedule → paid.
        </p>

        <div className="grid gap-4 lg:grid-cols-2">
          <form
            className="space-y-2 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4"
            onSubmit={(event) => {
              event.preventDefault();
              void run(async () => {
                await fetchJson("/api/finance/vendors", {
                  method: "POST",
                  body: JSON.stringify({ name: vendorName })
                });
                setVendorName("");
              });
            }}
          >
            <h4 className="text-sm font-semibold">Add vendor</h4>
            <Input value={vendorName} onChange={(event) => setVendorName(event.target.value)} placeholder="Vendor name" required />
            <Button type="submit" disabled={busy || !vendorName.trim()}>
              Create vendor
            </Button>
          </form>

          <form
            className="space-y-2 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-4"
            onSubmit={(event) => {
              event.preventDefault();
              void run(async () => {
                await fetchJson("/api/finance/vendor-invoices", {
                  method: "POST",
                  body: JSON.stringify({
                    vendorId: invoiceVendorId,
                    propertyId: invoicePropertyId || null,
                    invoiceNumber,
                    description: invoiceDescription || undefined,
                    amount: Number(invoiceAmount),
                    dueAt: new Date().toISOString().slice(0, 10)
                  })
                });
                setInvoiceNumber("");
                setInvoiceAmount("");
                setInvoiceDescription("");
              });
            }}
          >
            <h4 className="text-sm font-semibold">Submit vendor invoice</h4>
            <Select value={invoiceVendorId} onChange={(event) => setInvoiceVendorId(event.target.value)} required>
              <option value="">Select vendor</option>
              {vendors.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </option>
              ))}
            </Select>
            <Select value={invoicePropertyId} onChange={(event) => setInvoicePropertyId(event.target.value)}>
              <option value="">Property (optional)</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </Select>
            <Input value={invoiceNumber} onChange={(event) => setInvoiceNumber(event.target.value)} placeholder="Invoice #" required />
            <Input
              value={invoiceAmount}
              onChange={(event) => setInvoiceAmount(event.target.value)}
              type="number"
              min="0.01"
              step="0.01"
              placeholder="Amount"
              required
            />
            <Input
              value={invoiceDescription}
              onChange={(event) => setInvoiceDescription(event.target.value)}
              placeholder="Description"
            />
            <Button type="submit" disabled={busy || !invoiceVendorId}>
              Submit invoice
            </Button>
          </form>
        </div>

        {invoices.length === 0 ? (
          <EmptyState title="No vendor invoices" description="Submitted invoices await review here." />
        ) : (
          <div className="overflow-x-auto rounded-md border border-[var(--mpa-color-border-default)] bg-white">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b text-[var(--mpa-color-text-secondary)]">
                  <th scope="col" className="px-3 py-2">Vendor</th>
                  <th scope="col" className="px-3 py-2">Invoice</th>
                  <th scope="col" className="px-3 py-2">Amount</th>
                  <th scope="col" className="px-3 py-2">Status</th>
                  <th scope="col" className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="border-b border-[var(--mpa-color-border-subtle)]">
                    <td className="px-3 py-2">{nestedName(invoice.vendor_vendors, "name")}</td>
                    <td className="px-3 py-2">{invoice.invoice_number}</td>
                    <td className="px-3 py-2">{formatMoney(Number(invoice.amount))}</td>
                    <td className="px-3 py-2">
                      <Badge variant={invoice.status === "paid" ? "success" : "neutral"}>{invoice.status}</Badge>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-2">
                        {["submitted", "in_review", "changes_requested"].includes(invoice.status) ? (
                          <button
                            type="button"
                            className="text-xs text-[var(--mpa-color-brand-primary)] underline"
                            disabled={busy}
                            onClick={() =>
                              void run(async () => {
                                await fetchJson("/api/finance/vendor-invoices", {
                                  method: "POST",
                                  body: JSON.stringify({
                                    action: "review",
                                    invoiceId: invoice.id,
                                    reviewAction: "approve"
                                  })
                                });
                              })
                            }
                          >
                            Approve
                          </button>
                        ) : null}
                        {invoice.status === "approved" ? (
                          <button
                            type="button"
                            className="text-xs text-[var(--mpa-color-brand-primary)] underline"
                            disabled={busy}
                            onClick={() =>
                              void run(async () => {
                                await fetchJson("/api/finance/vendor-invoices", {
                                  method: "POST",
                                  body: JSON.stringify({
                                    action: "review",
                                    invoiceId: invoice.id,
                                    reviewAction: "schedule",
                                    scheduledFor: new Date().toISOString().slice(0, 10),
                                    paymentMethod: "manual_check"
                                  })
                                });
                              })
                            }
                          >
                            Schedule
                          </button>
                        ) : null}
                        {["approved", "scheduled"].includes(invoice.status) ? (
                          <button
                            type="button"
                            className="text-xs text-[var(--mpa-color-brand-primary)] underline"
                            disabled={busy}
                            onClick={() =>
                              void run(async () => {
                                await fetchJson("/api/finance/vendor-invoices", {
                                  method: "POST",
                                  body: JSON.stringify({
                                    action: "review",
                                    invoiceId: invoice.id,
                                    reviewAction: "mark_paid",
                                    paymentMethod: "manual_check"
                                  })
                                });
                              })
                            }
                          >
                            Mark paid
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section id="vendor-payments" className="scroll-mt-24 space-y-3">
        <h3 className="text-sm font-semibold">Scheduled vendor payments</h3>
        {(snapshot?.vendorPaymentsDue.length ?? 0) === 0 ? (
          <EmptyState
            title="No scheduled payments"
            description="Approved invoices scheduled for payment appear here until marked paid."
          />
        ) : (
          <ul className="space-y-2 rounded-md border border-[var(--mpa-color-border-default)] bg-white p-3 text-sm">
            {snapshot?.vendorPaymentsDue.map((payment) => (
              <li key={payment.id} className="flex flex-wrap justify-between gap-2 border-b border-[var(--mpa-color-border-subtle)] py-1">
                <span>
                  {nestedName(payment.vendor_vendors, "name")} ·{" "}
                  {nestedName(payment.financial_vendor_invoices, "invoice_number")}
                  <span className="block text-xs text-[var(--mpa-color-text-secondary)]">
                    Scheduled {payment.scheduled_for ?? "—"}
                  </span>
                </span>
                <span>{formatMoney(Number(payment.amount))}</span>
              </li>
            ))}
          </ul>
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
