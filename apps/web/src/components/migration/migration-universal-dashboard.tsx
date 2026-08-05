"use client";

import { UniversalDashboard } from "../dashboard-framework";
import type { UniversalDashboardViewModel } from "../dashboard-framework";
import { MigrationSwitchingExperience } from "./migration-switching-experience";
import { MigrationDashboard } from "./migration-dashboard";
import type { MigrationJobRecord } from "../../lib/migration/contracts";
import type { MigrationDashboardMetrics } from "../../lib/migration/server";
import type { CustomerSwitchingSnapshot } from "../../lib/migration/switching";

/**
 * STD-001 remediation — Migration ops command center on Universal Dashboard Framework.
 * Switching checklist + job table remain tools below Insights.
 */
export function MigrationUniversalDashboard({
  model,
  switching,
  jobs,
  metrics,
  canCreate,
  canUpdate
}: {
  model: UniversalDashboardViewModel;
  switching: CustomerSwitchingSnapshot;
  jobs: MigrationJobRecord[];
  metrics: MigrationDashboardMetrics;
  canCreate: boolean;
  canUpdate: boolean;
}) {
  return (
    <div className="space-y-8" data-std001="migration-universal-dashboard">
      <UniversalDashboard model={model} />
      <section aria-labelledby="migration-tools-heading" className="space-y-6">
        <div>
          <h2
            id="migration-tools-heading"
            className="text-sm font-semibold text-[var(--mpa-color-text-primary)]"
          >
            Migration tools
          </h2>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
            Switching checklist and job details — after the operational briefing.
          </p>
        </div>
        <MigrationSwitchingExperience
          initial={switching}
          canCreate={canCreate}
          canUpdate={canUpdate}
        />
        <MigrationDashboard jobs={jobs} metrics={metrics} canCreate={canCreate} embedded />
      </section>
    </div>
  );
}
