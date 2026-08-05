import { OperationsCenterView } from "../../../components/master-admin/operations-center-view";
import { RoleUniversalDashboard } from "../../../components/dashboard-framework/role-universal-dashboard";
import { requireMasterAdminPageAccess } from "../../../lib/master-admin/access";
import { getOperationsCenterSnapshot } from "../../../lib/master-admin/operations-center";
import { buildSupportDashboardViewModel } from "../../../lib/dashboard/ux016-role-builders";
import { getTimeGreeting } from "../../../lib/format/display-labels";

export default async function MasterAdminOperationsCenterPage() {
  const { user, organizationId } = await requireMasterAdminPageAccess();
  const snapshot = await getOperationsCenterSnapshot(user, organizationId);
  const model = buildSupportDashboardViewModel({
    timeGreeting: getTimeGreeting(),
    dateLabel: new Intl.DateTimeFormat(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric"
    }).format(new Date()),
    snapshot
  });

  return (
    <div className="space-y-6">
      <RoleUniversalDashboard model={model} />
      <OperationsCenterView snapshot={snapshot} />
    </div>
  );
}
