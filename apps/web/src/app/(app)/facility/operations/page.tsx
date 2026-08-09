import { FacilityModulePage } from "../../../../components/facility/facility-module-page";

export default function Page() {
  return (
    <FacilityModulePage
      title="Facility Operations"
      description="Corrective work-order operations — emergency, high priority, scheduled, waiting, and completed work."
      readiness="planned"
      entitlement="facility.operations"
      includedIn={["Facility Operations", "Complete Platform"]}
      requiresComplete="Property Manager-only customers"
      domain="operations"
    />
  );
}
