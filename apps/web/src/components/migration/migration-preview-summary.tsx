"use client";

import { Card } from "@mpa/ui";
import type { MigrationEntityType } from "../../lib/migration/contracts";
import { toMigrationEntityLabel } from "../../lib/migration/guide";

export type PreviewSummaryItem = {
  entityType: MigrationEntityType;
  totalRows: number;
  validRows: number;
  warningRows: number;
  errorRows: number;
  sampleRows: Array<Record<string, string>>;
};

export function MigrationPreviewSummary({
  previews,
  onApproveLabel = "Looks good — continue to import"
}: {
  previews: PreviewSummaryItem[];
  onApproveLabel?: string;
}) {
  const totals = previews.reduce(
    (acc, item) => ({
      rows: acc.rows + item.totalRows,
      warnings: acc.warnings + item.warningRows,
      errors: acc.errors + item.errorRows
    }),
    { rows: 0, warnings: 0, errors: 0 }
  );

  if (previews.length === 0) {
    return (
      <Card className="space-y-2 border-dashed p-5">
        <h2 className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">No preview yet</h2>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Upload files and confirm column matches, then run preview to see counts before anything is imported.
        </p>
        <p className="text-xs text-[var(--mpa-color-text-secondary)]">
          Tip: start with Properties, then Units, Residents, and Leases for the smoothest path.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {previews.map((item) => (
          <Card key={item.entityType} className="space-y-1 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
              {toMigrationEntityLabel(item.entityType)}
            </p>
            <p className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">
              {item.totalRows}
            </p>
            <p className="text-xs text-[var(--mpa-color-text-secondary)]">
              {item.validRows} ready · {item.warningRows} warnings · {item.errorRows} errors
            </p>
          </Card>
        ))}
      </div>

      <Card className="space-y-2 p-4">
        <p className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">Import readiness</p>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          {totals.rows} total rows · {totals.warnings} warnings · {totals.errors} errors
        </p>
        {totals.errors > 0 ? (
          <p className="text-sm text-red-700">
            Fix rows with missing required fields (shown as errors) before importing. Download a template, correct the
            file, and re-upload that data type.
          </p>
        ) : (
          <p className="text-sm text-emerald-700">
            No blocking errors detected. {onApproveLabel}
          </p>
        )}
      </Card>

      {previews.map((item) =>
        item.sampleRows.length > 0 ? (
          <Card key={`${item.entityType}-sample`} className="space-y-2 overflow-auto p-4">
            <p className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">
              Sample {toMigrationEntityLabel(item.entityType).toLowerCase()}
            </p>
            <pre className="max-h-48 overflow-auto rounded-md bg-[var(--mpa-color-bg-surface-muted)] p-3 text-xs">
              {JSON.stringify(item.sampleRows, null, 2)}
            </pre>
          </Card>
        ) : null
      )}
    </div>
  );
}
