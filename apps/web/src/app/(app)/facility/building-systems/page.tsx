import { FacilityModulePage } from "../../../../components/facility/facility-module-page";

export default function Page() {
  return (
    <FacilityModulePage
      title="Building Systems"
      description="HVAC, electrical, and life-safety systems context for assets, work, and vendors."
      readiness="planned"
      entitlement="facility.building_systems"
      includedIn={["Facility Operations", "Complete Platform"]}
      requiresComplete="Property Manager-only customers"
      domain="building_systems"
    />
  );
}
