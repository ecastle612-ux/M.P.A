import { FacilityModulePage } from "../../../../components/facility/facility-module-page";

export default function Page() {
  return (
    <FacilityModulePage
      title="Compliance"
      description="Building and facility compliance programs — certificates, deadlines, and audit-ready evidence."
      readiness="planned"
      entitlement="facility.compliance"
      includedIn={["Facility Operations", "Complete Platform"]}
      requiresComplete="Property Manager-only customers"
      domain="compliance"
    />
  );
}
