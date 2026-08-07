import { Suspense } from "react";
import { PmProgramsDirectory } from "../../../../components/facility/pm-programs-directory";

export default function Page() {
  return (
    <Suspense
      fallback={<main className="flex-1 p-6 text-sm">Loading Preventive Maintenance…</main>}
    >
      <PmProgramsDirectory />
    </Suspense>
  );
}
