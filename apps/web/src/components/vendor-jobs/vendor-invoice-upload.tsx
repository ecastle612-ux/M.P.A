"use client";

import { useEffect, useState } from "react";
import { Button } from "@mpa/ui";
import type { VendorInvoiceRecord } from "../../lib/vendor-payments/contracts";

type Props = {
  token: string;
};

export function VendorInvoiceUpload({ token }: Props) {
  const [invoice, setInvoice] = useState<VendorInvoiceRecord | null>(null);
  const [amount, setAmount] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [pdfPath, setPdfPath] = useState<string | null>(null);
  const [photoPaths, setPhotoPaths] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`/api/vendor-jobs/${encodeURIComponent(token)}/invoice`);
        if (!res.ok) return;
        const body = (await res.json()) as { invoice: VendorInvoiceRecord | null };
        if (body.invoice) {
          setInvoice(body.invoice);
          setAmount(String(body.invoice.amount));
          setInvoiceNumber(body.invoice.invoiceNumber ?? "");
          setNotes(body.invoice.notes ?? "");
          setContactEmail(body.invoice.contactEmail ?? "");
          setPdfPath(body.invoice.pdfPath);
          setPhotoPaths(body.invoice.photoPaths ?? []);
        }
      } catch {
        // ignore load errors on public token page
      }
    })();
  }, [token]);

  async function uploadFile(file: File, kind: "pdf" | "photo") {
    const form = new FormData();
    form.append("file", file);
    form.append("kind", kind);
    const res = await fetch(`/api/vendor-jobs/${encodeURIComponent(token)}/invoice-file`, {
      method: "POST",
      body: form
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(body.error ?? "Upload failed");
    }
    const body = (await res.json()) as { path: string };
    return body.path;
  }

  async function submitInvoice() {
    setBusy(true);
    setMessage(null);
    try {
      const parsed = Number(amount);
      if (!(parsed > 0)) {
        setMessage("Enter the invoice amount.");
        return;
      }
      const res = await fetch(`/api/vendor-jobs/${encodeURIComponent(token)}/invoice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parsed,
          invoiceNumber: invoiceNumber.trim() || null,
          notes: notes.trim() || null,
          contactEmail: contactEmail.trim() || null,
          pdfPath,
          photoPaths
        })
      });
      const body = (await res.json()) as { invoice?: VendorInvoiceRecord; error?: string };
      if (!res.ok) {
        setMessage(body.error ?? "Unable to submit invoice");
        return;
      }
      setInvoice(body.invoice ?? null);
      setMessage("Invoice submitted — awaiting manager approval.");
    } catch {
      setMessage("Unable to submit invoice. Check your connection.");
    } finally {
      setBusy(false);
    }
  }

  const locked = invoice?.status === "approved" || invoice?.status === "paid" || invoice?.status === "rejected";

  return (
    <div className="space-y-4 rounded-[var(--mpa-radius-lg)] border border-[var(--mpa-color-border-subtle)] p-4">
      <div>
        <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">Upload invoice</h2>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
          Optional contact email is only used for approval and payment notices.
        </p>
      </div>

      {invoice ? (
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Status:{" "}
          <span className="font-medium text-[var(--mpa-color-text-primary)]">
            {invoice.status.replaceAll("_", " ")}
          </span>
          {` · $${invoice.amount.toFixed(2)}`}
        </p>
      ) : null}

      {!locked ? (
        <>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Invoice amount *</span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-3 text-sm"
              placeholder="0.00"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium">Invoice number (optional)</span>
            <input
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              className="w-full rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-3 text-sm"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium">Email for notices (optional)</span>
            <input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="w-full rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-3 text-sm"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium">Notes (optional)</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] p-3 text-sm"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium">PDF invoice</span>
            <input
              type="file"
              accept="application/pdf,.pdf"
              disabled={busy}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setBusy(true);
                void uploadFile(file, "pdf")
                  .then((path) => {
                    setPdfPath(path);
                    setMessage("PDF attached.");
                  })
                  .catch((err: unknown) => setMessage(err instanceof Error ? err.message : "PDF upload failed"))
                  .finally(() => setBusy(false));
                e.target.value = "";
              }}
              className="block w-full text-sm"
            />
            {pdfPath ? <p className="text-xs text-[var(--mpa-color-text-secondary)]">PDF attached</p> : null}
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium">Photos (optional)</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              disabled={busy || photoPaths.length >= 12}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setBusy(true);
                void uploadFile(file, "photo")
                  .then((path) => setPhotoPaths((prev) => [...prev, path].slice(0, 12)))
                  .catch((err: unknown) => setMessage(err instanceof Error ? err.message : "Photo upload failed"))
                  .finally(() => setBusy(false));
                e.target.value = "";
              }}
              className="block w-full text-sm"
            />
            {photoPaths.length > 0 ? (
              <p className="text-xs text-[var(--mpa-color-text-secondary)]">{photoPaths.length} photo(s)</p>
            ) : null}
          </label>

          <Button type="button" className="w-full" disabled={busy} onClick={() => void submitInvoice()}>
            {busy ? "Submitting…" : invoice?.status === "revision_requested" ? "Resubmit invoice" : "Submit invoice"}
          </Button>
        </>
      ) : null}

      {message ? <p className="text-sm text-[var(--mpa-color-text-secondary)]">{message}</p> : null}
    </div>
  );
}
