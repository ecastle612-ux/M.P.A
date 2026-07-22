import Link from "next/link";
import { ContextRail, ContextRailSection } from "../context-rail";
import { formatCurrency } from "../../../lib/financial/contracts";
import { CONTEXT_RAIL_EMPTY } from "../../../lib/experience/context-rail-empty";
import { toLeaseStatusLabel } from "../../../lib/lease/contracts";

type LeaseSummary = {
  id: string;
  leaseNumber: string;
  status: string;
  rentAmount: number;
  endDate: string;
};

type PaymentSummary = {
  id: string;
  amount: number;
  paymentDate: string;
  chargeNumber: string | null;
};

type WorkOrderSummary = {
  id: string;
  workOrderNumber: string;
  title: string;
  status: string;
};

export function TenantContextRail({
  tenantId,
  propertyId,
  propertyName,
  unitId,
  unitNumber,
  canReadProperty,
  canReadUnit,
  lease,
  outstandingBalance,
  recentPayments,
  openMaintenance,
  communicationsCount,
  timeline,
  recommendedAction
}: {
  tenantId: string;
  propertyId: string | null;
  propertyName: string | null;
  unitId: string | null;
  unitNumber: string | null;
  canReadProperty: boolean;
  canReadUnit: boolean;
  lease: LeaseSummary | null;
  outstandingBalance: number;
  recentPayments: PaymentSummary[];
  openMaintenance: WorkOrderSummary[];
  communicationsCount: number;
  timeline: Array<{ id: string; label: string; detail: string; at: string }>;
  recommendedAction: string;
}) {
  return (
    <ContextRail title="Tenant context">
      <ContextRailSection title="Lease">
        {lease ? (
          <div className="space-y-1">
            <Link href={`/leases/${lease.id}`} className="font-medium text-[var(--mpa-color-brand-primary)] hover:underline">
              {lease.leaseNumber}
            </Link>
            <p className="text-xs">{toLeaseStatusLabel(lease.status as Parameters<typeof toLeaseStatusLabel>[0])}</p>
            <p className="text-xs">Rent: {formatCurrency(lease.rentAmount)} · Ends {lease.endDate}</p>
          </div>
        ) : (
          <p className="text-[var(--mpa-color-text-muted)]">No active lease linked.</p>
        )}
      </ContextRailSection>

      <ContextRailSection title="Unit & property">
        <div className="space-y-2">
          <div>
            <p className="mpa-section-label">Property</p>
            {propertyId && propertyName && canReadProperty ? (
              <Link href={`/properties/${propertyId}`} className="font-medium text-[var(--mpa-color-brand-primary)] hover:underline">
                {propertyName}
              </Link>
            ) : (
              <p>{propertyName ?? "Not assigned"}</p>
            )}
          </div>
          <div>
            <p className="mpa-section-label">Unit</p>
            {unitId && unitNumber && canReadUnit ? (
              <Link href={`/units/${unitId}`} className="font-medium text-[var(--mpa-color-brand-primary)] hover:underline">
                Unit {unitNumber}
              </Link>
            ) : (
              <p>{unitNumber ? `Unit ${unitNumber}` : "Not assigned"}</p>
            )}
          </div>
        </div>
      </ContextRailSection>

      <ContextRailSection title="Balance">
        <p className="text-lg font-semibold text-[var(--mpa-color-text-primary)]">{formatCurrency(outstandingBalance)}</p>
        <p className="text-xs">Outstanding across open charges</p>
      </ContextRailSection>

      <ContextRailSection title="Recent payments" emptyMessage={CONTEXT_RAIL_EMPTY.tenant.payments}>
        {recentPayments.length > 0 ? (
          <ul className="space-y-2">
            {recentPayments.map((payment) => (
              <li key={payment.id} className="text-xs">
                <p className="font-medium">{formatCurrency(payment.amount)}</p>
                <p>
                  {new Date(payment.paymentDate).toLocaleDateString()}
                  {payment.chargeNumber ? ` · ${payment.chargeNumber}` : ""}
                </p>
              </li>
            ))}
          </ul>
        ) : null}
      </ContextRailSection>

      <ContextRailSection title="Maintenance" emptyMessage={CONTEXT_RAIL_EMPTY.tenant.maintenance}>
        {openMaintenance.length > 0 ? (
          <ul className="space-y-2">
            {openMaintenance.map((wo) => (
              <li key={wo.id}>
                <Link href={`/maintenance/${wo.id}`} className="font-medium text-[var(--mpa-color-brand-primary)] hover:underline">
                  {wo.workOrderNumber}
                </Link>
                <p className="text-xs">
                  {wo.title} · {wo.status.replaceAll("_", " ")}
                </p>
              </li>
            ))}
          </ul>
        ) : null}
      </ContextRailSection>

      <ContextRailSection title="Communications">
        <p>{communicationsCount} announcement{communicationsCount === 1 ? "" : "s"} delivered to this tenant&apos;s property</p>
        <Link
          href={`/communications/resident/${encodeURIComponent(tenantId)}`}
          className="mt-1 inline-block text-xs font-medium text-[var(--mpa-color-brand-primary)] hover:underline"
        >
          Message resident
        </Link>
      </ContextRailSection>

      <ContextRailSection title="Timeline" emptyMessage={CONTEXT_RAIL_EMPTY.tenant.timeline}>
        {timeline.length > 0 ? (
          <ul className="space-y-2">
            {timeline.map((entry) => (
              <li key={entry.id} className="border-l-2 border-[var(--mpa-color-border-subtle)] pl-2 text-xs">
                <p className="font-medium text-[var(--mpa-color-text-primary)]">{entry.label}</p>
                <p>{entry.detail}</p>
                <p className="text-[var(--mpa-color-text-muted)]">{entry.at}</p>
              </li>
            ))}
          </ul>
        ) : null}
      </ContextRailSection>

      <ContextRailSection title="Next recommended action" variant="muted">
        <p>{recommendedAction}</p>
        {!lease ? (
          <Link
            href={`/leases/new?tenantId=${encodeURIComponent(tenantId)}${
              propertyId ? `&propertyId=${encodeURIComponent(propertyId)}` : ""
            }${unitId ? `&unitId=${encodeURIComponent(unitId)}` : ""}`}
            className="mt-2 inline-block text-xs font-medium text-[var(--mpa-color-brand-primary)] hover:underline"
          >
            Create lease →
          </Link>
        ) : outstandingBalance > 0 ? (
          <Link
            href={`/financials/charges?tenantId=${encodeURIComponent(tenantId)}`}
            className="mt-2 inline-block text-xs font-medium text-[var(--mpa-color-brand-primary)] hover:underline"
          >
            Open ledger →
          </Link>
        ) : openMaintenance[0] ? (
          <Link
            href={`/maintenance/${openMaintenance[0].id}`}
            className="mt-2 inline-block text-xs font-medium text-[var(--mpa-color-brand-primary)] hover:underline"
          >
            Review maintenance →
          </Link>
        ) : null}
      </ContextRailSection>
    </ContextRail>
  );
}
