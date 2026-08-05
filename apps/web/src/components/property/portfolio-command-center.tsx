import { UniversalDashboard } from "../dashboard-framework";
import { PropertiesTable } from "./properties-table";
import { buildPortfolioPropertiesViewModel } from "../../lib/property/ux016-view-model";
import type { PropertyListItem } from "../../lib/property/contracts";

/**
 * CORE-004 Phase 1 — Portfolio Property Operations home (STD-001 UDF + existing table tools).
 */
export function PortfolioCommandCenter({
  items,
  permissions,
  userName,
  organizationName
}: {
  items: PropertyListItem[];
  permissions: {
    canCreate: boolean;
    canUpdate: boolean;
    canArchive: boolean;
    canDelete: boolean;
  };
  userName: string | null;
  organizationName: string | null;
}) {
  const model = buildPortfolioPropertiesViewModel({
    items,
    canCreate: permissions.canCreate,
    userName,
    organizationName
  });

  return (
    <div className="space-y-8" data-core004="portfolio-command-center" data-std001="properties-home">
      <UniversalDashboard model={model} />
      <section aria-labelledby="portfolio-properties-table-heading" className="space-y-3">
        <h2
          id="portfolio-properties-table-heading"
          className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]"
        >
          Portfolio directory
        </h2>
        <PropertiesTable initialItems={items} permissions={permissions} />
      </section>
    </div>
  );
}
