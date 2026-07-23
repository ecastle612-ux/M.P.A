"use client";

import { useEffect, useState } from "react";
import { Card } from "@mpa/ui";
import type { VendorFinancialHistory } from "../../lib/vendor-payments/contracts";

type Props = {
  vendorId: string;
};

export function VendorPaymentHistoryPanel({ vendorId }: Props) {
  const [history, setHistory] = useState<VendorFinancialHistory | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch(`/api/vendors/${vendorId}/payments`);
      if (!res.ok) return;
      setHistory((await res.json()) as VendorFinancialHistory);
    })();
  }, [vendorId]);

  if (!history) {
    return (
      <Card className="space-y-2 p-4">
        <h2 className="text-base font-semibold">Payment history</h2>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">Loading…</p>
      </Card>
    );
  }

  return (
    <Card className="space-y-4 p-4">
      <div>
        <h2 className="text-base font-semibold">Invoices & payments</h2>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
          Outstanding {history.outstandingCount} (${history.outstandingTotal.toFixed(2)}) · Paid{" "}
          {history.paidCount} (${history.paidTotal.toFixed(2)})
        </p>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium">Invoices</h3>
        {history.invoices.length === 0 ? (
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">No invoices yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {history.invoices.slice(0, 12).map((invoice) => (
              <li
                key={invoice.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-subtle)] px-3 py-2"
              >
                <span>
                  {invoice.invoiceNumber ?? "Invoice"} · ${invoice.amount.toFixed(2)}
                </span>
                <span className="capitalize text-[var(--mpa-color-text-secondary)]">
                  {invoice.status.replaceAll("_", " ")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium">Payments</h3>
        {history.payments.length === 0 ? (
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">No payments yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {history.payments.slice(0, 12).map((payment) => (
              <li
                key={payment.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-subtle)] px-3 py-2"
              >
                <span>
                  ${payment.amount.toFixed(2)} · {payment.paymentMethod.replaceAll("_", " ")}
                  {payment.referenceNumber ? ` · ${payment.referenceNumber}` : ""}
                </span>
                <span className="text-[var(--mpa-color-text-secondary)]">{payment.paidAt}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
