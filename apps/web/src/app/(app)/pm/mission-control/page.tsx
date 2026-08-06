import { ModuleAlignmentPage } from "../../../../components/commercial/module-alignment-page";

export default function Page() {
  return (
    <ModuleAlignmentPage
      product="Property Manager"
      title="Mission Control"
      description="Property Manager attention home. Not an analytics dashboard."
      readiness="aligned"
      entitlement="pm.mission_control"
      includedIn={["Property Manager", "Complete Platform"]}
      requiresComplete="Facility-only customers"
    />
  );
}
