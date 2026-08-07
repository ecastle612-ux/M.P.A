import { Suspense } from "react";
import { AssetsDirectory } from "../../../../components/facility/assets-directory";

export default function Page() {
  return (
    <Suspense fallback={<main className="flex-1 p-6">Loading assets…</main>}>
      <AssetsDirectory />
    </Suspense>
  );
}
