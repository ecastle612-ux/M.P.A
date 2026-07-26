"use client";

import { useMemo, useState } from "react";
import { Button, Card, Input } from "@mpa/ui";
import {
  FACILITY_REPORT_CATALOG,
  type FacilityReportModel,
  type FacilityReportType
} from "../../lib/facility/reports-contracts";

type PropertyOption = { id: string; name: string };

export function FacilityReportsPanel({ properties }: { properties: PropertyOption[] }) {
  const now = useMemo(() => new Date(), []);
  const [reportType, setReportType] = useState<FacilityReportType>("technician_activity");
  const [propertyId, setPropertyId] = useState(properties[0]?.id ?? "");
  const [year, setYear] = useState(String(now.getUTCFullYear()));
  const [month, setMonth] = useState(String(now.getUTCMonth() + 1));
  const [report, setReport] = useState<FacilityReportModel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/facility/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportType,
          propertyId,
          year: Number.parseInt(year, 10),
          month: Number.parseInt(month, 10)
        })
      });
      const payload = (await response.json().catch(() => null)) as {
        report?: FacilityReportModel;
        error?: string;
      } | null;
      if (!response.ok || !payload?.report) {
        throw new Error(payload?.error ?? "Could not generate report");
      }
      setReport(payload.report);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not generate report");
      setReport(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--mpa-color-text-primary)]">Facility reports</h1>
        <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
          Printable operational reports for technicians, inventory, assets, and monthly building activity.
        </p>
      </div>

      <Card className="space-y-3 print:hidden">
        <label className="block space-y-1">
          <span className="text-sm font-medium">Report</span>
          <select
            value={reportType}
            onChange={(event) => setReportType(event.target.value as FacilityReportType)}
            className="w-full rounded-md border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] px-3 py-2 text-sm"
          >
            {FACILITY_REPORT_CATALOG.map((item) => (
              <option key={item.type} value={item.type}>
                {item.title}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Building / site</span>
          <select
            value={propertyId}
            onChange={(event) => setPropertyId(event.target.value)}
            className="w-full rounded-md border border-[var(--mpa-color-border-subtle)] bg-[var(--mpa-color-bg-surface)] px-3 py-2 text-sm"
          >
            {properties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.name}
              </option>
            ))}
          </select>
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1">
            <span className="text-sm font-medium">Year</span>
            <Input type="number" value={year} onChange={(event) => setYear(event.target.value)} />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Month</span>
            <Input type="number" min={1} max={12} value={month} onChange={(event) => setMonth(event.target.value)} />
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" disabled={busy || !propertyId} onClick={() => void generate()}>
            {busy ? "Generating…" : "Generate"}
          </Button>
          {report ? (
            <Button type="button" variant="secondary" onClick={() => window.print()}>
              Print
            </Button>
          ) : null}
        </div>
        {error ? <p className="text-sm text-[var(--mpa-color-status-danger)]">{error}</p> : null}
      </Card>

      {report ? (
        <Card className="space-y-4" id="facility-report-print">
          <div>
            <h2 className="text-xl font-semibold">{report.title}</h2>
            <p className="text-sm text-[var(--mpa-color-text-secondary)]">
              {report.organizationName} · {report.propertyName} · {report.periodLabel}
            </p>
            <p className="text-xs text-[var(--mpa-color-text-tertiary)]">
              Generated {new Date(report.generatedAt).toLocaleString()}
            </p>
          </div>
          <dl className="grid gap-2 sm:grid-cols-2">
            {report.totals.map((total) => (
              <div key={total.label} className="rounded-md border border-[var(--mpa-color-border-default)] px-3 py-2">
                <dt className="text-xs text-[var(--mpa-color-text-tertiary)]">{total.label}</dt>
                <dd className="text-lg font-semibold">{total.value}</dd>
              </div>
            ))}
          </dl>
          {report.sections.map((section) => (
            <div key={section.id} className="space-y-2">
              <h3 className="text-base font-semibold">{section.title}</h3>
              {section.lines.length === 0 ? (
                <p className="text-sm text-[var(--mpa-color-text-secondary)]">No rows for this section.</p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {section.lines.map((line) => (
                    <li key={line.id} className="flex flex-wrap justify-between gap-2 border-b border-[var(--mpa-color-border-subtle)] py-1">
                      <span>{line.label}</span>
                      <span className="text-[var(--mpa-color-text-secondary)]">{line.detail}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
          {report.notes.length > 0 ? (
            <ul className="list-disc space-y-1 pl-5 text-xs text-[var(--mpa-color-text-secondary)]">
              {report.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          ) : null}
        </Card>
      ) : null}
    </div>
  );
}
