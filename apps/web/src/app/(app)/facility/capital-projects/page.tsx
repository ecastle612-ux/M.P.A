import { FacilityModulePage } from "../../../../components/facility/facility-module-page";

export default function Page() {
  return (
    <FacilityModulePage
      title="Capital Projects"
      description="Capital projects remain deferred commercially — this route stays honest and document-ready."
      readiness="planned"
      entitlement="facility.capital_projects"
      includedIn={["Facility Operations", "Complete Platform"]}
      requiresComplete="Property Manager-only customers"
      domain="capital"
    />
  );
}
