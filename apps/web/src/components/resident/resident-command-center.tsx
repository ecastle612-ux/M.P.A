import { UniversalDashboard } from "../dashboard-framework";
import { TenantsTable } from "../tenant/tenants-table";
import { buildResidentCommandCenterViewModel } from "../../lib/resident/ux016-view-model";
import type { TenantListItem } from "../../lib/tenant/server";

/**
 * CORE-004 Phase 4 — staff Resident Operations home (STD-001 UDF).
 */
export function ResidentCommandCenter({
  tenants,
  permissions,
  userName
}: {
  tenants: TenantListItem[];
  permissions: {
    canCreate: boolean;
    canUpdate: boolean;
    canArchive: boolean;
    canDelete: boolean;
  };
  userName: string | null;
}) {
  const model = buildResidentCommandCenterViewModel({
    tenants,
    canCreate: permissions.canCreate,
    userName
  });

  return (
    <div className="space-y-8" data-core004="resident-command-center" data-std001="resident-staff-home">
      <UniversalDashboard model={model} />
      <section aria-labelledby="resident-directory-heading" className="space-y-3">
        <h2
          id="resident-directory-heading"
          className="font-display text-lg font-semibold text-[var(--mpa-color-text-primary)]"
        >
          Resident directory
        </h2>
        <TenantsTable initialItems={tenants} permissions={permissions} />
      </section>
    </div>
  );
}
