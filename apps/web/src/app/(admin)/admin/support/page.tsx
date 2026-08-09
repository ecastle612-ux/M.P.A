import { SupportOpsWorkspace } from "../../../../components/admin/ops-workspaces";
import { loadOpsDirectories } from "../../../../lib/admin/load-ops-directories";

export default async function Page() {
  const data = await loadOpsDirectories();
  return (
    <SupportOpsWorkspace
      organizations={data.organizations}
      customers={data.customers}
      events={data.supportEvents}
    />
  );
}
