"use client";

import { Button } from "@mpa/ui";
import type { ReportModel } from "../../lib/reporting/contracts";
import { ReportDocument } from "./report-document";

export function ReportPreview({
  model,
  generating,
  onGenerate,
  onDownload,
  onClose
}: {
  model: ReportModel;
  generating: boolean;
  onGenerate: () => void;
  onDownload: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--mpa-color-bg-overlay)] p-3 sm:items-center sm:p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Report preview"
        className="flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface-muted)] shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface-elevated)] px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--mpa-color-text-tertiary)]">
              Preview · Owner-ready
            </p>
            <h2 className="font-display text-xl font-semibold text-[var(--mpa-color-text-primary)]">
              {model.identity.reportTitle}
            </h2>
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">
              {model.identity.propertyName} · {model.identity.periodLabel}
            </p>
          </div>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="overflow-y-auto px-4 py-5 sm:px-6">
          <ReportDocument model={model} />
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface-elevated)] px-5 py-4">
          <Button variant="secondary" disabled={generating} onClick={onGenerate}>
            {generating ? "Generating…" : "Generate PDF · Save to Vault"}
          </Button>
          <Button disabled={generating} onClick={onDownload}>
            Download PDF
          </Button>
        </div>
      </div>
    </div>
  );
}
