import Link from "next/link";
import { Button, Card } from "@mpa/ui";
import { formatCurrency } from "../../lib/financial/contracts";
import type { PropertyFinancialSummary } from "../../lib/financial/server";

export function PropertyFinancialPanel({
  summary,
  canReadFinancials,
  propertyId
}: {
  summary: PropertyFinancialSummary | null;
  canReadFinancials: boolean;
  propertyId?: string;
}) {
  if (!canReadFinancials) {
    return null;
  }

  const financialsHref = propertyId
    ? `/financials/charges?propertyId=${encodeURIComponent(propertyId)}`
    : summary?.propertyId
      ? `/financials/charges?propertyId=${encodeURIComponent(summary.propertyId)}`
      : "/financials";

  return (
    <Card className="space-y-2.5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="mpa-section-title">Financial snapshot</h2>
          <p className="mt-0.5 text-sm leading-snug text-[var(--mpa-color-text-secondary)]">
            Current-month income, expenses, and rent collection for this property.
          </p>
        </div>
        <Link href={financialsHref}>
          <Button variant="ghost" size="sm">
            Open Financials
          </Button>
        </Link>
      </div>

      {!summary ? (
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">
          Financial data appears after charges, payments, or expenses are recorded for this property.
        </p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <MetricCard label="Collected rent" value={formatCurrency(summary.collectedRent)} />
          <MetricCard label="Outstanding" value={formatCurrency(summary.outstandingBalance)} />
          <MetricCard label="Monthly income" value={formatCurrency(summary.monthlyIncome)} />
          <MetricCard label="Monthly expenses" value={formatCurrency(summary.monthlyExpenses)} />
          <MetricCard label="NOI (month)" value={formatCurrency(summary.noi)} />
          <MetricCard label="Late charges" value={summary.latePaymentsCount.toString()} />
        </div>
      )}
    </Card>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--mpa-radius-md)] bg-[var(--mpa-color-bg-surface-muted)] px-3 py-2">
      <p className="mpa-section-label">{label}</p>
      <p className="mt-0.5 font-mono text-base font-medium tabular-nums text-[var(--mpa-color-text-primary)]">
        {value}
      </p>
    </div>
  );
}
