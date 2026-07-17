import Link from "next/link";
import { ContextRail, ContextRailSection } from "../context-rail";
import { formatCurrency } from "../../../lib/financial/contracts";
import { CONTEXT_RAIL_EMPTY } from "../../../lib/experience/context-rail-empty";
import { toLeaseRenewalStatusLabel, toLeaseStatusLabel } from "../../../lib/lease/contracts";
import type { LeaseDocumentRecord, LeaseEventRecord } from "../../../lib/lease/contracts";

export function LeaseContextRail({
  leaseId,
  propertyId,
  propertyName,
  unitId,
  unitNumber,
  tenantId,
  tenantName,
  canReadProperty,
  canReadUnit,
  canReadTenant,
  rentAmount,
  securityDeposit,
  amountPaid,
  outstandingBalance,
  endDate,
  renewalStatus,
  status,
  documents,
  events
}: {
  leaseId: string;
  propertyId: string | null;
  propertyName: string | null;
  unitId: string | null;
  unitNumber: string | null;
  tenantId: string | null;
  tenantName: string | null;
  canReadProperty: boolean;
  canReadUnit: boolean;
  canReadTenant: boolean;
  rentAmount: number;
  securityDeposit: number;
  amountPaid: number;
  outstandingBalance: number;
  endDate: string;
  renewalStatus: string;
  status: string;
  documents: LeaseDocumentRecord[];
  events: LeaseEventRecord[];
}) {
  const daysToRenewal = computeDaysUntil(endDate);

  return (
    <ContextRail title="Lease context">
      <ContextRailSection title="Tenant">
        {tenantId && tenantName && canReadTenant ? (
          <Link href={`/tenants/${tenantId}`} className="font-medium text-[var(--mpa-color-brand-primary)] hover:underline">
            {tenantName}
          </Link>
        ) : (
          <p>{tenantName ?? "—"}</p>
        )}
      </ContextRailSection>

      <ContextRailSection title="Property & unit">
        <div className="space-y-2">
          {propertyId && propertyName && canReadProperty ? (
            <Link href={`/properties/${propertyId}`} className="block font-medium text-[var(--mpa-color-brand-primary)] hover:underline">
              {propertyName}
            </Link>
          ) : (
            <p>{propertyName ?? "—"}</p>
          )}
          {unitId && unitNumber && canReadUnit ? (
            <Link href={`/units/${unitId}`} className="block font-medium text-[var(--mpa-color-brand-primary)] hover:underline">
              Unit {unitNumber}
            </Link>
          ) : (
            <p>{unitNumber ? `Unit ${unitNumber}` : "—"}</p>
          )}
        </div>
      </ContextRailSection>

      <ContextRailSection title="Rent summary">
        <div className="space-y-1">
          <Metric label="Monthly rent" value={formatCurrency(rentAmount)} />
          <Metric label="Security deposit" value={formatCurrency(securityDeposit)} />
          <Metric label="Collected" value={formatCurrency(amountPaid)} />
          <Metric label="Outstanding" value={formatCurrency(outstandingBalance)} />
        </div>
        <Link href={`/financials/charges?leaseId=${leaseId}`} className="mt-2 inline-block text-xs font-medium text-[var(--mpa-color-brand-primary)] hover:underline">
          View charges →
        </Link>
      </ContextRailSection>

      <ContextRailSection title="Renewal countdown">
        <p className="text-lg font-semibold text-[var(--mpa-color-text-primary)]">
          {daysToRenewal !== null ? `${daysToRenewal} days` : "—"}
        </p>
        <p className="text-xs">Until end date ({endDate})</p>
        <p className="mt-1 text-xs">
          Status: {toLeaseStatusLabel(status as Parameters<typeof toLeaseStatusLabel>[0])} ·{" "}
          {toLeaseRenewalStatusLabel(renewalStatus as Parameters<typeof toLeaseRenewalStatusLabel>[0])}
        </p>
      </ContextRailSection>

      <ContextRailSection title="Documents" emptyMessage={CONTEXT_RAIL_EMPTY.lease.documents}>
        {documents.length > 0 ? (
          <ul className="space-y-1">
            {documents.slice(0, 5).map((doc) => (
              <li key={doc.id} className="text-xs">
                {doc.title ?? doc.documentType}
              </li>
            ))}
          </ul>
        ) : null}
      </ContextRailSection>

      <ContextRailSection title="Financial snapshot">
        <p className="text-xs">
          {outstandingBalance > 0
            ? `${formatCurrency(outstandingBalance)} outstanding — follow up on collections.`
            : "No outstanding balance on linked charges."}
        </p>
      </ContextRailSection>

      <ContextRailSection title="Timeline" emptyMessage={CONTEXT_RAIL_EMPTY.lease.timeline}>
        {events.length > 0 ? (
          <ul className="space-y-2">
            {events.slice(0, 6).map((event) => (
              <li key={event.id} className="border-l-2 border-[var(--mpa-color-border-subtle)] pl-2 text-xs">
                <p className="font-medium">{event.eventType.replaceAll("_", " ")}</p>
                <p className="text-[var(--mpa-color-text-muted)]">
                  {new Date(event.createdAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        ) : null}
      </ContextRailSection>
    </ContextRail>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs">{label}</span>
      <span className="font-medium text-[var(--mpa-color-text-primary)]">{value}</span>
    </div>
  );
}

function computeDaysUntil(endDate: string): number | null {
  const parsed = Date.parse(endDate);
  if (Number.isNaN(parsed)) return null;
  const diff = parsed - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}
