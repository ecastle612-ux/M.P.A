import { ModuleAlignmentPage } from "../../../../components/commercial/module-alignment-page";

export default function Page() {
  return (
    <ModuleAlignmentPage
      product="Facility Operations"
      title="Parts"
      description="Parts catalog. Feature work not in Phase 1."
      readiness="planned"
      entitlement="facility.parts"
      includedIn={["Facility Operations", "Complete Platform"]}
      requiresComplete="Property Manager-only customers"
    />
  );
}
