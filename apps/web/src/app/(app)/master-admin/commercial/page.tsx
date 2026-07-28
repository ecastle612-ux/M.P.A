import { requireMasterAdminPageAccess } from "../../../../lib/master-admin/access";
import { CommercialDashboardPanel } from "../../../../components/master-admin/commercial-dashboard-panel";
import { CommercialOpsPanel } from "../../../../components/master-admin/commercial-ops-panel";

export default async function MasterAdminCommercialPage() {
  await requireMasterAdminPageAccess();
  return (
    <div className="space-y-6">
      <CommercialDashboardPanel />
      <CommercialOpsPanel />
    </div>
  );
}
