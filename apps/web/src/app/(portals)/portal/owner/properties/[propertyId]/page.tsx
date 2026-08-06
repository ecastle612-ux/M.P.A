import { OwnerPropertyDrillDown } from "../../../../../../components/portal/owner-property-drill-down";

type Params = { params: Promise<{ propertyId: string }> };

export default async function OwnerPropertyPage({ params }: Params) {
  const { propertyId } = await params;
  return <OwnerPropertyDrillDown propertyId={propertyId} />;
}
