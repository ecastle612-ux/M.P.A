import { ModuleAlignmentPage } from "../../../../components/commercial/module-alignment-page";

export default function Page() {
  return (
    <ModuleAlignmentPage
      product="Property Manager"
      title="Financial Operations"
      description="Rent, charges, and collections. Implementation deferred — commercial ownership only."
      readiness="planned"
      entitlement="pm.financial_operations"
      includedIn={["Property Manager", "Complete Platform"]}
      requiresComplete="Facility-only customers"
    />
  );
}
