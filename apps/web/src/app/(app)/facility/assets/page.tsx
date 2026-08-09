import { FacilityModulePage } from "../../../../components/facility/facility-module-page";

export default function Page() {
  return (
    <FacilityModulePage
      title="Assets"
      description="Asset registry for health, warranty, service history, upcoming maintenance, open work, inspections, and related documents."
      readiness="planned"
      entitlement="facility.assets"
      includedIn={["Facility Operations", "Complete Platform"]}
      requiresComplete="Property Manager-only customers"
      domain="assets"
    />
  );
}
