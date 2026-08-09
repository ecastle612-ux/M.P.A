import { CommercialOpsWorkspace } from "../../../../../components/admin/ops-workspaces";
import { loadOpsDirectories } from "../../../../../lib/admin/load-ops-directories";

export default async function Page() {
  const data = await loadOpsDirectories();
  return (
    <CommercialOpsWorkspace
      subscriptions={data.subscriptions}
      purchases={data.purchases}
      commercial={data.commercial}
    />
  );
}
