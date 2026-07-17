import Link from "next/link";
import { Button, Card } from "@mpa/ui";
import { formatCurrency } from "../../lib/financial/contracts";
import type { PropertyFinancialSummary } from "../../lib/financial/server";

export function PropertyFinancialPanel({
  summary,
  canReadFinancials
}: {
  summary: PropertyFinancialSummary | null;
  canReadFinancials: boolean;
}) {
  if (!canReadFinancials) {
    return null;
  }

  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[var(--mpa-color-text-primary)]">Financial snapshot</h2>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
            Current-month income, expenses, and rent collection for this property.
          </p>
        </div>
        <Link href="/financials">
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
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
    <div className="rounded-md border border-[var(--mpa-color-border-default)] bg-[var(--mpa-color-bg-surface-muted)] p-3">
      <p className="text-xs uppercase tracking-wide text-[var(--mpa-color-text-secondary)]">{label}</p>
      <p className="mt-1 text-lg font-semibold text-[var(--mpa-color-text-primary)]">{value}</p>
    </div>
  );
}
