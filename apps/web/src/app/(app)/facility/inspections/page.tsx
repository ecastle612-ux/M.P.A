import { FacilityModulePage } from "../../../../components/facility/facility-module-page";

export default function Page() {
  return (
    <FacilityModulePage
      title="Inspections"
      description="Facility and building inspection programs with evidence, failures, and corrective follow-through."
      readiness="planned"
      entitlement="facility.inspections"
      includedIn={["Facility Operations", "Complete Platform"]}
      requiresComplete="Property Manager-only customers"
      domain="inspections"
    />
  );
}
