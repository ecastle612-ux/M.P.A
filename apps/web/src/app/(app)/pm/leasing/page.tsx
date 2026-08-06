import { ModuleAlignmentPage } from "../../../../components/commercial/module-alignment-page";

export default function Page() {
  return (
    <ModuleAlignmentPage
      product="Property Manager"
      title="Leasing"
      description="Vacancy-to-lease pipeline."
      readiness="aligned"
      entitlement="pm.leasing"
      includedIn={["Property Manager", "Complete Platform"]}
      requiresComplete="Facility-only customers"
    />
  );
}
