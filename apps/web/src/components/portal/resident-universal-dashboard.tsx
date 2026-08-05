"use client";

import { UniversalDashboard } from "../dashboard-framework";
import type { UniversalDashboardViewModel } from "../dashboard-framework";
import { TenantPortalHome, type TenantAttentionItem, type TenantTodayCard } from "./tenant-portal-home";

/**
 * STD-001 remediation — Resident home on Universal Dashboard Framework.
 * Calm resident tools remain below Insights.
 */
export function ResidentUniversalDashboard({
  model,
  firstName,
  propertyName,
  unitNumber,
  hasLinkedTenant,
  attentionItems,
  todayCards
}: {
  model: UniversalDashboardViewModel;
  firstName: string;
  propertyName: string | null;
  unitNumber: string | null;
  hasLinkedTenant: boolean;
  attentionItems: TenantAttentionItem[];
  todayCards: TenantTodayCard[];
}) {
  return (
    <div className="space-y-8" data-std001="resident-universal-dashboard">
      <UniversalDashboard model={model} />
      <section aria-labelledby="resident-tools-heading" className="space-y-3">
        <div>
          <h2
            id="resident-tools-heading"
            className="text-sm font-semibold text-[var(--mpa-color-text-primary)]"
          >
            Resident tools
          </h2>
          <p className="mt-1 text-sm text-[var(--mpa-color-text-secondary)]">
            Pay rent, request maintenance, and reach your office — after your briefing.
          </p>
        </div>
        <TenantPortalHome
          firstName={firstName}
          propertyName={propertyName}
          unitNumber={unitNumber}
          hasLinkedTenant={hasLinkedTenant}
          attentionItems={attentionItems}
          todayCards={todayCards}
          embedded
        />
      </section>
    </div>
  );
}
