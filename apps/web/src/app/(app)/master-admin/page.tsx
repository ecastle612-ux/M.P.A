import { OperationsCenterView } from "../../../components/master-admin/operations-center-view";
import { requireMasterAdminPageAccess } from "../../../lib/master-admin/access";
import { getOperationsCenterSnapshot } from "../../../lib/master-admin/operations-center";

export default async function MasterAdminOperationsCenterPage() {
  const { user, organizationId } = await requireMasterAdminPageAccess();
  const snapshot = await getOperationsCenterSnapshot(user, organizationId);

  return <OperationsCenterView snapshot={snapshot} />;
}
