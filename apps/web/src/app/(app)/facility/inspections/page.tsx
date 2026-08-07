import { Suspense } from "react";
import { InspectionsDirectory } from "../../../../components/facility/inspections-directory";

export default function Page() {
  return (
    <Suspense fallback={<main className="flex-1 p-6 text-sm">Loading Inspections…</main>}>
      <InspectionsDirectory />
    </Suspense>
  );
}
