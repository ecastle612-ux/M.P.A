import { Suspense } from "react";
import { ComplianceDesk } from "../../../../components/facility/compliance-desk";

export default function Page() {
  return (
    <Suspense fallback={<main className="flex-1 p-6 text-sm">Loading Compliance…</main>}>
      <ComplianceDesk />
    </Suspense>
  );
}
