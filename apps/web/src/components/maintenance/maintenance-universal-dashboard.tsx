"use client";

import { UniversalDashboard } from "../dashboard-framework";
import type { UniversalDashboardViewModel } from "../dashboard-framework";
import { WorkOrdersTable } from "./work-orders-table";
import type { WorkOrderListItem } from "../../lib/maintenance/server";

/**
 * STD-001 remediation — Maintenance home on Universal Dashboard Framework.
 * Existing work queue remains below Insights.
 */
export function MaintenanceUniversalDashboard({
  model,
  initialItems,
  permissions,
  vendors,
  initialStatusFilter,
  initialPriorityFilter,
  initialQuery
}: {
  model: UniversalDashboardViewModel;
  initialItems: WorkOrderListItem[];
  permissions: {
    canCreate: boolean;
    canUpdate: boolean;
    canAssign: boolean;
    canArchive: boolean;
    canDelete: boolean;
    canAssignVendor?: boolean;
  };
  vendors?: Array<{ id: string; businessName: string }>;
  initialStatusFilter?: string;
  initialPriorityFilter?: string;
  initialQuery?: string;
}) {
  return (
    <div className="space-y-8" data-std001="maintenance-universal-dashboard">
      <UniversalDashboard model={model} />
      <section aria-labelledby="maintenance-tools-heading" className="space-y-3">
        <div>
          <h2
            id="maintenance-tools-heading"
            className="text-sm font-semibold text-[var(--mpa-color-text-primary)]"
          >
            Work queue
          </h2>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
            Assign, progress, and close work orders — after the operational briefing.
          </p>
        </div>
        <WorkOrdersTable
          initialItems={initialItems}
          permissions={permissions}
          embedded
          {...(vendors ? { vendors } : {})}
          {...(initialStatusFilter ? { initialStatusFilter } : {})}
          {...(initialPriorityFilter ? { initialPriorityFilter } : {})}
          {...(initialQuery ? { initialQuery } : {})}
        />
      </section>
    </div>
  );
}
