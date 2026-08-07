import { Suspense } from "react";
import { InventoryDirectory } from "../../../../components/facility/inventory-directory";

export default function Page() {
  return (
    <Suspense fallback={<main className="flex-1 p-6 text-sm">Loading Inventory…</main>}>
      <InventoryDirectory />
    </Suspense>
  );
}
