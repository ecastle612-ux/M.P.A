import { ModuleAlignmentPage } from "../../../../components/commercial/module-alignment-page";

export default function Page() {
  return (
    <ModuleAlignmentPage
      product="Facility Operations"
      title="Capital Projects"
      description="Future capital planning — intentionally deferred."
      readiness="planned"
      entitlement="facility.capital_projects"
      includedIn={["Facility Operations (future)", "Complete Platform (future)"]}
      requiresComplete="All current SKUs until future enablement"
    />
  );
}
