import { Suspense } from "react";
import { AssetCommandCenter } from "../../../../../components/facility/asset-command-center";

type Params = { params: Promise<{ assetId: string }> };

export default async function Page({ params }: Params) {
  const { assetId } = await params;
  return (
    <Suspense fallback={<main className="flex-1 p-6">Loading asset…</main>}>
      <AssetCommandCenter assetId={assetId} />
    </Suspense>
  );
}
