"use client";

import { UniversalDashboard } from "../dashboard-framework";
import type { UniversalDashboardViewModel } from "../dashboard-framework";
import { TechnicianDashboard } from "./technician-dashboard";
import type { TechnicianDashboardBuckets } from "../../lib/facility/technician-dashboard";

/**
 * STD-001 remediation — Facility Operations on Universal Dashboard Framework.
 * Parallel dashboard hero removed; bucket boards remain tools below Insights.
 */
export function FacilityUniversalDashboard({
  model,
  buckets,
  canCreateWorkOrder,
  canWriteInventory
}: {
  model: UniversalDashboardViewModel;
  buckets: TechnicianDashboardBuckets;
  canCreateWorkOrder: boolean;
  canWriteInventory: boolean;
}) {
  return (
    <div className="space-y-8" data-std001="facility-universal-dashboard">
      <UniversalDashboard model={model} />
      <section aria-labelledby="facility-tools-heading" className="space-y-3">
        <div>
          <h2
            id="facility-tools-heading"
            className="text-sm font-semibold text-[var(--mpa-color-text-primary)]"
          >
            Facility boards
          </h2>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
            Today, overdue, waiting, and inventory tools — after the operational briefing.
          </p>
        </div>
        <TechnicianDashboard
          buckets={buckets}
          canCreateWorkOrder={canCreateWorkOrder}
          canWriteInventory={canWriteInventory}
          embedded
        />
      </section>
    </div>
  );
}
