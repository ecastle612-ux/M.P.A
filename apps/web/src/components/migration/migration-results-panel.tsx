"use client";

import Link from "next/link";
import { Button, Card } from "@mpa/ui";
import type { MigrationJobRecord } from "../../lib/migration/contracts";
import { downloadImportLog } from "../../lib/migration/template-csv";

export function MigrationResultsPanel({
  job,
  canRollback,
  onRollback,
  busy
}: {
  job: MigrationJobRecord;
  canRollback: boolean;
  onRollback: () => void;
  busy?: boolean;
}) {
  return (
    <Card className="space-y-4 p-5">
      <div>
        <h2 className="font-display text-xl font-semibold text-[var(--mpa-color-text-primary)]">
          Imported successfully
        </h2>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
          Your portfolio records are now live in M.P.A. — Properties, Residents, Leases, Maintenance, Financials,
          Facility, Timeline, Command Center, and Operations Center all use the same data.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Imported" value={job.progressImported} tone="success" />
        <Metric label="Warnings / skipped review" value={job.progressWarnings} tone="warning" />
        <Metric label="Errors" value={job.progressErrors} tone="danger" />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={busy}
          onClick={() =>
            downloadImportLog({
              jobNumber: job.jobNumber,
              summary: job.summary,
              progressImported: job.progressImported,
              progressWarnings: job.progressWarnings,
              progressErrors: job.progressErrors
            })
          }
        >
          Download import log
        </Button>
        {canRollback ? (
          <Button type="button" variant="ghost" disabled={busy} onClick={onRollback}>
            Roll back this migration
          </Button>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        <Link href="/properties">
          <Button size="sm">Open Properties</Button>
        </Link>
        <Link href="/tenants">
          <Button size="sm" variant="secondary">
            Open Residents
          </Button>
        </Link>
        <Link href="/leases">
          <Button size="sm" variant="secondary">
            Open Leases
          </Button>
        </Link>
        <Link href="/financials">
          <Button size="sm" variant="secondary">
            Open Financials
          </Button>
        </Link>
        <Link href="/dashboard">
          <Button size="sm" variant="ghost">
            Operations Center
          </Button>
        </Link>
      </div>
    </Card>
  );
}

function Metric({
  label,
  value,
  tone
}: {
  label: string;
  value: number;
  tone: "success" | "warning" | "danger";
}) {
  const color =
    tone === "success" ? "text-emerald-700" : tone === "warning" ? "text-amber-700" : "text-red-700";
  return (
    <div className="rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-subtle)] p-3">
      <p className="text-xs text-[var(--mpa-color-text-secondary)]">{label}</p>
      <p className={`font-display text-2xl font-semibold ${color}`}>{value}</p>
    </div>
  );
}
