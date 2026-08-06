import { Suspense } from "react";
import { PropertyCommandCenter } from "../../../../../components/property/property-command-center";

type Params = { params: Promise<{ propertyId: string }> };

export default async function PropertyCommandCenterPage({ params }: Params) {
  const { propertyId } = await params;
  return (
    <Suspense fallback={<main className="flex-1 p-6 text-sm">Loading property…</main>}>
      <PropertyCommandCenter propertyId={propertyId} />
    </Suspense>
  );
}
