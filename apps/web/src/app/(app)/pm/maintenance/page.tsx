import { ModuleAlignmentPage } from "../../../../components/commercial/module-alignment-page";

export default function Page() {
  return (
    <ModuleAlignmentPage
      product="Property Manager"
      title="Maintenance"
      description="Residential and unit maintenance. Not Facility Operations."
      readiness="aligned"
      entitlement="pm.maintenance"
      includedIn={["Property Manager", "Complete Platform"]}
      requiresComplete="Facility-only customers"
    />
  );
}
