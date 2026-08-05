import { UniversalDashboard } from "../dashboard-framework";
import { WorkOrdersTable } from "./work-orders-table";
import { buildMaintenanceCommandCenterViewModel } from "../../lib/maintenance/ux016-view-model";
import type { WorkOrderListItem } from "../../lib/maintenance/server";

/**
 * CORE-004 Phase 2 — Maintenance Operations home (STD-001 UDF).
 */
export function MaintenanceCommandCenter({
  items,
  permissions,
  vendors,
  userName
}: {
  items: WorkOrderListItem[];
  permissions: {
    canCreate: boolean;
    canUpdate: boolean;
    canAssign: boolean;
    canArchive: boolean;
    canDelete: boolean;
    canAssignVendor: boolean;
  };
  vendors: Array<{ id: string; businessName: string }>;
  userName: string | null;
}) {
  const model = buildMaintenanceCommandCenterViewModel({
    items,
    canCreate: permissions.canCreate,
    canAssign: permissions.canAssign,
    userName
  });

  return (
    <div className="space-y-8" data-core004="maintenance-command-center" data-std001="maintenance-home">
      <UniversalDashboard model={model} />
      <section aria-labelledby="maintenance-directory-heading" className="space-y-3">
        <h2
          id="maintenance-directory-heading"
          className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]"
        >
          Work order directory
        </h2>
        <WorkOrdersTable initialItems={items} permissions={permissions} vendors={vendors} />
      </section>
    </div>
  );
}
