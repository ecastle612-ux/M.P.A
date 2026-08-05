"use client";

import { UniversalDashboard } from "../dashboard-framework";
import type { UniversalDashboardViewModel } from "../dashboard-framework";
import { LeasesTable } from "./leases-table";
import type { LeaseListItem } from "../../lib/lease/server";

/**
 * STD-001 remediation — Leasing home on Universal Dashboard Framework.
 * Existing leasing pipeline table remains below Insights.
 */
export function LeasingUniversalDashboard({
  model,
  initialItems,
  permissions,
  initialStatusFilter
}: {
  model: UniversalDashboardViewModel;
  initialItems: LeaseListItem[];
  permissions: {
    canCreate: boolean;
    canUpdate: boolean;
    canArchive: boolean;
    canDelete: boolean;
  };
  initialStatusFilter?: string;
}) {
  return (
    <div className="space-y-8" data-std001="leasing-universal-dashboard">
      <UniversalDashboard model={model} />
      <section aria-labelledby="leasing-tools-heading" className="space-y-3">
        <div>
          <h2
            id="leasing-tools-heading"
            className="text-sm font-semibold text-[var(--mpa-color-text-primary)]"
          >
            Leasing pipeline
          </h2>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
            Filter, open, and advance leases — after the operational briefing.
          </p>
        </div>
        <LeasesTable
          initialItems={initialItems}
          permissions={permissions}
          embedded
          {...(initialStatusFilter ? { initialStatusFilter } : {})}
        />
      </section>
    </div>
  );
}
