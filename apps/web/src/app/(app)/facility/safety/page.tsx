import { FacilityModulePage } from "../../../../components/facility/facility-module-page";

export default function Page() {
  return (
    <FacilityModulePage
      title="Safety"
      description="Safety programs, procedures, and incident documentation for facility teams."
      readiness="planned"
      entitlement="facility.safety"
      includedIn={["Facility Operations", "Complete Platform"]}
      requiresComplete="Property Manager-only customers"
      domain="safety"
    />
  );
}
