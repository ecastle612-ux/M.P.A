import { Suspense } from "react";
import { SafetyDesk } from "../../../../components/facility/safety-desk";

export default function Page() {
  return (
    <Suspense fallback={<main className="flex-1 p-6 text-sm">Loading Safety…</main>}>
      <SafetyDesk />
    </Suspense>
  );
}
