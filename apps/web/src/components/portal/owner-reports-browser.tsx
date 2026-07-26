"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { Badge, Card, EmptyState, Input } from "@mpa/ui";

import { StandaloneOpenLink } from "@/components/pwa/standalone-open-link";
import type { OwnerFinancialStatementRow } from "../../lib/owner-portal/financial-shared";
import type { OwnerReportListItem } from "../../lib/owner-portal/reports-shared";
import { OwnerStatementRow } from "./owner-statement-row";

function matchesReportSearch(report: OwnerReportListItem, query: string): boolean {
  if (!query) return true;
  const haystack =
    `${report.title} ${report.propertyName} ${report.reportTypeLabel} ${report.periodLabel}`.toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function OwnerReportRow({ report }: { report: OwnerReportListItem }) {
  return (
    <li>
      <Card variant="elevated" className="space-y-2 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">{report.title}</p>
            <p className="text-xs text-[var(--mpa-color-text-secondary)]">
              {report.reportTypeLabel} · {report.propertyName} · {report.periodLabel}
            </p>
            <p className="text-xs text-[var(--mpa-color-text-secondary)]">
              Generated {report.generatedAtLabel}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="neutral">{report.statusLabel}</Badge>
            <Badge variant={report.pdfAvailable ? "success" : "warning"}>
              {report.pdfAvailable ? "PDF available" : "PDF unavailable"}
            </Badge>
          </div>
        </div>
        {report.pdfAvailable && report.downloadHref ? (
          <p className="text-xs">
            <StandaloneOpenLink
              href={report.downloadHref}
              documentTitle={report.title}
              mode="viewer"
              className="font-medium text-[var(--mpa-color-text-link)] underline"
            >
              Download PDF
            </StandaloneOpenLink>
          </p>
        ) : (
          <p className="text-xs text-[var(--mpa-color-text-secondary)]">
            This report PDF is not available for download right now. Contact your property manager if you need
            a copy.
          </p>
        )}
      </Card>
    </li>
  );
}

export function OwnerReportsBrowser({
  reports,
  statements,
  properties,
  reportTypes,
  periods,
  loadNotes = []
}: {
  reports: OwnerReportListItem[];
  statements: OwnerFinancialStatementRow[];
  properties: Array<{ id: string; name: string }>;
  reportTypes: Array<{ id: string; label: string }>;
  periods: Array<{ key: string; label: string }>;
  loadNotes?: string[];
}) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [propertyId, setPropertyId] = useState("all");
  const [reportType, setReportType] = useState("all");
  const [periodKey, setPeriodKey] = useState("all");

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      if (propertyId !== "all" && report.propertyId !== propertyId) return false;
      if (reportType !== "all" && report.reportType !== reportType) return false;
      if (periodKey !== "all" && report.periodKey !== periodKey) return false;
      return matchesReportSearch(report, deferredQuery.trim());
    });
  }, [reports, propertyId, reportType, periodKey, deferredQuery]);

  const filteredStatements = useMemo(() => {
    if (reportType !== "all" && reportType !== "owner_statement") return [];
    const q = deferredQuery.trim().toLowerCase();
    return statements.filter((statement) => {
      if (propertyId !== "all" && statement.propertyId !== propertyId) return false;
      if (periodKey !== "all" && !statement.periodLabel.includes(periodKey)) return false;
      if (!q) return true;
      const haystack =
        `${statement.statementNumber} ${statement.propertyName} ${statement.periodLabel} owner statement`.toLowerCase();
      return haystack.includes(q);
    });
  }, [statements, propertyId, periodKey, reportType, deferredQuery]);

  const filtersActive =
    deferredQuery.trim().length > 0 ||
    propertyId !== "all" ||
    reportType !== "all" ||
    periodKey !== "all";

  return (
    <div className="space-y-6">
      {loadNotes.length > 0 ? (
        <ul className="space-y-1 text-xs text-[var(--mpa-color-text-secondary)]">
          {loadNotes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          aria-label="Search reports"
          placeholder="Search title, property, type, or period"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <label className="block space-y-1 text-xs text-[var(--mpa-color-text-secondary)]">
          <span>Property</span>
          <select
            className="w-full rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-3 py-2 text-sm text-[var(--mpa-color-text-primary)]"
            value={propertyId}
            onChange={(event) => setPropertyId(event.target.value)}
          >
            <option value="all">All properties</option>
            {properties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1 text-xs text-[var(--mpa-color-text-secondary)]">
          <span>Report type</span>
          <select
            className="w-full rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-3 py-2 text-sm text-[var(--mpa-color-text-primary)]"
            value={reportType}
            onChange={(event) => setReportType(event.target.value)}
          >
            <option value="all">All types</option>
            {reportTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1 text-xs text-[var(--mpa-color-text-secondary)]">
          <span>Reporting period</span>
          <select
            className="w-full rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface)] px-3 py-2 text-sm text-[var(--mpa-color-text-primary)]"
            value={periodKey}
            onChange={(event) => setPeriodKey(event.target.value)}
          >
            <option value="all">All periods</option>
            {periods.map((period) => (
              <option key={period.key} value={period.key}>
                {period.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <section className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">Vaulted reports</h2>
          <p className="text-xs text-[var(--mpa-color-text-secondary)]">
            {filteredReports.length} report{filteredReports.length === 1 ? "" : "s"}
            {filtersActive ? " matching filters" : ""}
          </p>
        </div>
        {reports.length === 0 ? (
          <EmptyState
            title="No reports available yet"
            description="Reports appear when your property manager generates and shares owner-facing PDFs for your properties."
          />
        ) : filteredReports.length === 0 ? (
          <EmptyState
            title="No matches"
            description="Try a different search term, property, report type, or reporting period."
          />
        ) : (
          <ul className="space-y-2">
            {filteredReports.map((report) => (
              <OwnerReportRow key={report.id} report={report} />
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">Owner statements</h2>
          <p className="text-xs text-[var(--mpa-color-text-secondary)]">
            {filteredStatements.length} statement{filteredStatements.length === 1 ? "" : "s"}
            {filtersActive ? " matching filters" : ""}
          </p>
        </div>
        {statements.length === 0 ? (
          <EmptyState
            title="No statements yet"
            description="Published owner statements for your properties from Accounting / Reports will appear here."
          />
        ) : filteredStatements.length === 0 ? (
          <EmptyState
            title="No matching statements"
            description="Try clearing the report type filter or adjusting search and period."
          />
        ) : (
          <ul className="space-y-2">
            {filteredStatements.map((statement) => (
              <OwnerStatementRow key={statement.id} statement={statement} />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
