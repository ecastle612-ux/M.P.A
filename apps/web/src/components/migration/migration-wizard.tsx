"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card, Select } from "@mpa/ui";
import {
  CORE_UPLOAD_ENTITIES,
  entityUploadStatus,
  resolveGuidePhase,
  toMigrationEntityLabel
} from "../../lib/migration/guide";
import {
  MIGRATION_SOURCE_SOFTWARE,
  type ColumnMap,
  type MigrationEntityType,
  type MigrationImportFileRecord,
  type MigrationJobRecord,
  type MigrationReviewItemRecord,
  type MigrationWizardStep,
  toMigrationSourceLabel,
  toMigrationStepLabel
} from "../../lib/migration/contracts";
import { detectColumnMapping } from "../../lib/migration/mapping";
import { readApiError } from "../../lib/api/client-error";
import { ConfirmActionDialog } from "../trust/confirm-action-dialog";
import { ApiErrorAlert } from "../trust/validation-alert";
import { OperationalStatus } from "../trust/operational-status";
import { MigrationReviewQueue } from "./migration-review-queue";
import { MigrationGuideRail } from "./migration-guide-rail";
import { MigrationFileDropzone } from "./migration-file-dropzone";
import { MigrationColumnMapper } from "./migration-column-mapper";
import { MigrationPreviewSummary, type PreviewSummaryItem } from "./migration-preview-summary";
import { MigrationImportProgress } from "./migration-import-progress";
import { MigrationResultsPanel } from "./migration-results-panel";

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
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previews, setPreviews] = useState<PreviewSummaryItem[]>([]);
  const [entityType, setEntityType] = useState<MigrationEntityType>(() => {
    const status = entityUploadStatus(initialFiles);
    return status.find((entry) => !entry.uploaded)?.entityType ?? "property";
  });
  const [columnMaps, setColumnMaps] = useState<Partial<Record<MigrationEntityType, ColumnMap>>>(() => {
    const stored = (initialJob.metadata["columnMaps"] as Partial<Record<MigrationEntityType, ColumnMap>> | undefined) ?? {};
    return { ...stored };
  });
  const [confirmImport, setConfirmImport] = useState(false);
  const [confirmRollback, setConfirmRollback] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const currentStepIndex = STEP_ORDER.indexOf(job.currentStep);
  const nextStep = STEP_ORDER[currentStepIndex + 1];
  const activePhaseId = resolveGuidePhase(job.currentStep, files);
  const uploadChecklist = entityUploadStatus(files);

  const guidance = useMemo(() => stepGuidance(job.currentStep, job, uploadChecklist), [job, uploadChecklist]);

  async function refreshJob() {
    const response = await fetch(`/api/migration/jobs/${job.id}`, { cache: "no-store" });
    if (!response.ok) return;
    const payload = (await response.json()) as {
      job?: MigrationJobRecord;
      files?: MigrationImportFileRecord[];
    };
    if (payload.job) {
      setJob(payload.job);
      const stored =
        (payload.job.metadata["columnMaps"] as Partial<Record<MigrationEntityType, ColumnMap>> | undefined) ?? {};
      setColumnMaps((current) => ({ ...stored, ...current }));
    }
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
      const payload = await response.json().catch(() => ({}));
      setError(readApiError(payload, "Upload failed. Use CSV, Excel, or ZIP and try again."));
      return;
    }
    const refreshed = await fetch(`/api/migration/jobs/${job.id}`, { cache: "no-store" });
    if (refreshed.ok) {
      const payload = (await refreshed.json()) as {
        job?: MigrationJobRecord;
        files?: MigrationImportFileRecord[];
      };
      if (payload.job) setJob(payload.job);
      if (payload.files) {
        setFiles(payload.files);
        const uploaded = payload.files.find((file) => file.entityType === entityType);
        if (uploaded?.columnHeaders.length) {
          const detection = detectColumnMapping(uploaded.columnHeaders, entityType, job.sourceSoftware);
          setColumnMaps((current) => ({ ...current, [entityType]: detection.columnMap }));
        }
        const nextMissing = entityUploadStatus(payload.files).find((entry) => !entry.uploaded);
        if (nextMissing) setEntityType(nextMissing.entityType);
      }
    } else {
      await refreshJob();
    }
  }

  async function saveMapping(preview = false) {
    setLoading(true);
    setError(null);
    const response = await fetch(`/api/migration/jobs/${job.id}/map`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ columnMaps, preview })
    });
    setLoading(false);
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setError(readApiError(payload, "Could not save column mapping. Check required fields and retry."));
      return;
    }
    const payload = (await response.json()) as { previews?: PreviewSummaryItem[]; job?: MigrationJobRecord };
    if (payload.previews) setPreviews(payload.previews);
    await refreshJob();
  }

  async function runImport() {
    setConfirmImport(false);
    setImporting(true);
    setLoading(true);
    setError(null);
    // Ensure latest maps are saved before import
    await fetch(`/api/migration/jobs/${job.id}/map`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ columnMaps, preview: false })
    }).catch(() => undefined);

    const response = await fetch(`/api/migration/jobs/${job.id}/import`, { method: "POST" });
    setLoading(false);
    setImporting(false);
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setError(readApiError(payload, "Import failed. Review mapping and files, then try again."));
      return;
    }
    const payload = (await response.json()) as { job?: MigrationJobRecord };
    if (payload.job) setJob(payload.job);
    await loadReviewItems();
    await refreshJob();
  }

  async function loadReviewItems() {
    const response = await fetch(`/api/migration/jobs/${job.id}/review`, { cache: "no-store" });
    if (!response.ok) return;
    const payload = (await response.json()) as { items?: MigrationReviewItemRecord[] };
    setReviewItems(payload.items ?? []);
  }

  async function rollbackJob() {
    setConfirmRollback(false);
    setLoading(true);
    setError(null);
    const response = await fetch(`/api/migration/jobs/${job.id}/rollback`, { method: "POST" });
    setLoading(false);
    if (!response.ok) {
      setError("Rollback failed. Contact support if the portfolio looks inconsistent.");
      return;
    }
    await refreshJob();
  }

  async function advanceStep() {
    if (!nextStep) return;
    setLoading(true);
    await fetch(`/api/migration/jobs/${job.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentStep: nextStep })
    });
    setLoading(false);
    await refreshJob();
  }

  const blockingPreviewErrors = previews.reduce((sum, item) => sum + item.errorRows, 0);

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="space-y-3 lg:sticky lg:top-4 lg:self-start">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-brand-primary)]">
          Portfolio guide
        </p>
        <MigrationGuideRail activePhaseId={activePhaseId} />
      </aside>

      <div className="space-y-6">
        <header className="space-y-2">
          <Link
            href="/migration"
            className="text-xs font-semibold text-[var(--mpa-color-brand-primary)] hover:underline"
          >
            ← Back to Migration Center
          </Link>
          <h1 className="font-display text-2xl font-semibold text-[var(--mpa-color-text-primary)]">{job.name}</h1>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            {job.jobNumber} · Step {Math.max(1, currentStepIndex + 1)} of {STEP_ORDER.length}:{" "}
            {toMigrationStepLabel(job.currentStep)}
          </p>
        </header>

        <Card className="p-5">
          <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">{guidance.title}</p>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">{guidance.body}</p>
          {guidance.next ? (
            <p className="mt-3 text-xs font-medium text-[var(--mpa-color-brand-primary)]">Next: {guidance.next}</p>
          ) : null}
        </Card>

        {error ? <ApiErrorAlert message={error} /> : null}
        {loading && !importing ? <OperationalStatus message="Working…" /> : null}
        <MigrationImportProgress active={importing} completionPct={importing ? 35 : job.completionPct} />

        {job.currentStep === "select_software" ? (
          <Card className="space-y-4 p-5">
            <div>
              <h2 className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">Organization information</h2>
              <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
                Tell us which system you’re leaving. We’ll use that to recognize common column names automatically.
              </p>
            </div>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-[var(--mpa-color-text-primary)]">
                Previous property management software
              </span>
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
            </label>
          </Card>
        ) : null}

        {job.currentStep === "upload" || job.currentStep === "map_columns" || files.length > 0 ? (
          <Card className="space-y-5 p-5">
            <div>
              <h2 className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">Upload portfolio files</h2>
              <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
                Work through each list below. Nothing is written to your live portfolio until you approve the import.
              </p>
            </div>

            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {uploadChecklist.map((entry) => (
                <li
                  key={entry.entityType}
                  className={[
                    "rounded-[var(--mpa-radius-md)] border px-3 py-2 text-sm",
                    entry.uploaded
                      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                      : "border-[var(--mpa-color-border-subtle)]"
                  ].join(" ")}
                >
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => setEntityType(entry.entityType)}
                  >
                    <span className="font-medium">{entry.label}</span>
                    <span className="mt-0.5 block text-xs opacity-80">
                      {entry.uploaded ? `${entry.rowCount} rows ready` : "Not uploaded yet"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            <div className="rounded-[var(--mpa-radius-md)] border border-dashed border-[var(--mpa-color-border-default)] p-3 text-xs text-[var(--mpa-color-text-secondary)]">
              <p className="font-medium text-[var(--mpa-color-text-primary)]">Assets (coming later)</p>
              <p className="mt-1">
                Facility assets aren’t part of this import yet. After go-live, add them from Property / Unit facility
                tools.
              </p>
            </div>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-[var(--mpa-color-text-primary)]">Uploading now</span>
              <Select
                value={entityType}
                onChange={(event) => setEntityType(event.target.value as MigrationEntityType)}
                disabled={!permissions.canUpdate || loading}
              >
                {CORE_UPLOAD_ENTITIES.map((type) => (
                  <option key={type} value={type}>
                    {toMigrationEntityLabel(type)}
                  </option>
                ))}
              </Select>
            </label>

            <MigrationFileDropzone
              entityType={entityType}
              sourceSoftware={job.sourceSoftware}
              disabled={!permissions.canUpdate || loading}
              onFile={(file) => void uploadFile(file)}
            />

            {files.length > 0 ? (
              <ul className="space-y-2 text-sm">
                {files.map((file) => (
                  <li key={file.id} className="rounded-md bg-[var(--mpa-color-bg-surface-muted)] px-3 py-2">
                    {file.originalFilename} ·{" "}
                    {file.entityType ? toMigrationEntityLabel(file.entityType) : "Unassigned"} · {file.rowCount}{" "}
                    rows
                  </li>
                ))}
              </ul>
            ) : null}
          </Card>
        ) : null}

        {["map_columns", "preview", "import", "results", "review_exceptions"].includes(job.currentStep) ? (
          <Card className="space-y-5 p-5">
            {files.filter((file) => file.entityType && file.columnHeaders.length > 0).length === 0 ? (
              <p className="text-sm text-[var(--mpa-color-text-secondary)]">
                Upload at least one file above so we can suggest column matches.
              </p>
            ) : (
              files
                .filter((file) => file.entityType && file.columnHeaders.length > 0)
                .map((file) => (
                  <MigrationColumnMapper
                    key={file.id}
                    entityType={file.entityType as MigrationEntityType}
                    sourceSoftware={job.sourceSoftware}
                    headers={file.columnHeaders}
                    value={columnMaps[file.entityType as MigrationEntityType] ?? {}}
                    disabled={!permissions.canUpdate || loading}
                    onChange={(next) =>
                      setColumnMaps((current) => ({
                        ...current,
                        [file.entityType as MigrationEntityType]: next
                      }))
                    }
                  />
                ))
            )}
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                disabled={!permissions.canUpdate || loading || files.length === 0}
                onClick={() => void saveMapping(true)}
              >
                Preview import
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={!permissions.canUpdate || loading || files.length === 0}
                onClick={() => void saveMapping(false)}
              >
                Save mapping
              </Button>
            </div>
          </Card>
        ) : null}

        {job.currentStep === "upload" || job.currentStep === "map_columns" || job.currentStep === "preview" ? (
          <Card className="space-y-3 p-5">
            <h2 className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">Beginning financial balances</h2>
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">
              Opening balances and owner statements stay in the Financials workspace after residents and leases are
              imported. We don’t create a separate balance file here — that keeps Accounting architecture unchanged.
            </p>
            <Link href="/financials" className="text-sm font-semibold text-[var(--mpa-color-brand-primary)] hover:underline">
              Open Financials after import →
            </Link>
          </Card>
        ) : null}

        {["preview", "import", "results", "review_exceptions"].includes(job.currentStep) || previews.length > 0 ? (
          <MigrationPreviewSummary previews={previews} />
        ) : null}

        {["import", "results", "review_exceptions"].includes(job.currentStep) ? (
          <Card className="space-y-4 p-5">
            <h2 className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">Run import</h2>
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">
              Approve the preview first. Import creates live records and keeps a rollback path for this job.
            </p>
            {permissions.canUpdate && job.status !== "completed" && job.status !== "rolled_back" ? (
              <Button
                type="button"
                disabled={loading || importing || (previews.length > 0 && blockingPreviewErrors > 0)}
                onClick={() => setConfirmImport(true)}
              >
                {importing ? "Importing…" : "Start import"}
              </Button>
            ) : null}
            {previews.length > 0 && blockingPreviewErrors > 0 ? (
              <p className="text-xs text-red-700">
                Resolve {blockingPreviewErrors} row error{blockingPreviewErrors === 1 ? "" : "s"} before importing.
              </p>
            ) : null}
          </Card>
        ) : null}

        {job.status === "completed" || job.currentStep === "results" ? (
          <MigrationResultsPanel
            job={job}
            canRollback={permissions.canRollback && job.status === "completed"}
            busy={loading}
            onRollback={() => setConfirmRollback(true)}
          />
        ) : null}

        {job.currentStep === "review_exceptions" || reviewItems.length > 0 ? (
          <MigrationReviewQueue
            jobId={job.id}
            items={reviewItems}
            canUpdate={permissions.canUpdate}
            onResolved={() => void loadReviewItems()}
          />
        ) : null}

        {nextStep && permissions.canUpdate && job.status !== "completed" ? (
          <div className="flex justify-end">
            <Button type="button" variant="secondary" disabled={loading || importing} onClick={() => void advanceStep()}>
              Continue to {toMigrationStepLabel(nextStep)}
            </Button>
          </div>
        ) : null}

        {permissions.canDelete ? (
          <button
            type="button"
            className="text-xs text-[var(--mpa-color-text-secondary)] hover:text-red-600"
            onClick={() => setConfirmDelete(true)}
          >
            Delete migration job
          </button>
        ) : null}

        <ConfirmActionDialog
          open={confirmImport}
          title="Start portfolio import?"
          consequence="M.P.A. will create properties, units, residents, leases, and vendors from your uploaded files using the column matches you approved. You can roll back this job afterward if needed."
          confirmLabel="Start import"
          busy={loading || importing}
          onCancel={() => setConfirmImport(false)}
          onConfirm={() => void runImport()}
        />
        <ConfirmActionDialog
          open={confirmRollback}
          title="Roll back this migration?"
          consequence="Imported records from this job will be soft-deleted. Related activity in the portfolio may change. This cannot be undone from this screen."
          confirmLabel="Roll back migration"
          tone="danger"
          busy={loading}
          onCancel={() => setConfirmRollback(false)}
          onConfirm={() => void rollbackJob()}
        />
        <ConfirmActionDialog
          open={confirmDelete}
          title="Delete this migration job?"
          consequence="The job record will be removed from Migration Center. Imported portfolio data is not automatically deleted unless you roll back first."
          confirmLabel="Delete job"
          tone="danger"
          busy={loading}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={async () => {
            setConfirmDelete(false);
            await fetch(`/api/migration/jobs/${job.id}`, { method: "DELETE" });
            router.push("/migration");
          }}
        />
      </div>
    </div>
  );
}

function stepGuidance(
  step: MigrationWizardStep,
  job: MigrationJobRecord,
  checklist: ReturnType<typeof entityUploadStatus>
) {
  const remaining = checklist.filter((entry) => !entry.uploaded).map((entry) => entry.label);
  switch (step) {
    case "select_software":
      return {
        title: "Start with your organization context",
        body: "Choosing your previous software helps M.P.A. recognize columns like Property Name, Unit, Email Address, and Lease Start — so you spend less time mapping.",
        next: "Upload Properties, then Units, Residents, and Leases"
      };
    case "upload":
      return {
        title: "Add your portfolio files",
        body:
          remaining.length > 0
            ? `Still needed: ${remaining.join(", ")}. Drag a CSV or Excel file onto the drop zone, or download a template to fill in.`
            : "All core lists are uploaded. Continue to confirm column matches, then preview.",
        next: "Confirm column matches"
      };
    case "map_columns":
      return {
        title: "Confirm how columns match",
        body: "We auto-match common headers. Adjust anything that looks off — wrong matches create messy records later.",
        next: "Preview counts and sample rows"
      };
    case "preview":
      return {
        title: "Review before importing",
        body: "Approve the summary below. Errors block import; warnings can be resolved after. Beginning balances are handled in Financials after go-live.",
        next: "Start import when the summary looks right"
      };
    case "import":
      return {
        title: "Import into your live portfolio",
        body: "You’ll see progress while M.P.A. creates records. Stay on this page until finishing.",
        next: "Review results and any exceptions"
      };
    case "results":
      return {
        title: "Import complete",
        body: `Imported ${job.progressImported} records with ${job.progressWarnings} warnings and ${job.progressErrors} errors. Download the log for your records.`,
        next:
          job.progressWarnings > 0 || job.progressErrors > 0
            ? "Resolve exceptions in the review queue"
            : "Open Properties and verify a few records"
      };
    case "review_exceptions":
      return {
        title: "Resolve exceptions",
        body: "Duplicates and missing fields wait here. Skip, keep existing, or replace — one clear decision at a time.",
        next: "Finish and open the go-live checklist"
      };
    default:
      return {
        title: "Migration in progress",
        body: "Follow the portfolio guide — we’ll always show where you are and what’s next.",
        next: null
      };
  }
}
