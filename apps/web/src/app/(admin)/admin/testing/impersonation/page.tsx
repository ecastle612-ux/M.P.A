import { Suspense } from "react";
import { ViewAsConsole } from "../../../../../components/admin/view-as-console";
import { loadOpsDirectories } from "../../../../../lib/admin/load-ops-directories";

export default async function Page() {
  const data = await loadOpsDirectories();
  const organizations = data.organizations.map((o) => ({ id: o.id, name: o.name }));
  return (
    <Suspense fallback={<p className="p-6 text-sm">Loading View As…</p>}>
      <ViewAsConsole organizations={organizations} />
    </Suspense>
  );
}
