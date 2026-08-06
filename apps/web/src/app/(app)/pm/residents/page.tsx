import { ModuleAlignmentPage } from "../../../../components/commercial/module-alignment-page";

export default function Page() {
  return (
    <ModuleAlignmentPage
      product="Property Manager"
      title="Residents"
      description="Resident operational records."
      readiness="aligned"
      entitlement="pm.residents"
      includedIn={["Property Manager", "Complete Platform"]}
      requiresComplete="Facility-only customers"
    />
  );
}
