import { FacilityInventoryDetailWorkspace } from "../../../../../components/facility/facility-inventory-detail-workspace";

export default async function Page({ params }: { params: Promise<{ itemId: string }> }) {
  const { itemId } = await params;
  return <FacilityInventoryDetailWorkspace itemId={itemId} />;
}
