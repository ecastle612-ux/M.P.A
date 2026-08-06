import { ModuleAlignmentPage } from "../../../../components/commercial/module-alignment-page";

export default function Page() {
  return (
    <ModuleAlignmentPage
      product="Facility Operations"
      title="Compliance"
      description="Building and facility compliance. Feature work not in Phase 1."
      readiness="planned"
      entitlement="facility.compliance"
      includedIn={["Facility Operations", "Complete Platform"]}
      requiresComplete="Property Manager-only customers"
    />
  );
}
