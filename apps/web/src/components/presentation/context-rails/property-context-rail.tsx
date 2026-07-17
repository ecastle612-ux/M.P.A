import Link from "next/link";
import { ContextRail, ContextRailSection } from "../context-rail";
import { formatCurrency } from "../../../lib/financial/contracts";
import { CONTEXT_RAIL_EMPTY } from "../../../lib/experience/context-rail-empty";
import type { PropertyFinancialSummary } from "../../../lib/financial/server";

type ActivityItem = {
  id: string;
  label: string;
  detail: string;
  href?: string;
};

export function PropertyContextRail({
  occupancyRate,
  unitsTotal,
  occupiedUnits,
  vacancyUnits,
  tenantCount,
  activeLeases,
  openMaintenance,
  vendorCount,
  activity,
  financialSummary,
  canReadFinancials
}: {
  occupancyRate: number;
  unitsTotal: number;
  occupiedUnits: number;
  vacancyUnits: number;
  tenantCount: number;
  activeLeases: Array<{ id: string; leaseNumber: string; tenantName: string | null }>;
  openMaintenance: Array<{ id: string; workOrderNumber: string; title: string; priority: string }>;
  vendorCount: number;
  activity: ActivityItem[];
  financialSummary: PropertyFinancialSummary | null;
  canReadFinancials: boolean;
}) {
  return (
    <ContextRail title="Property context">
      <ContextRailSection title="Occupancy">
        <div className="grid grid-cols-2 gap-2">
          <MetricRow label="Rate" value={`${occupancyRate}%`} />
          <MetricRow label="Units" value={unitsTotal.toString()} />
          <MetricRow label="Occupied" value={occupiedUnits.toString()} />
          <MetricRow label="Vacant" value={vacancyUnits.toString()} />
          <MetricRow label="Tenants" value={tenantCount.toString()} />
        </div>
      </ContextRailSection>

      {canReadFinancials && financialSummary ? (
        <ContextRailSection title="Revenue">
          <div className="space-y-1">
            <MetricRow label="Collected (MTD)" value={formatCurrency(financialSummary.collectedRent)} />
            <MetricRow label="Outstanding" value={formatCurrency(financialSummary.outstandingBalance)} />
            <MetricRow label="Expenses (MTD)" value={formatCurrency(financialSummary.monthlyExpenses)} />
            <MetricRow label="NOI (MTD)" value={formatCurrency(financialSummary.noi)} />
          </div>
        </ContextRailSection>
      ) : null}

      <ContextRailSection title="Active leases" emptyMessage={CONTEXT_RAIL_EMPTY.property.activeLeases}>
        {activeLeases.length > 0 ? (
          <ul className="space-y-2">
            {activeLeases.map((lease) => (
              <li key={lease.id}>
                <Link href={`/leases/${lease.id}`} className="font-medium text-[var(--mpa-color-brand-primary)] hover:underline">
                  {lease.leaseNumber}
                </Link>
                <p className="text-xs">{lease.tenantName ?? "No tenant"}</p>
              </li>
            ))}
          </ul>
        ) : null}
      </ContextRailSection>

      <ContextRailSection title="Open maintenance" emptyMessage={CONTEXT_RAIL_EMPTY.property.openMaintenance}>
        {openMaintenance.length > 0 ? (
          <ul className="space-y-2">
            {openMaintenance.map((wo) => (
              <li key={wo.id}>
                <Link href={`/maintenance/${wo.id}`} className="font-medium text-[var(--mpa-color-brand-primary)] hover:underline">
                  {wo.workOrderNumber}
                </Link>
                <p className="text-xs">
                  {wo.title} · {wo.priority}
                </p>
              </li>
            ))}
          </ul>
        ) : null}
      </ContextRailSection>

      <ContextRailSection title="Vendors">
        <p>{vendorCount} vendor{vendorCount === 1 ? "" : "s"} assigned via work orders</p>
      </ContextRailSection>

      <ContextRailSection title="Recent activity" emptyMessage={CONTEXT_RAIL_EMPTY.property.recentActivity}>
        {activity.length > 0 ? (
          <ul className="space-y-2">
            {activity.slice(0, 5).map((item) => (
              <li key={item.id} className="rounded-[var(--mpa-radius-md)] border border-[var(--mpa-color-border-subtle)] p-2">
                {item.href ? (
                  <Link href={item.href} className="font-medium text-[var(--mpa-color-brand-primary)] hover:underline">
                    {item.label}
                  </Link>
                ) : (
                  <p className="font-medium text-[var(--mpa-color-text-primary)]">{item.label}</p>
                )}
                <p className="text-xs">{item.detail}</p>
              </li>
            ))}
          </ul>
        ) : null}
      </ContextRailSection>

      <ContextRailSection title="AI summary" variant="muted">
        <p>
          {occupancyRate >= 90
            ? "Strong occupancy — focus on renewals and preventive maintenance."
            : vacancyUnits > 0
              ? `${vacancyUnits} vacant unit${vacancyUnits === 1 ? "" : "s"} — prioritize leasing outreach.`
              : "Portfolio baseline established — add units and tenants to unlock insights."}
        </p>
      </ContextRailSection>

      <ContextRailSection title="Upcoming tasks">
        <ul className="space-y-1">
          {vacancyUnits > 0 ? <li>• Market {vacancyUnits} vacant unit{vacancyUnits === 1 ? "" : "s"}</li> : null}
          {openMaintenance.length > 0 ? <li>• Review {openMaintenance.length} open work order{openMaintenance.length === 1 ? "" : "s"}</li> : null}
          {activeLeases.length === 0 && unitsTotal > 0 ? <li>• Create first lease</li> : null}
          {unitsTotal === 0 ? <li>• Add units to this property</li> : null}
        </ul>
      </ContextRailSection>
    </ContextRail>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mpa-section-label">{label}</p>
      <p className="font-medium text-[var(--mpa-color-text-primary)]">{value}</p>
    </div>
  );
}
