import Link from "next/link";
import { Badge, Card, EmptyState, KpiMetric } from "@mpa/ui";
import type { OwnerPropertyDetailModel } from "../../lib/owner-portal/property-experience";
import { OwnerDocumentsList } from "./owner-document-row";

function SectionTitle({ children }: { children: string }) {
  return <h2 className="text-sm font-semibold text-[var(--mpa-color-text-primary)]">{children}</h2>;
}

export function OwnerPropertyDetail({ model }: { model: OwnerPropertyDetailModel }) {
  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-[var(--mpa-color-text-primary)]">
            {model.name}
          </h1>
          <Badge variant="neutral">{model.statusLabel}</Badge>
          <Badge variant="info">{model.propertyTypeLabel}</Badge>
        </div>
        <p className="text-sm text-[var(--mpa-color-text-secondary)]">{model.address}</p>
        <p className="text-xs text-[var(--mpa-color-text-secondary)]">
          {model.occupancyPercent === null
            ? "Units not configured"
            : `${model.occupancyPercent}% occupied · ${model.occupiedUnits} of ${model.unitCount} units`}
          {model.ownershipEntityName ? ` · Owner share: ${model.ownershipEntityName}` : null}
        </p>
        <Link href="/portal/owner/properties" className="text-xs font-medium text-[var(--mpa-color-text-link)]">
          ← All properties
        </Link>
      </header>

      <section className="space-y-3">
        <SectionTitle>Financial summary</SectionTitle>
        {model.financialUnavailable ? (
          <Card variant="muted" className="p-4 text-sm text-[var(--mpa-color-text-secondary)]">
            {model.financialUnavailable}
          </Card>
        ) : model.financial ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <KpiMetric
                label="Current balance"
                value={model.financial.currentBalanceLabel}
                hint="Net this month (collections − expenses)"
              />
              <KpiMetric
                label="Monthly collections"
                value={model.financial.monthlyCollectionsLabel}
                hint="Completed payments this month"
              />
              <KpiMetric
                label="Monthly expenses"
                value={model.financial.monthlyExpensesLabel}
                hint="Expenses this month"
              />
              <KpiMetric
                label="Outstanding balance"
                value={model.financial.outstandingBalanceLabel}
                hint="Outstanding rent on this property"
              />
            </div>
            {model.financial.latestStatement ? (
              <p className="text-sm text-[var(--mpa-color-text-secondary)]">
                Latest statement:{" "}
                <Link
                  href={model.financial.latestStatement.href}
                  className="font-medium text-[var(--mpa-color-text-link)]"
                >
                  {model.financial.latestStatement.label}
                </Link>
              </p>
            ) : (
              <p className="text-sm text-[var(--mpa-color-text-secondary)]">No statements yet for this property.</p>
            )}
          </>
        ) : null}
      </section>

      <section className="space-y-3">
        <SectionTitle>Residents</SectionTitle>
        {model.residentsUnavailable ? (
          <Card variant="muted" className="p-4 text-sm text-[var(--mpa-color-text-secondary)]">
            {model.residentsUnavailable}
          </Card>
        ) : model.residents.length === 0 ? (
          <EmptyState
            title="No residents on file"
            description="Active leases for this property will appear here when your property manager records them."
          />
        ) : (
          <ul className="space-y-2">
            {model.residents.map((resident) => (
              <li key={resident.id}>
                <Card variant="elevated" className="p-4">
                  <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">
                    {resident.residentName}
                  </p>
                  <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">
                    Unit {resident.unitLabel} · {resident.leaseStart} → {resident.leaseEnd} ·{" "}
                    {resident.leaseStatusLabel}
                  </p>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <SectionTitle>Documents</SectionTitle>
        {model.documentsUnavailable ? (
          <Card variant="muted" className="p-4 text-sm text-[var(--mpa-color-text-secondary)]">
            {model.documentsUnavailable}
          </Card>
        ) : (
          <OwnerDocumentsList
            documents={model.documents}
            emptyTitle="No documents yet"
            emptyDescription="Property-linked files from the Document Vault appear here when shared by your property manager."
          />
        )}
      </section>

      <section className="space-y-3">
        <SectionTitle>Recent activity</SectionTitle>
        {model.activityNotes.length > 0 ? (
          <ul className="space-y-1 text-xs text-[var(--mpa-color-text-secondary)]">
            {model.activityNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        ) : null}
        {model.activity.length === 0 ? (
          <EmptyState
            title="No recent activity"
            description="Maintenance, messages, inspections, and financial activity for this property will show up here."
          />
        ) : (
          <ul className="space-y-2">
            {model.activity.map((item) => {
              const body = (
                <Card variant="elevated" className="p-4">
                  <p className="text-sm font-medium text-[var(--mpa-color-text-primary)]">{item.title}</p>
                  <p className="mt-1 text-xs text-[var(--mpa-color-text-secondary)]">
                    {item.subtitle} · {new Date(item.at).toLocaleString()}
                  </p>
                </Card>
              );
              return (
                <li key={item.id}>
                  {item.href ? (
                    <Link href={item.href} className="block transition-opacity hover:opacity-90">
                      {body}
                    </Link>
                  ) : (
                    body
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
