import { Suspense } from "react";
import { ResidentCommandCenter } from "../../../../../components/resident/resident-command-center";

export default async function Page({
  params
}: {
  params: Promise<{ residentId: string }>;
}) {
  const { residentId } = await params;
  return (
    <Suspense fallback={<main className="flex-1 p-6 text-sm">Loading resident…</main>}>
      <ResidentCommandCenter residentId={residentId} />
    </Suspense>
  );
}
