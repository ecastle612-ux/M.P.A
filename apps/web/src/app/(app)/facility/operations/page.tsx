import { Suspense } from "react";
import { OperationsQueue } from "../../../../components/facility/operations-queue";

export default function Page() {
  return (
    <Suspense fallback={<main className="flex-1 p-6 text-sm">Loading Facility Operations…</main>}>
      <OperationsQueue />
    </Suspense>
  );
}
