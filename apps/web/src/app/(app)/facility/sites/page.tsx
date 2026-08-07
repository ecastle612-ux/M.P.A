import { Suspense } from "react";
import { SitesDirectory } from "../../../../components/facility/sites-directory";

export default function Page() {
  return (
    <Suspense fallback={<main className="flex-1 p-6">Loading facility sites…</main>}>
      <SitesDirectory />
    </Suspense>
  );
}
