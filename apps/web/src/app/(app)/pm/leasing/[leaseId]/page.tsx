import { Suspense } from "react";
import { LeaseCommandCenter } from "../../../../../components/leasing/lease-command-center";

export default async function Page({
  params
}: {
  params: Promise<{ leaseId: string }>;
}) {
  const { leaseId } = await params;
  return (
    <Suspense fallback={<main className="flex-1 p-6 text-sm">Loading lease…</main>}>
      <LeaseCommandCenter leaseId={leaseId} />
    </Suspense>
  );
}
