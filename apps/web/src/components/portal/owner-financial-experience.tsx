import Link from "next/link";
import { Badge, Card, EmptyState, KpiMetric } from "@mpa/ui";
import type { OwnerFinancialExperienceModel } from "../../lib/owner-portal/financial-experience";
import { ConnectOnboardingCard } from "./connect-onboarding-card";
import { OwnerStatementRow } from "./owner-statement-row";
import {
  OwnerFoundationNote,
  OwnerListEmpty,
  OwnerSectionHeader
} from "./owner-section-placeholder";

function SectionHeading({ id, children }: { id: string; children: string }) {
  return (
    <h2 id={id} className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">
      {children}
    </h2>
  );
}

export function OwnerFinancialExperience({ model }: { model: OwnerFinancialExperienceModel }) {
  if (model.empty) {
    return (
      <div className="space-y-5">
        <OwnerSectionHeader
          title="Financials"
          description="Read-only portfolio financials from the existing financial module."
        />
        <OwnerListEmpty
          title="No financial data yet"
          description="Financial activity appears when properties are linked to your owner access. Your property manager records collections, expenses, and statements."
        />
        {model.connectStatus ? (
          <ConnectOnboardingCard
            initialStatus={model.connectStatus}
            mode="owner"
            returnPath="/portal/owner/financials"
            returnedFromConnect={model.connectReturnedFromLink}
            title="Owner payout connection"
            description="Finish Stripe Connect verification to become eligible. Eligible does not mean a payout was sent."
          />
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <OwnerSectionHeader
          title="Financials"
          description="Read-only portfolio financials for your authorized properties. No payouts, edits, or accounting tools."
        />
        <OwnerFoundationNote>
          Totals reuse existing property financial summaries (including NOI). Payout history below
          reflects recorded TransferIntents only — never invented paid amounts.
        </OwnerFoundationNote>
        {model.loadNotes.length > 0 ? (
          <ul className="space-y-1 text-xs text-[var(--mpa-color-text-secondary)]">
            {model.loadNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        ) : null}
      </div>

      {model.kpis ? (
        <section className="space-y-3" aria-labelledby="owner-financial-kpis">
          <SectionHeading id="owner-financial-kpis">Portfolio summary</SectionHeading>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <KpiMetric
              label="Current balance"
              value={model.kpis.currentBalanceLabel}
              hint="Collected rent on accessible properties"
            />
            <KpiMetric
              label="Collections (MTD)"
              value={model.kpis.collectionsMtdLabel}
              hint="Completed payments this month"
            />
            <KpiMetric
              label="Expenses (MTD)"
              value={model.kpis.expensesMtdLabel}
              hint="Expenses recorded this month"
            />
            <KpiMetric
              label="Outstanding balance"
              value={model.kpis.outstandingBalanceLabel}
              hint="Outstanding rent on accessible properties"
            />
            {model.kpis.noiLabel ? (
              <KpiMetric
                label="Net operating income"
                value={model.kpis.noiLabel}
                hint="From property financial summary (MTD)"
              />
            ) : null}
          </div>
        </section>
      ) : (
        <Card variant="muted" className="p-4 text-sm text-[var(--mpa-color-text-secondary)]">
          Portfolio financial summary could not be loaded right now.
        </Card>
      )}

      <section className="space-y-3" aria-labelledby="owner-financial-properties">
        <SectionHeading id="owner-financial-properties">Property financial breakdown</SectionHeading>
        {model.propertyCards.length === 0 ? (
          <EmptyState
            title="No property financials"
            description="Property summaries appear when financial records exist for your authorized properties."
          />
        ) : (
          <ul className="grid gap-3 lg:grid-cols-2">
            {model.propertyCards.map((card) => (
              <li key={card.propertyId}>
                <Card variant="elevated" className="space-y-2 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">
                      {card.propertyName}
                    </p>
                    <Link
                      href={card.href}
                      className="text-xs font-medium text-[var(--mpa-color-text-link)]"
                    >
                      Property view →
                    </Link>
                  </div>
                  <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                    Revenue (MTD) {card.revenueLabel} · Expenses (MTD) {card.expensesLabel}
                  </p>
                  <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                    Outstanding {card.outstandingLabel} · Occupancy {card.occupancyLabel}
                  </p>
                  <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                    Latest statement: {card.latestStatementLabel ?? "None yet"}
                  </p>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section id="statements" className="space-y-3" aria-labelledby="owner-financial-statements">
        <SectionHeading id="owner-financial-statements">Statements</SectionHeading>
        {model.statements.length === 0 ? (
          <EmptyState
            title="No statements yet"
            description="Published owner statements from Accounting / Reports will appear here. Statements are not generated from this portal."
          />
        ) : (
          <ul className="space-y-2">
            {model.statements.map((statement) => (
              <OwnerStatementRow key={statement.id} statement={statement} />
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3" aria-labelledby="owner-financial-transactions">
        <SectionHeading id="owner-financial-transactions">Recent transactions</SectionHeading>
        {model.transactions.length === 0 ? (
          <EmptyState
            title="No recent transactions"
            description="Payments, expenses, and adjustments for your properties will show here when recorded by your property manager."
          />
        ) : (
          <ul className="space-y-2">
            {model.transactions.map((row) => (
              <li key={row.id}>
                <Card variant="elevated" className="flex flex-wrap items-start justify-between gap-3 p-4">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">{row.title}</p>
                      <Badge variant="neutral">
                        {row.kind === "payment"
                          ? "Payment"
                          : row.kind === "expense"
                            ? "Expense"
                            : "Adjustment"}
                      </Badge>
                    </div>
                    <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                      {row.propertyName} · {row.dateLabel} · {row.statusLabel}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">{row.amountLabel}</p>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section
        id="payout-history"
        className="space-y-3"
        aria-labelledby="owner-financial-payout-history"
      >
        <SectionHeading id="owner-financial-payout-history">Payout history</SectionHeading>
        <p className="text-xs text-[var(--mpa-color-text-secondary)]">
          Read-only visibility from Connect transfer records. Pending means processing or awaiting
          reconciliation — not a guarantee of payment.
        </p>
        {model.payoutHistory.length === 0 ? (
          <EmptyState
            title="No payouts recorded yet"
            description="When your property manager runs an owner payout and a transfer is recorded, it appears here with paid, failed, or pending status."
          />
        ) : (
          <ul className="space-y-2">
            {model.payoutHistory.map((row) => (
              <li key={row.intentId}>
                <Card variant="elevated" className="flex flex-wrap items-start justify-between gap-3 p-4">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">
                        {row.propertyName}
                      </p>
                      <Badge
                        variant={
                          row.visibility === "paid"
                            ? "success"
                            : row.visibility === "failed"
                              ? "danger"
                              : row.visibility === "pending"
                                ? "warning"
                                : "neutral"
                        }
                      >
                        {row.statusLabel}
                      </Badge>
                    </div>
                    <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                      {row.periodLabel} · Updated {row.updatedLabel}
                      {row.externalTransferId ? ` · Transfer ${row.externalTransferId}` : ""}
                    </p>
                    {row.remittanceSummary ? (
                      <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                        Remittance: {row.remittanceSummary}
                      </p>
                    ) : null}
                  </div>
                  <p className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">
                    {row.amountLabel}
                  </p>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3" aria-labelledby="owner-financial-remittance">
        <SectionHeading id="owner-financial-remittance">Remittance records</SectionHeading>
        {model.remittanceRecords.length === 0 ? (
          <EmptyState
            title="No remittance records yet"
            description="A remittance summary is issued when a payout transfer is recorded as paid or in transit."
          />
        ) : (
          <ul className="space-y-2">
            {model.remittanceRecords.map((row) => (
              <li key={row.id}>
                <Card variant="elevated" className="space-y-1 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">
                      {row.propertyName}
                    </p>
                    <p className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">
                      {row.amountLabel}
                    </p>
                  </div>
                  <p className="text-xs text-[var(--mpa-color-text-secondary)]">
                    {row.periodLabel} · Issued {row.createdLabel}
                  </p>
                  <p className="text-xs text-[var(--mpa-color-text-secondary)]">{row.summary}</p>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3" aria-labelledby="owner-financial-payouts">
        <SectionHeading id="owner-financial-payouts">Payout connection</SectionHeading>
        {model.connectStatus ? (
          <ConnectOnboardingCard
            initialStatus={model.connectStatus}
            mode="owner"
            returnPath="/portal/owner/financials"
            returnedFromConnect={model.connectReturnedFromLink}
            title="Owner payout connection"
            description="Finish Stripe Connect verification to become eligible. Eligible does not mean a payout was sent."
          />
        ) : (
          <Card variant="muted" className="p-4 text-sm text-[var(--mpa-color-text-secondary)]">
            Payout connection status could not be loaded right now.
          </Card>
        )}
      </section>

      <Card variant="muted" className="p-4 text-sm text-[var(--mpa-color-text-secondary)]">
        This page is read-only for payout visibility. It does not move money, schedule payouts, or edit
        the ledger.
      </Card>
    </div>
  );
}
