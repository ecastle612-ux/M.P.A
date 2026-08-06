import { Suspense } from "react";
import { PropertiesDirectory } from "../../../../components/property/properties-directory";

export default function Page() {
  return (
    <Suspense fallback={<main className="flex-1 p-6 text-sm">Loading properties…</main>}>
      <PropertiesDirectory />
    </Suspense>
  );
}
