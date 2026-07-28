import { requireMasterAdminPageAccess } from "../../../../lib/master-admin/access";
import { AuthRecoveryPanel } from "../../../../components/master-admin/auth-recovery-panel";

export default async function MasterAdminRecoveryPage() {
  await requireMasterAdminPageAccess();
  return <AuthRecoveryPanel />;
}
