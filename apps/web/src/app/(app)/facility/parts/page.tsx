import { FacilityModulePage } from "../../../../components/facility/facility-module-page";

export default function Page() {
  return (
    <FacilityModulePage
      title="Parts"
      description="Parts coverage for technicians — critical spares, asset linkage, and purchase records."
      readiness="planned"
      entitlement="facility.parts"
      includedIn={["Facility Operations", "Complete Platform"]}
      requiresComplete="Property Manager-only customers"
      domain="parts"
    />
  );
}
