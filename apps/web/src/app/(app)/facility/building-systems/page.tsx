import { ModuleAlignmentPage } from "../../../../components/commercial/module-alignment-page";

export default function Page() {
  return (
    <ModuleAlignmentPage
      product="Facility Operations"
      title="Building Systems"
      description="Building systems model. Feature work not in Phase 1."
      readiness="planned"
      entitlement="facility.building_systems"
      includedIn={["Facility Operations", "Complete Platform"]}
      requiresComplete="Property Manager-only customers"
    />
  );
}
