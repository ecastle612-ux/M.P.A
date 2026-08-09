import { FacilityModulePage } from "../../../../components/facility/facility-module-page";

export default function Page() {
  return (
    <FacilityModulePage
      title="Inventory"
      description="Facility inventory visibility for stock, receiving, and parts readiness on the job."
      readiness="planned"
      entitlement="facility.inventory"
      includedIn={["Facility Operations", "Complete Platform"]}
      requiresComplete="Property Manager-only customers"
      domain="inventory"
    />
  );
}
