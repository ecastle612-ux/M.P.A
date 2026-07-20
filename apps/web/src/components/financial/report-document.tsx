"use client";

import type { ReactNode } from "react";
import { Badge } from "@mpa/ui";
import { Logo } from "../branding/logo";
import { formatReportMoney, type ReportModel } from "../../lib/reporting/contracts";
import {
  buildExecutiveKpis,
  buildPresentationCharts,
  chartBarPercents,
  emptyStateMessage,
  generatedLabel,
  recognitionLabel,
  reportHasActivity,
  type PresentationChart,
  type PresentationKpi
} from "../../lib/reporting/presentation";

/** Premium in-app report document — FIN-002. Mirrors PDF narrative order. */
export function ReportDocument({ model }: { model: ReportModel }) {
  const kpis = buildExecutiveKpis(model);
  const charts = buildPresentationCharts(model);
  const hasActivity = reportHasActivity(model);

  return (
    <article className="mpa-report-document space-y-6 text-[var(--mpa-color-text-primary)]">
      <ReportCover model={model} />
      <ExecutiveSummary kpis={kpis} />
      {charts.map((chart) => (
        <ChartCard key={chart.id} chart={chart} />
      ))}
      <ReportHealthCard model={model} />
      {!hasActivity ? (
        <section className="rounded-xl border border-dashed border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface-muted)] px-5 py-8 text-center">
          <p className="font-display text-lg font-semibold">{emptyStateMessage(model.reportType)}</p>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
            Summary, health, and report metadata remain available below.
          </p>
        </section>
      ) : null}
      {model.sections.map((section) => (
        <SectionCard key={section.id} title={section.title}>
          <FinancialTable
            rows={section.lines.map((line) => ({
              id: line.id,
              label: line.label,
              meta: line.meta ?? null,
              amount: line.amount
            }))}
            emptyLabel={emptyStateMessage(model.reportType)}
            subtotal={section.subtotal}
          />
        </SectionCard>
      ))}
      <SectionCard title="Totals">
        <div className="divide-y divide-[var(--mpa-color-border-default)]">
          {model.totals.map((total) => (
            <div
              key={total.label}
              className={`flex items-center justify-between gap-4 px-1 py-3 ${
                total.emphasis ? "font-semibold" : "text-[var(--mpa-color-text-secondary)]"
              }`}
            >
              <span className={total.emphasis ? "text-[var(--mpa-color-text-primary)]" : undefined}>
                {total.label}
              </span>
              <span className="tabular-nums text-[var(--mpa-color-text-primary)]">
                {formatReportMoney(total.amount)}
              </span>
            </div>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Notes">
        <ul className="space-y-2 text-sm text-[var(--mpa-color-text-secondary)]">
          {model.notes.map((note) => (
            <li key={note} className="leading-relaxed">
              {note}
            </li>
          ))}
        </ul>
      </SectionCard>
      <FinancialInsightsPlaceholder />
      <ReportFooter model={model} />
    </article>
  );
}

function ReportCover({ model }: { model: ReportModel }) {
  const id = model.identity;
  return (
    <header className="overflow-hidden rounded-xl border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface-elevated)]">
      <div className="h-1.5 w-full bg-[var(--mpa-color-brand-primary)]" />
      <div className="space-y-5 px-6 py-6 sm:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo size="pdf" decorative className="opacity-95" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--mpa-color-text-tertiary)]">
                {id.logoLabel}
              </p>
              <p className="font-display text-lg font-semibold">{id.organizationName}</p>
            </div>
          </div>
          <div className="text-right text-xs text-[var(--mpa-color-text-tertiary)]">
            <p>Generated {generatedLabel(model)}</p>
            <p>Recognition · {recognitionLabel(model)}</p>
          </div>
        </div>
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{id.reportTitle}</h1>
          <p className="mt-2 text-base text-[var(--mpa-color-text-secondary)]">{id.periodLabel}</p>
        </div>
        <dl className="grid gap-3 border-t border-[var(--mpa-color-border-default)] pt-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-[0.12em] text-[var(--mpa-color-text-tertiary)]">Property</dt>
            <dd className="mt-1 font-medium">{id.propertyName}</dd>
            <dd className="text-[var(--mpa-color-text-secondary)]">{id.propertyAddress}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.12em] text-[var(--mpa-color-text-tertiary)]">Prepared by</dt>
            <dd className="mt-1 font-medium">{id.managerName}</dd>
          </div>
        </dl>
      </div>
    </header>
  );
}

function ExecutiveSummary({ kpis }: { kpis: PresentationKpi[] }) {
  return (
    <SectionCard title="Executive Summary">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((kpi) => (
          <div
            key={kpi.id}
            className="rounded-lg border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface-muted)] px-4 py-4"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--mpa-color-text-tertiary)]">
              {kpi.label}
            </p>
            <p
              className={`mt-2 font-display text-2xl font-semibold tabular-nums ${
                kpi.tone === "positive"
                  ? "text-[var(--mpa-color-status-success)]"
                  : kpi.tone === "negative"
                    ? "text-[var(--mpa-color-status-danger)]"
                    : "text-[var(--mpa-color-text-primary)]"
              }`}
            >
              {kpi.value}
            </p>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function ChartCard({ chart }: { chart: PresentationChart }) {
  const bars = chartBarPercents(chart.series);
  return (
    <SectionCard title={chart.title}>
      <div className="space-y-3" role="img" aria-label={chart.title}>
        {bars.map((bar) => (
          <div key={bar.id} className="space-y-1">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="text-[var(--mpa-color-text-secondary)]">{bar.label}</span>
              <span className="tabular-nums font-medium">{formatReportMoney(bar.value)}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-[var(--mpa-color-bg-surface-muted)]">
              <div
                className="h-full rounded-full bg-[var(--mpa-color-brand-primary)] transition-[width]"
                style={{ width: `${Math.max(bar.percent, bar.value > 0 ? 4 : 0)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function ReportHealthCard({ model }: { model: ReportModel }) {
  const healthy = model.health.status === "healthy";
  return (
    <div className="space-y-3">
      <SectionCard title="Report Health">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium">Report Status</p>
          <Badge variant={healthy ? "success" : "warning"}>{healthy ? "Healthy" : "Incomplete"}</Badge>
        </div>
        <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <HealthRow ok={model.health.transactionsIncluded} label="Transactions" />
          <HealthRow ok={model.health.expensesIncluded} label="Expenses" />
          <HealthRow ok={model.health.rentIncluded} label="Rent" />
          <HealthRow
            ok={model.health.reconciliationStatus === "reconciled"}
            label="Reconciliation"
            warn={model.health.reconciliationStatus === "unreconciled"}
          />
        </ul>
      </SectionCard>
      {model.health.warning ? (
        <aside
          className="rounded-xl border border-[var(--mpa-color-status-warning)]/40 bg-[var(--mpa-color-status-warning-subtle)] px-5 py-4 text-sm text-[var(--mpa-color-status-warning)]"
          role="status"
        >
          <p className="font-semibold">Warning</p>
          <p className="mt-1">{model.health.warning}</p>
        </aside>
      ) : null}
    </div>
  );
}

function HealthRow({ ok, label, warn }: { ok: boolean; label: string; warn?: boolean }) {
  return (
    <li className="flex items-center gap-2 rounded-lg bg-[var(--mpa-color-bg-surface-muted)] px-3 py-2">
      <span aria-hidden className={warn ? "text-[var(--mpa-color-status-warning)]" : ok ? "text-[var(--mpa-color-status-success)]" : "text-[var(--mpa-color-text-tertiary)]"}>
        {warn ? "⚠" : ok ? "✓" : "·"}
      </span>
      <span className="text-[var(--mpa-color-text-secondary)]">{label}</span>
      <span className="ml-auto text-xs text-[var(--mpa-color-text-tertiary)]">
        {warn ? "Attention" : ok ? "Included" : "None"}
      </span>
    </li>
  );
}

function FinancialTable({
  rows,
  emptyLabel,
  subtotal
}: {
  rows: Array<{ id: string; label: string; meta: string | null; amount: number }>;
  emptyLabel: string;
  subtotal: number;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-[var(--mpa-color-border-default)]">
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">Financial detail</caption>
        <thead>
          <tr className="bg-[var(--mpa-color-bg-surface-muted)] text-left text-xs uppercase tracking-[0.1em] text-[var(--mpa-color-text-tertiary)]">
            <th className="px-4 py-3 font-semibold">Description</th>
            <th className="px-4 py-3 text-right font-semibold">Amount</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={2} className="px-4 py-8 text-center text-[var(--mpa-color-text-secondary)]">
                {emptyLabel}
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr
                key={row.id}
                className={index % 2 === 0 ? "bg-[var(--mpa-color-bg-surface-elevated)]" : "bg-[var(--mpa-color-bg-surface-muted)]/60"}
              >
                <td className="px-4 py-3 align-top">
                  <p className="font-medium text-[var(--mpa-color-text-primary)]">{row.label}</p>
                  {row.meta ? <p className="mt-0.5 text-xs text-[var(--mpa-color-text-tertiary)]">{row.meta}</p> : null}
                </td>
                <td className="px-4 py-3 text-right align-top tabular-nums font-medium">
                  {formatReportMoney(row.amount)}
                </td>
              </tr>
            ))
          )}
        </tbody>
        <tfoot>
          <tr className="border-t border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface-muted)]">
            <td className="px-4 py-3 font-semibold">Subtotal</td>
            <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatReportMoney(subtotal)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function FinancialInsightsPlaceholder() {
  return (
    <section
      className="rounded-xl border border-dashed border-[var(--mpa-color-border-default)] px-5 py-5"
      data-fin-insights-slot="true"
      aria-label="Financial Insights — future release"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--mpa-color-text-tertiary)]">
        Financial Insights
      </p>
      <p className="mt-1 font-display text-lg font-semibold">Future release</p>
      <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
        AI financial summaries will become available during a future release.
      </p>
    </section>
  );
}

function ReportFooter({ model }: { model: ReportModel }) {
  return (
    <footer className="rounded-xl border border-[var(--mpa-color-border-default)] px-5 py-4 text-xs leading-relaxed text-[var(--mpa-color-text-tertiary)]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p>Prepared by {model.identity.managerName}</p>
          <p>{model.identity.organizationName}</p>
          <p>Generated by M.P.A.</p>
        </div>
        <div className="text-right">
          <p>Confidential</p>
          <p>{model.identity.periodLabel}</p>
        </div>
      </div>
      <div className="mt-4 border-t border-[var(--mpa-color-border-default)] pt-3">
        <p>______________________________&nbsp;&nbsp;&nbsp;&nbsp;______________</p>
        <p className="mt-1">Authorized signature&nbsp;&nbsp;&nbsp;&nbsp;Date</p>
      </div>
    </footer>
  );
}

function SectionCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface-elevated)] px-5 py-5 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
      <h2 className="font-display text-lg font-semibold tracking-tight text-[var(--mpa-color-text-primary)]">
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
