import { Suspense } from "react";
import { PartsCatalog } from "../../../../components/facility/parts-catalog";

export default function Page() {
  return (
    <Suspense fallback={<main className="flex-1 p-6 text-sm">Loading Parts…</main>}>
      <PartsCatalog />
    </Suspense>
  );
}
