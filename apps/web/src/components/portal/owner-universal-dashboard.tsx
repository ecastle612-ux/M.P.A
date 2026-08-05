"use client";

import type { ReactNode } from "react";
import { UniversalDashboard } from "../dashboard-framework";
import type { UniversalDashboardViewModel } from "../dashboard-framework";
import { OwnerPortalDashboard } from "./owner-portal-dashboard";
import type { OwnerPortalDashboardModel } from "../../lib/owner-portal/dashboard";

/**
 * STD-001 remediation — Owner home on Universal Dashboard Framework.
 * Portfolio KPIs and activity tools remain below Insights.
 */
export function OwnerUniversalDashboard({
  model,
  ownerModel,
  demoPanel
}: {
  model: UniversalDashboardViewModel;
  ownerModel: OwnerPortalDashboardModel;
  demoPanel?: ReactNode;
}) {
  return (
    <div className="space-y-8" data-std001="owner-universal-dashboard">
      <UniversalDashboard model={model} />
      {demoPanel}
      <section aria-labelledby="owner-tools-heading" className="space-y-3">
        <div>
          <h2
            id="owner-tools-heading"
            className="text-sm font-semibold text-[var(--mpa-color-text-primary)]"
          >
            Portfolio performance
          </h2>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
            KPIs and recent activity — after what needs your attention.
          </p>
        </div>
        <OwnerPortalDashboard model={ownerModel} embedded />
      </section>
    </div>
  );
}
