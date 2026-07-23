"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Card } from "@mpa/ui";
import type { VendorInvoiceRecord, VendorPaymentMethod } from "../../lib/vendor-payments/contracts";

type Props = {
  workOrderId: string;
  canManage: boolean;
};

export function VendorInvoiceReviewPanel({ workOrderId, canManage }: Props) {
  const [invoice, setInvoice] = useState<VendorInvoiceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<VendorPaymentMethod>("mark_paid");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [paidAt, setPaidAt] = useState(() => new Date().toISOString().slice(0, 10));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/maintenance/${workOrderId}/vendor-invoice`);
      if (!res.ok) return;
      const body = (await res.json()) as { invoice: VendorInvoiceRecord | null };
      setInvoice(body.invoice);
    } finally {
      setLoading(false);
    }
  }, [workOrderId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function review(action: "approve" | "reject" | "request_revision") {
    if (!invoice) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/vendor-invoices/${invoice.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reviewNotes: reviewNotes.trim() || null })
      });
      const body = (await res.json()) as { invoice?: VendorInvoiceRecord; error?: string };
      if (!res.ok) {
        setMessage(body.error ?? "Review failed");
        return;
      }
      setInvoice(body.invoice ?? null);
      setMessage(action === "approve" ? "Invoice approved." : action === "reject" ? "Invoice rejected." : "Revision requested.");
    } finally {
      setBusy(false);
    }
  }

  async function markPaid() {
    if (!invoice) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/vendor-invoices/${invoice.id}/mark-paid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethod,
          referenceNumber: referenceNumber.trim() || null,
          paidAt
        })
      });
      const body = (await res.json()) as { invoice?: VendorInvoiceRecord; error?: string };
      if (!res.ok) {
        setMessage(body.error ?? "Mark paid failed");
        return;
      }
      setInvoice(body.invoice ?? null);
      setMessage("Payment recorded.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <Card className="space-y-2 p-4">
        <h2 className="text-base font-semibold">Vendor invoice</h2>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">Loading…</p>
      </Card>
    );
  }

  if (!invoice) {
    return (
      <Card className="space-y-2 p-4">
        <h2 className="text-base font-semibold">Vendor invoice</h2>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          No invoice uploaded yet. After the vendor finishes the job, they can submit an invoice from the job link.
        </p>
      </Card>
    );
  }

  return (
    <Card className="space-y-4 p-4">
      <div>
        <h2 className="text-base font-semibold">Vendor invoice</h2>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
          Review and record payment in seconds. ACH Connect payouts remain future work.
        </p>
      </div>

      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-[var(--mpa-color-text-secondary)]">Amount</dt>
          <dd className="font-medium">${invoice.amount.toFixed(2)}</dd>
        </div>
        <div>
          <dt className="text-[var(--mpa-color-text-secondary)]">Status</dt>
          <dd className="font-medium capitalize">{invoice.status.replaceAll("_", " ")}</dd>
        </div>
        <div>
          <dt className="text-[var(--mpa-color-text-secondary)]">Invoice #</dt>
          <dd>{invoice.invoiceNumber ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-[var(--mpa-color-text-secondary)]">Submitted</dt>
          <dd>{new Date(invoice.submittedAt).toLocaleString()}</dd>
        </div>
      </dl>

      {invoice.notes ? (
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          <span className="font-medium text-[var(--mpa-color-text-primary)]">Notes: </span>
          {invoice.notes}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3 text-sm">
        {invoice.pdfSignedUrl ? (
          <a className="text-[var(--mpa-color-brand-primary)] underline" href={invoice.pdfSignedUrl} target="_blank" rel="noreferrer">
            Open PDF
          </a>
        ) : invoice.pdfPath ? (
          <span className="text-[var(--mpa-color-text-secondary)]">PDF on file</span>
        ) : null}
        {invoice.photoPaths.length > 0 ? (
          <span className="text-[var(--mpa-color-text-secondary)]">{invoice.photoPaths.length} photo(s)</span>
        ) : null}
      </div>

      {canManage && (invoice.status === "awaiting_approval" || invoice.status === "revision_requested") ? (
        <div className="space-y-3 border-t border-[var(--mpa-color-border-subtle)] pt-3">
          <label className="block space-y-1">
            <span className="text-sm font-medium">Review notes (optional)</span>
            <textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              rows={2}
              className="w-full rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-2 text-sm"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled={busy} onClick={() => void review("approve")}>
              Approve
            </Button>
            <Button type="button" variant="secondary" disabled={busy} onClick={() => void review("request_revision")}>
              Request revision
            </Button>
            <Button type="button" variant="secondary" disabled={busy} onClick={() => void review("reject")}>
              Reject
            </Button>
          </div>
        </div>
      ) : null}

      {canManage && invoice.status === "approved" ? (
        <div className="space-y-3 border-t border-[var(--mpa-color-border-subtle)] pt-3">
          <p className="text-sm font-medium">Mark Paid</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block space-y-1 text-sm">
              <span>Method</span>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as VendorPaymentMethod)}
                className="w-full rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-2"
              >
                <option value="mark_paid">Mark paid</option>
                <option value="check">Check</option>
                <option value="other">Other</option>
                <option value="ach_future">ACH (future Connect)</option>
              </select>
            </label>
            <label className="block space-y-1 text-sm">
              <span>Date paid</span>
              <input
                type="date"
                value={paidAt}
                onChange={(e) => setPaidAt(e.target.value)}
                className="w-full rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-2"
              />
            </label>
            <label className="block space-y-1 text-sm">
              <span>Reference #</span>
              <input
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="w-full rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-2"
                placeholder="Optional"
              />
            </label>
          </div>
          <Button type="button" disabled={busy} onClick={() => void markPaid()}>
            {busy ? "Recording…" : "Mark Paid"}
          </Button>
        </div>
      ) : null}

      {invoice.status === "paid" ? (
        <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">Payment recorded permanently.</p>
      ) : null}

      {message ? <p className="text-sm text-[var(--mpa-color-text-secondary)]">{message}</p> : null}
    </Card>
  );
}
