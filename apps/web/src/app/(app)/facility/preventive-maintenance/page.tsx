import { FacilityModulePage } from "../../../../components/facility/facility-module-page";

export default function Page() {
  return (
    <FacilityModulePage
      title="Preventive Maintenance"
      description="Preventive schedules and due windows so facility teams act before equipment fails."
      readiness="planned"
      entitlement="facility.preventive"
      includedIn={["Facility Operations", "Complete Platform"]}
      requiresComplete="Property Manager-only customers"
      domain="preventive"
    />
  );
}
