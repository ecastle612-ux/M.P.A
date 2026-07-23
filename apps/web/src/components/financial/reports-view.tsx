"use client";

import { useEffect, useState, useTransition } from "react";
import { Badge, Button, Card, PageHeader, useToast } from "@mpa/ui";
import {
  REPORT_CATALOG,
  type RecognitionBasis,
  type ReportCatalogItem,
  type ReportJobRecord,
  type ReportModel,
  type ReportType,
  type ReportVersionSummary
} from "../../lib/reporting/contracts";
import { ReportPreview } from "./report-preview";

type PropertyOption = { id: string; name: string };

function currentYearMonth() {
  const now = new Date();
  return { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 };
}

export function ReportsView({
  initialProperties
}: {
  initialProperties: PropertyOption[];
}) {
  const { notify } = useToast();
  const initial = currentYearMonth();
  const [properties] = useState(initialProperties);
  const [propertyId, setPropertyId] = useState(initialProperties[0]?.id ?? "");
  const [year, setYear] = useState(initial.year);
  const [month, setMonth] = useState(initial.month);
  const [basis, setBasis] = useState<RecognitionBasis>("cash");
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [previewModel, setPreviewModel] = useState<ReportModel | null>(null);
  const [activeType, setActiveType] = useState<ReportType | null>(null);
  const [versions, setVersions] = useState<ReportVersionSummary[] | null>(null);
  const [versionsFor, setVersionsFor] = useState<ReportType | null>(null);
  const [statusByType, setStatusByType] = useState<Record<string, string>>({});
  const [generating, startGenerate] = useTransition();
  const [previewing, startPreview] = useTransition();

  useEffect(() => {
    if (!propertyId) return;
    let cancelled = false;
    const controller = new AbortController();
    void fetch(
      `/api/reporting/counts?propertyId=${encodeURIComponent(propertyId)}&year=${year}&month=${month}`,
      { signal: controller.signal }
    )
      .then(async (response) => {
        if (!response.ok) return;
        const data = (await response.json()) as { counts: Record<string, number> };
        if (!cancelled) setCounts(data.counts ?? {});
      })
      .catch(() => {
        /* aborted or network — ignore */
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [propertyId, year, month]);

  function runPreview(type: ReportType) {
    if (!propertyId) {
      notify({ title: "Select a property", variant: "warning" });
      return;
    }
    setActiveType(type);
    startPreview(async () => {
      setStatusByType((prev) => ({ ...prev, [type]: "Loading preview…" }));
      try {
        const response = await fetch("/api/reporting/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reportType: type,
            propertyId,
            year,
            month,
            recognitionBasis: basis
          })
        });
        const data = (await response.json()) as { reportModel?: ReportModel; error?: string };
        if (!response.ok || !data.reportModel) {
          throw new Error(data.error ?? "Preview failed");
        }
        setPreviewModel(data.reportModel);
        setStatusByType((prev) => ({ ...prev, [type]: "Preview ready" }));
      } catch (error) {
        const message = error instanceof Error ? error.message : "Preview failed";
        setStatusByType((prev) => ({ ...prev, [type]: message }));
        notify({ title: "Preview failed", description: message, variant: "danger" });
      }
    });
  }

  function runGenerate(type: ReportType, fromPreview = false) {
    if (!propertyId) {
      notify({ title: "Select a property", variant: "warning" });
      return;
    }
    startGenerate(async () => {
      setStatusByType((prev) => ({ ...prev, [type]: "Generating PDF…" }));
      try {
        const response = await fetch("/api/reporting/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reportType: type,
            propertyId,
            year,
            month,
            recognitionBasis: basis,
            persistToVault: true,
            wait: true
          })
        });
        const data = (await response.json()) as { job?: ReportJobRecord; error?: string };
        if (!response.ok || !data.job) {
          throw new Error(data.error ?? "Generation failed");
        }
        if (data.job.status === "failed") {
          throw new Error(data.job.error?.message ?? "Generation failed");
        }
        const version = data.job.result?.version;
        setStatusByType((prev) => ({
          ...prev,
          [type]: data.job?.result?.cached
            ? "Cached PDF ready"
            : version
              ? `Saved v${version.version}`
              : "Generated"
        }));
        setCounts((prev) => ({
          ...prev,
          [type]: (prev[type] ?? 0) + (data.job?.result?.cached ? 0 : version ? 1 : 0)
        }));
        if (fromPreview && data.job.result?.reportModel) {
          setPreviewModel(data.job.result.reportModel);
        }
        notify({
          title: "Report ready",
          description: version ? `${version.title} saved to Document Vault.` : "PDF generated.",
          variant: "success"
        });
        if (version) {
          window.open(version.downloadPath, "_blank", "noopener,noreferrer");
        } else if (data.job.result?.pdfBase64) {
          downloadBase64Pdf(data.job.result.pdfBase64, `${type}.pdf`);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Generation failed";
        setStatusByType((prev) => ({ ...prev, [type]: message }));
        notify({ title: "Generation failed", description: message, variant: "danger" });
      }
    });
  }

  function openVersions(type: ReportType) {
    if (!propertyId) {
      notify({ title: "Select a property", variant: "warning" });
      return;
    }
    setVersionsFor(type);
    void fetch(
      `/api/reporting/versions?propertyId=${encodeURIComponent(propertyId)}&reportType=${type}&year=${year}&month=${month}`
    )
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load versions");
        const data = (await response.json()) as { versions: ReportVersionSummary[] };
        setVersions(data.versions ?? []);
      })
      .catch((error: unknown) => {
        notify({
          title: "Versions unavailable",
          description: error instanceof Error ? error.message : "Could not load versions",
          variant: "danger"
        });
      });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        overline="Accounting"
        title="Reports"
        description="Professional monthly reports from live accounting data — preview, generate, and vault without changing bookkeeping workflows."
      />

      <Card className="space-y-4 p-5">
        <div className="grid gap-4 md:grid-cols-4">
          <label className="block text-sm">
            <span className="mb-1 block text-[var(--mpa-color-text-secondary)]">Property</span>
            <select
              className="w-full rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-surface-elevated)] px-3 py-2"
              value={propertyId}
              onChange={(event) => setPropertyId(event.target.value)}
            >
              {properties.length === 0 ? <option value="">No properties</option> : null}
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-[var(--mpa-color-text-secondary)]">Year</span>
            <input
              type="number"
              className="w-full rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-surface-elevated)] px-3 py-2"
              value={year}
              onChange={(event) => setYear(Number(event.target.value))}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-[var(--mpa-color-text-secondary)]">Month</span>
            <select
              className="w-full rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-surface-elevated)] px-3 py-2"
              value={month}
              onChange={(event) => setMonth(Number(event.target.value))}
            >
              {Array.from({ length: 12 }, (_, index) => index + 1).map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <fieldset className="text-sm">
            <legend className="mb-1 text-[var(--mpa-color-text-secondary)]">Recognition</legend>
            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                variant={basis === "cash" ? "primary" : "secondary"}
                onClick={() => setBasis("cash")}
              >
                Cash
              </Button>
              <Button
                type="button"
                variant={basis === "accrual" ? "primary" : "secondary"}
                onClick={() => setBasis("accrual")}
              >
                Accrual
              </Button>
            </div>
          </fieldset>
        </div>
      </Card>

      {properties.length === 0 ? (
        <Card className="p-6">
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            Add a property before generating financial reports.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {REPORT_CATALOG.map((item) => (
            <ReportCard
              key={item.type}
              item={item}
              savedCount={counts[item.type] ?? 0}
              {...(statusByType[item.type] ? { status: statusByType[item.type] } : {})}
              busy={generating || previewing}
              onPreview={() => runPreview(item.type)}
              onGenerate={() => runGenerate(item.type)}
              onVersions={() => openVersions(item.type)}
            />
          ))}
        </div>
      )}

      {previewModel && activeType ? (
        <ReportPreview
          model={previewModel}
          generating={generating}
          onClose={() => setPreviewModel(null)}
          onGenerate={() => runGenerate(activeType, true)}
          onDownload={() => runGenerate(activeType, true)}
        />
      ) : null}

      {versions && versionsFor ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--mpa-color-bg-overlay)] p-4 sm:items-center">
          <Card className="max-h-[80vh] w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--mpa-color-border-default)] px-4 py-3">
              <h3 className="font-display text-lg font-semibold">Previous versions</h3>
              <Button variant="ghost" onClick={() => setVersions(null)}>
                Close
              </Button>
            </div>
            <ul className="max-h-[60vh] divide-y divide-[var(--mpa-color-border-default)] overflow-y-auto">
              {versions.length === 0 ? (
                <li className="px-4 py-6 text-sm text-[var(--mpa-color-text-secondary)]">
                  No saved versions for this period.
                </li>
              ) : (
                versions.map((version) => (
                  <li key={version.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">
                        v{version.version} · {version.title}
                      </p>
                      <p className="text-xs text-[var(--mpa-color-text-tertiary)]">
                        {new Date(version.generatedAt).toLocaleString()}
                      </p>
                    </div>
                    <a href={version.downloadPath} target="_blank" rel="noreferrer">
                      <Button variant="secondary">Download</Button>
                    </a>
                  </li>
                ))
              )}
            </ul>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

function ReportCard({
  item,
  savedCount,
  status,
  busy,
  onPreview,
  onGenerate,
  onVersions
}: {
  item: ReportCatalogItem;
  savedCount: number;
  status?: string;
  busy: boolean;
  onPreview: () => void;
  onGenerate: () => void;
  onVersions: () => void;
}) {
  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]">
            {item.title}
          </h2>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">{item.description}</p>
        </div>
        <Badge variant="info">{savedCount} saved</Badge>
      </div>
      {item.supportsRecognitionBasis ? (
        <p className="text-xs text-[var(--mpa-color-text-tertiary)]">
          Uses the Cash / Accrual toggle above (default Cash).
        </p>
      ) : (
        <p className="text-xs text-[var(--mpa-color-text-tertiary)]">Period snapshot — recognition toggle N/A.</p>
      )}
      {status ? <p className="text-xs text-[var(--mpa-color-text-secondary)]">{status}</p> : null}
      <div className="mt-auto flex flex-wrap gap-2">
        <Button variant="secondary" disabled={busy} onClick={onPreview}>
          Preview
        </Button>
        <Button disabled={busy} onClick={onGenerate}>
          Generate
        </Button>
        <Button variant="ghost" disabled={busy} onClick={onVersions}>
          View Previous Versions
        </Button>
      </div>
    </Card>
  );
}

function downloadBase64Pdf(base64: string, filename: string) {
  const link = document.createElement("a");
  link.href = `data:application/pdf;base64,${base64}`;
  link.download = filename;
  link.click();
}
