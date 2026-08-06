import { Suspense } from "react";
import { ResidentsDirectory } from "../../../../components/resident/residents-directory";

export default function Page() {
  return (
    <Suspense fallback={<main className="flex-1 p-6 text-sm">Loading residents…</main>}>
      <ResidentsDirectory />
    </Suspense>
  );
}
