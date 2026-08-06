import { Suspense } from "react";
import { LeasingDirectory } from "../../../../components/leasing/leasing-directory";

export default function Page() {
  return (
    <Suspense fallback={<main className="flex-1 p-6 text-sm">Loading leasing…</main>}>
      <LeasingDirectory />
    </Suspense>
  );
}
