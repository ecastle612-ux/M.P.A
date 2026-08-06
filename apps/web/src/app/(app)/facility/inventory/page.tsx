import { ModuleAlignmentPage } from "../../../../components/commercial/module-alignment-page";

export default function Page() {
  return (
    <ModuleAlignmentPage
      product="Facility Operations"
      title="Inventory"
      description="Inventory locations and counts. Feature work not in Phase 1."
      readiness="planned"
      entitlement="facility.inventory"
      includedIn={["Facility Operations", "Complete Platform"]}
      requiresComplete="Property Manager-only customers"
    />
  );
}
