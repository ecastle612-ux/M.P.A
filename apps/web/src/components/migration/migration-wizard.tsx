"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card, Input, Select } from "@mpa/ui";
import {
  MIGRATION_ENTITY_TYPES,
  MIGRATION_SOURCE_SOFTWARE,
  type MigrationEntityType,
  type MigrationImportFileRecord,
  type MigrationJobRecord,
  type MigrationReviewItemRecord,
  type MigrationWizardStep,
  toMigrationSourceLabel,
  toMigrationStepLabel
} from "../../lib/migration/contracts";
import { MigrationReviewQueue } from "./migration-review-queue";

const STEP_ORDER: MigrationWizardStep[] = [
  "select_software",
  "upload",
  "map_columns",
  "preview",
  "import",
  "results",
  "review_exceptions"
];

export function MigrationWizard({
  job: initialJob,
  initialFiles,
  initialReviewItems,
  permissions
}: {
  job: MigrationJobRecord;
  initialFiles: MigrationImportFileRecord[];
  initialReviewItems: MigrationReviewItemRecord[];
  permissions: { canUpdate: boolean; canRollback: boolean; canDelete: boolean };
}) {
  const router = useRouter();
  const [job, setJob] = useState(initialJob);
  const [files, setFiles] = useState(initialFiles);
  const [reviewItems, setReviewItems] = useState(initialReviewItems);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previews, setPreviews] = useState<Array<Record<string, unknown>>>([]);
  const [entityType, setEntityType] = useState<MigrationEntityType>("property");
  const [columnMapsText, setColumnMapsText] = useState(
    JSON.stringify((initialJob.metadata["columnMaps"] as Record<string, unknown> | undefined) ?? {}, null, 2)
  );

  const currentStepIndex = STEP_ORDER.indexOf(job.currentStep);
  const nextStep = STEP_ORDER[currentStepIndex + 1];

  const guidance = useMemo(() => stepGuidance(job.currentStep, job), [job]);

  async function refreshJob() {
    const response = await fetch(`/api/migration/jobs/${job.id}`, { cache: "no-store" });
    if (!response.ok) return;
    const payload = (await response.json()) as {
      job?: MigrationJobRecord;
      files?: MigrationImportFileRecord[];
    };
    if (payload.job) setJob(payload.job);
    if (payload.files) setFiles(payload.files);
  }

  async function saveSourceSoftware(sourceSoftware: string) {
    setLoading(true);
    setError(null);
    const response = await fetch(`/api/migration/jobs/${job.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceSoftware, currentStep: "upload" })
    });
    setLoading(false);
    if (!response.ok) {
      setError("Could not save your software selection. Please try again.");
      return;
    }
    const payload = (await response.json()) as { job?: MigrationJobRecord };
    if (payload.job) setJob(payload.job);
  }

  async function uploadFile(selected: File) {
    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", selected);
    formData.append("entityType", entityType);
    const response = await fetch(`/api/migration/jobs/${job.id}/upload`, { method: "POST", body: formData });
    setLoading(false);
    if (!response.ok) {
      setError("Upload failed. Check that the file is CSV, Excel, or ZIP and try again.");
      return;
    }
    await refreshJob();
  }

  async function saveMapping(preview = false) {
    setLoading(true);
    setError(null);
    let columnMaps: Record<string, unknown>;
    try {
      columnMaps = JSON.parse(columnMapsText) as Record<string, unknown>;
    } catch {
      setLoading(false);
      setError("Column mapping must be valid JSON.");
      return;
    }
    const response = await fetch(`/api/migration/jobs/${job.id}/map`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ columnMaps, preview })
    });
    setLoading(false);
    if (!response.ok) {
      setError("Could not save column mapping.");
      return;
    }
    const payload = (await response.json()) as { previews?: Array<Record<string, unknown>>; job?: MigrationJobRecord };
    if (payload.previews) setPreviews(payload.previews);
    await refreshJob();
  }

  async function runImport() {
    setLoading(true);
    setError(null);
    const response = await fetch(`/api/migration/jobs/${job.id}/import`, { method: "POST" });
    setLoading(false);
    if (!response.ok) {
      setError("Import failed. Review your mapping and files, then try again.");
      return;
    }
    const payload = (await response.json()) as { job?: MigrationJobRecord };
    if (payload.job) setJob(payload.job);
    await loadReviewItems();
  }

  async function loadReviewItems() {
    const response = await fetch(`/api/migration/jobs/${job.id}/review`, { cache: "no-store" });
    if (!response.ok) return;
    const payload = (await response.json()) as { items?: MigrationReviewItemRecord[] };
    setReviewItems(payload.items ?? []);
  }

  async function rollbackJob() {
    if (!window.confirm("Roll back this migration? Imported records from this job will be soft-deleted.")) return;
    setLoading(true);
    const response = await fetch(`/api/migration/jobs/${job.id}/rollback`, { method: "POST" });
    setLoading(false);
    if (!response.ok) {
      setError("Rollback failed.");
      return;
    }
    await refreshJob();
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Link href="/migration" className="text-xs font-semibold text-[var(--mpa-color-brand-primary)] hover:underline">
          ← Back to Migration Center
        </Link>
        <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">{job.name}</h1>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          {job.jobNumber} · Step {currentStepIndex + 1} of {STEP_ORDER.length}: {toMigrationStepLabel(job.currentStep)}
        </p>
      </header>

      <ol className="flex flex-wrap gap-2">
        {STEP_ORDER.map((step, index) => (
          <li
            key={step}
            className={[
              "rounded-full px-3 py-1 text-xs font-medium",
              index <= currentStepIndex
                ? "bg-[var(--mpa-color-brand-primary)]/10 text-[var(--mpa-color-brand-primary)]"
                : "bg-[var(--mpa-color-bg-muted)] text-[var(--mpa-color-text-secondary)]"
            ].join(" ")}
          >
            {toMigrationStepLabel(step)}
          </li>
        ))}
      </ol>

      <Card className="p-5">
        <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">{guidance.title}</p>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">{guidance.body}</p>
        {guidance.next ? (
          <p className="mt-3 text-xs font-medium text-[var(--mpa-color-brand-primary)]">Next: {guidance.next}</p>
        ) : null}
      </Card>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {job.currentStep === "select_software" ? (
        <Card className="space-y-4 p-5">
          <label className="block text-sm font-medium text-[var(--mpa-color-text-primary)]">Previous property management software</label>
          <Select
            value={job.sourceSoftware}
            onChange={(event) => void saveSourceSoftware(event.target.value)}
            disabled={!permissions.canUpdate || loading}
          >
            {MIGRATION_SOURCE_SOFTWARE.map((source) => (
              <option key={source} value={source}>
                {toMigrationSourceLabel(source)}
              </option>
            ))}
          </Select>
        </Card>
      ) : null}

      {job.currentStep === "upload" || files.length > 0 ? (
        <Card className="space-y-4 p-5">
          <h2 className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">Upload export files</h2>
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-sm">
              <span className="mb-1 block text-[var(--mpa-color-text-secondary)]">Data type</span>
              <Select value={entityType} onChange={(event) => setEntityType(event.target.value as MigrationEntityType)}>
                {MIGRATION_ENTITY_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </Select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-[var(--mpa-color-text-secondary)]">File</span>
              <Input
                type="file"
                accept=".csv,.xlsx,.xls,.zip"
                disabled={!permissions.canUpdate || loading}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void uploadFile(file);
                }}
              />
            </label>
          </div>
          {files.length > 0 ? (
            <ul className="space-y-2 text-sm">
              {files.map((file) => (
                <li key={file.id} className="rounded-md bg-[var(--mpa-color-bg-muted)] px-3 py-2">
                  {file.originalFilename} · {file.entityType ?? "unassigned"} · {file.rowCount} rows
                </li>
              ))}
            </ul>
          ) : null}
        </Card>
      ) : null}

      {["map_columns", "preview", "import", "results", "review_exceptions"].includes(job.currentStep) ? (
        <Card className="space-y-4 p-5">
          <h2 className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">Column mapping (JSON)</h2>
          <textarea
            className="min-h-[180px] w-full rounded-md border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] p-3 font-mono text-xs"
            value={columnMapsText}
            onChange={(event) => setColumnMapsText(event.target.value)}
            disabled={!permissions.canUpdate || loading}
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled={!permissions.canUpdate || loading} onClick={() => void saveMapping(true)}>
              Preview import
            </Button>
            <Button type="button" variant="secondary" disabled={!permissions.canUpdate || loading} onClick={() => void saveMapping(false)}>
              Save mapping
            </Button>
          </div>
          {previews.length > 0 ? (
            <pre className="overflow-auto rounded-md bg-[var(--mpa-color-bg-muted)] p-3 text-xs">{JSON.stringify(previews, null, 2)}</pre>
          ) : null}
        </Card>
      ) : null}

      {["import", "results", "review_exceptions"].includes(job.currentStep) ? (
        <Card className="space-y-4 p-5">
          <h2 className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">Import results</h2>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            {job.progressImported} imported · {job.progressWarnings} warnings · {job.progressErrors} errors · {job.completionPct}% complete
          </p>
          {permissions.canUpdate && job.status !== "completed" && job.status !== "rolled_back" ? (
            <Button type="button" disabled={loading} onClick={() => void runImport()}>
              Run import
            </Button>
          ) : null}
          {permissions.canRollback && job.status === "completed" ? (
            <Button type="button" variant="secondary" disabled={loading} onClick={() => void rollbackJob()}>
              Roll back this migration
            </Button>
          ) : null}
        </Card>
      ) : null}

      {job.currentStep === "review_exceptions" || reviewItems.length > 0 ? (
        <MigrationReviewQueue
          jobId={job.id}
          items={reviewItems}
          canUpdate={permissions.canUpdate}
          onResolved={() => void loadReviewItems()}
        />
      ) : null}

      {nextStep && permissions.canUpdate ? (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="secondary"
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              await fetch(`/api/migration/jobs/${job.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentStep: nextStep })
              });
              setLoading(false);
              await refreshJob();
            }}
          >
            Continue to {toMigrationStepLabel(nextStep)}
          </Button>
        </div>
      ) : job.status === "completed" ? (
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className="inline-flex h-9 items-center justify-center rounded-[var(--mpa-radius-md)] bg-[var(--mpa-color-brand-primary)] px-4 text-sm font-medium text-[var(--mpa-color-text-inverse)]"
          >
            Go to Operations Center
          </Link>
          <Link
            href="/properties"
            className="inline-flex h-9 items-center justify-center rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-4 text-sm font-medium text-[var(--mpa-color-text-primary)]"
          >
            Review properties
          </Link>
        </div>
      ) : null}

      {permissions.canDelete ? (
        <button
          type="button"
          className="text-xs text-[var(--mpa-color-text-secondary)] hover:text-red-600"
          onClick={async () => {
            if (!window.confirm("Delete this migration job?")) return;
            await fetch(`/api/migration/jobs/${job.id}`, { method: "DELETE" });
            router.push("/migration");
          }}
        >
          Delete migration job
        </button>
      ) : null}
    </div>
  );
}

function stepGuidance(step: MigrationWizardStep, job: MigrationJobRecord) {
  switch (step) {
    case "select_software":
      return {
        title: "Tell us where you're coming from",
        body: "Choose your previous software so we can pre-fill column mappings.",
        next: "Upload your export files"
      };
    case "upload":
      return {
        title: "Upload your export files",
        body: "Add CSV, Excel, or ZIP exports for each data type — properties first, then units, tenants, and leases.",
        next: "Map columns to M.P.A. fields"
      };
    case "map_columns":
      return {
        title: "Confirm how columns map",
        body: "We auto-detected mappings from your software template. Adjust anything that looks off before previewing.",
        next: "Preview the import"
      };
    case "preview":
      return {
        title: "Preview before importing",
        body: "Review row counts, warnings, and sample rows. Fix mapping issues now to avoid surprises later.",
        next: "Run the import"
      };
    case "import":
      return {
        title: "Import your data",
        body: "We create records in M.P.A. and track everything so you can roll back if needed.",
        next: "Review results and exceptions"
      };
    case "results":
      return {
        title: "Import complete",
        body: `Imported ${job.progressImported} records with ${job.progressWarnings} warnings and ${job.progressErrors} errors.`,
        next: job.progressWarnings > 0 ? "Resolve exceptions in the review queue" : "Explore your portfolio in M.P.A."
      };
    case "review_exceptions":
      return {
        title: "Resolve exceptions",
        body: "Duplicates and validation issues need your decision — merge, keep existing, replace, or skip each row.",
        next: "Finish and review your portfolio"
      };
    default:
      return { title: "Migration in progress", body: "Follow the steps below.", next: null };
  }
}
