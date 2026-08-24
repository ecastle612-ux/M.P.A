import { Suspense } from "react";
import { FacilityPmWorkspace } from "../../../../components/facility/facility-pm-workspace";

export default function Page() {
  return (
    <Suspense fallback={<main className="p-6 text-sm">Loading Preventive Maintenance…</main>}>
      <FacilityPmWorkspace />
    </Suspense>
  );
}
