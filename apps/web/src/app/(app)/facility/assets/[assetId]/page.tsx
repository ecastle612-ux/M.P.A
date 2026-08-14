import { FacilityAssetDetailWorkspace } from "../../../../../components/facility/facility-asset-detail-workspace";

export default async function Page({ params }: { params: Promise<{ assetId: string }> }) {
  const { assetId } = await params;
  return <FacilityAssetDetailWorkspace assetId={assetId} />;
}
