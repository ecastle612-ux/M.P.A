"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  EXECUTIVE_PERSONA_LABELS,
  EXECUTIVE_PERSONAS,
  REPORT_AREA_LABELS,
  REPORT_AREAS,
  type ExecutivePersona,
  type ReportArea,
  type ReportingSnapshot
} from "@mpa/shared";
import { Badge, Button, EmptyState, Input, Skeleton } from "@mpa/ui";

const linkFocus =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mpa-color-border-focus,#0F6B56)] focus-visible:ring-offset-2";

function toneClass(tone?: string): string {
  switch (tone) {
    case "attention":
      return "border-[var(--mpa-color-status-danger)]/40 bg-[var(--mpa-color-status-danger-subtle)]";
    case "positive":
      return "border-[var(--mpa-color-status-success)]/35 bg-[var(--mpa-color-status-success-subtle)]";
    case "watch":
      return "border-[var(--mpa-color-status-warning)]/40 bg-[var(--mpa-color-status-warning-subtle)]";
    default:
      return "border-[var(--mpa-color-border-default)] bg-white";
  }
}

function trendGlyph(direction?: "up" | "down" | "flat"): string {
  if (direction === "up") return "↑";
  if (direction === "down") return "↓";
  if (direction === "flat") return "→";
  return "";
}

export function ReportsWorkspace() {
  const [snapshot, setSnapshot] = useState<ReportingSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [persona, setPersona] = useState<ExecutivePersona | "auto">("auto");
  const [area, setArea] = useState<ReportArea | "all">("all");
  const [propertyId, setPropertyId] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [exporting, setExporting] = useState<"pdf" | "csv" | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (persona !== "auto") params.set("persona", persona);
    if (area !== "all") params.set("area", area);
    if (propertyId) params.set("propertyId", propertyId);
    if (category) params.set("category", category);
    if (status) params.set("status", status);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    return params.toString();
  }, [persona, area, propertyId, category, status, dateFrom, dateTo]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch(`/api/shared/reports${queryString ? `?${queryString}` : ""}`);
        const body = await response.json();
        if (!response.ok) {
          throw new Error(body.error ?? "Failed to load reporting snapshot");
        }
        if (!cancelled) {
          setSnapshot(body.snapshot as ReportingSnapshot);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setSnapshot(null);
          setError(err instanceof Error ? err.message : "Failed to load reports");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [queryString]);

  async function download(format: "pdf" | "csv") {
    setExporting(format);
    try {
      const qs = queryString ? `${queryString}&format=${format}` : `format=${format}`;
      const response = await fetch(`/api/shared/reports/export?${qs}`);
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? `Export failed (${response.status})`);
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        format === "csv"
          ? "mpa-reporting-export.csv"
          : `mpa-executive-briefing.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(null);
    }
  }

  if (loading && !snapshot) {
    return (
      <div className="mx-auto max-w-6xl space-y-4">
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error && !snapshot) {
    return <EmptyState title="Reporting unavailable" description={error} />;
  }

  if (!snapshot) {
    return <EmptyState title="No reporting data" description="Try again shortly." />;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 print:max-w-none">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
            Reporting & Analytics
          </p>
          <h1 className="font-display text-3xl font-semibold text-[var(--mpa-color-text-primary)] md:text-4xl">
            {snapshot.attentionQuestion}
          </h1>
          <p className="text-sm text-[var(--mpa-color-text-secondary)]">
            Insights first. Charts only when they support a decision.{" "}
            {snapshot.organizationName ? (
              <span className="text-[var(--mpa-color-text-primary)]">{snapshot.organizationName}</span>
            ) : null}{" "}
            · {EXECUTIVE_PERSONA_LABELS[snapshot.persona]}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <Button type="button" variant="secondary" disabled={!!exporting} onClick={() => void download("csv")}>
            {exporting === "csv" ? "Exporting…" : "Export CSV"}
          </Button>
          <Button type="button" disabled={!!exporting} onClick={() => void download("pdf")}>
            {exporting === "pdf" ? "Exporting…" : "Export PDF"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => window.print()}>
            Print
          </Button>
        </div>
      </header>

      <section
        aria-label="Filters"
        className="grid gap-3 rounded-lg border border-[var(--mpa-color-border-default)] bg-white p-4 print:hidden md:grid-cols-3 lg:grid-cols-6"
      >
        <label className="space-y-1 text-xs">
          <span className="font-medium text-[var(--mpa-color-text-secondary)]">Executive view</span>
          <select
            className="w-full rounded-md border border-[var(--mpa-color-border-default)] bg-white px-2 py-2 text-sm"
            value={persona}
            onChange={(e) => setPersona(e.target.value as ExecutivePersona | "auto")}
          >
            <option value="auto">Auto (from role)</option>
            {EXECUTIVE_PERSONAS.map((p) => (
              <option key={p} value={p}>
                {EXECUTIVE_PERSONA_LABELS[p]}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-xs">
          <span className="font-medium text-[var(--mpa-color-text-secondary)]">Area</span>
          <select
            className="w-full rounded-md border border-[var(--mpa-color-border-default)] bg-white px-2 py-2 text-sm"
            value={area}
            onChange={(e) => setArea(e.target.value as ReportArea | "all")}
          >
            <option value="all">All for this role</option>
            {REPORT_AREAS.map((a) => (
              <option key={a} value={a}>
                {REPORT_AREA_LABELS[a]}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-xs">
          <span className="font-medium text-[var(--mpa-color-text-secondary)]">Property</span>
          <select
            className="w-full rounded-md border border-[var(--mpa-color-border-default)] bg-white px-2 py-2 text-sm"
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
          >
            <option value="">All properties</option>
            {snapshot.filterOptions.properties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-xs">
          <span className="font-medium text-[var(--mpa-color-text-secondary)]">Category</span>
          <select
            className="w-full rounded-md border border-[var(--mpa-color-border-default)] bg-white px-2 py-2 text-sm"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">All categories</option>
            {snapshot.filterOptions.categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-xs">
          <span className="font-medium text-[var(--mpa-color-text-secondary)]">Status</span>
          <select
            className="w-full rounded-md border border-[var(--mpa-color-border-default)] bg-white px-2 py-2 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All statuses</option>
            {snapshot.filterOptions.statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="space-y-1 text-xs">
            <span className="font-medium text-[var(--mpa-color-text-secondary)]">From</span>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </label>
          <label className="space-y-1 text-xs">
            <span className="font-medium text-[var(--mpa-color-text-secondary)]">To</span>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </label>
        </div>
      </section>

      {error ? (
        <p className="text-sm text-[var(--mpa-color-status-danger)]" role="alert">
          {error}
        </p>
      ) : null}

      <section aria-label="Insights" className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <h2 className="font-display text-xl font-semibold">Insights</h2>
          <p className="text-xs text-[var(--mpa-color-text-secondary)]">
            Updated {new Date(snapshot.generatedAt).toLocaleString()}
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {snapshot.insights.map((insight) => (
            <article
              key={insight.id}
              className={`rounded-lg border p-4 ${toneClass(insight.tone)}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
                    {REPORT_AREA_LABELS[insight.area]}
                  </p>
                  <h3 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">
                    {insight.headline}
                  </h3>
                  <p className="text-sm text-[var(--mpa-color-text-secondary)]">{insight.detail}</p>
                  <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">
                    Decision: {insight.decision}
                  </p>
                </div>
                {insight.metricValue ? (
                  <div className="shrink-0 text-right">
                    <p className="text-2xl font-semibold tabular-nums">
                      {trendGlyph(insight.trendDirection)} {insight.metricValue}
                    </p>
                    {insight.metricLabel ? (
                      <p className="text-xs text-[var(--mpa-color-text-secondary)]">{insight.metricLabel}</p>
                    ) : null}
                  </div>
                ) : null}
              </div>
              {insight.href ? (
                <Link href={insight.href} className={`mt-3 inline-flex text-sm font-medium underline ${linkFocus}`}>
                  Take action
                </Link>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section aria-label="Reporting areas" className="space-y-6">
        <h2 className="font-display text-xl font-semibold">Reporting areas</h2>
        {snapshot.areas.map((block) => (
          <article
            key={block.area}
            className="space-y-3 rounded-lg border border-[var(--mpa-color-border-default)] bg-white p-4"
          >
            <header className="space-y-1">
              <h3 className="text-lg font-semibold">{block.label}</h3>
              <p className="text-sm text-[var(--mpa-color-text-secondary)]">{block.summary}</p>
            </header>

            {block.emptyReason ? (
              <p className="text-sm text-[var(--mpa-color-text-secondary)]">{block.emptyReason}</p>
            ) : null}

            {block.metrics.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {block.metrics.map((m) => (
                  <div
                    key={m.id}
                    className={`rounded-md border px-3 py-3 ${toneClass(m.tone)}`}
                  >
                    <p className="text-xs text-[var(--mpa-color-text-secondary)]">{m.label}</p>
                    <p className="text-xl font-semibold tabular-nums">{m.value}</p>
                    {m.hint ? (
                      <p className="text-xs text-[var(--mpa-color-text-secondary)]">{m.hint}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}

            {block.rows.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[32rem] text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--mpa-color-border-default)] text-xs uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">
                      <th className="py-2 pr-3 font-medium">Item</th>
                      <th className="py-2 pr-3 font-medium">Detail</th>
                      <th className="py-2 pr-3 font-medium">Status</th>
                      <th className="py-2 font-medium">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row) => (
                      <tr key={row.id} className="border-b border-[var(--mpa-color-border-default)]/60">
                        <td className="py-2 pr-3">
                          {row.href ? (
                            <Link href={row.href} className={`font-medium underline ${linkFocus}`}>
                              {row.label}
                            </Link>
                          ) : (
                            row.label
                          )}
                        </td>
                        <td className="py-2 pr-3 text-[var(--mpa-color-text-secondary)]">
                          {row.secondary ?? "—"}
                        </td>
                        <td className="py-2 pr-3">
                          {row.status ? <Badge variant="neutral">{row.status}</Badge> : "—"}
                        </td>
                        <td className="py-2 tabular-nums">{row.value ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </article>
        ))}
      </section>

      <footer className="space-y-2 border-t border-[var(--mpa-color-border-default)] pt-4 text-xs text-[var(--mpa-color-text-secondary)]">
        <p className="font-medium text-[var(--mpa-color-text-primary)]">Data honesty</p>
        <ul className="list-disc space-y-1 pl-5">
          {snapshot.dataHonesty.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <p>
          Platform-wide commercial MRR/ARR remains in{" "}
          <Link href="/admin" className={`underline ${linkFocus}`}>
            Owner Operations Command Center
          </Link>
          . Document exports stay in{" "}
          <Link href="/shared/documents" className={`underline ${linkFocus}`}>
            Document Intelligence
          </Link>
          .
        </p>
      </footer>
    </div>
  );
}
