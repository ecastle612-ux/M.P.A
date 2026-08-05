"use client";

import { UniversalDashboard } from "../dashboard-framework";
import type { UniversalDashboardViewModel } from "../dashboard-framework";
import { FinancialOverview } from "./financial-overview";
import { PmBillingPanel } from "../billing/pm-billing-panel";
import type { FinancialActivityRecord } from "../../lib/financial/contracts";
import type { FinancialDashboardMetrics } from "../../lib/financial/server";

/**
 * STD-001 remediation — Financial ops command center on Universal Dashboard Framework.
 * Legacy overview + billing tools remain below Insights.
 */
export function FinancialUniversalDashboard({
  model,
  metrics,
  activity,
  canCreate
}: {
  model: UniversalDashboardViewModel;
  metrics: FinancialDashboardMetrics;
  activity: FinancialActivityRecord[];
  canCreate: boolean;
}) {
  return (
    <div className="space-y-8" data-std001="financial-universal-dashboard">
      <UniversalDashboard model={model} />
      <section aria-labelledby="financial-tools-heading" className="space-y-6">
        <h2
          id="financial-tools-heading"
          className="sr-only"
        >
          Financial tools
        </h2>
        <FinancialOverview
          metrics={metrics}
          activity={activity}
          permissions={{ canCreate }}
          embedded
        />
        <PmBillingPanel />
      </section>
    </div>
  );
}
