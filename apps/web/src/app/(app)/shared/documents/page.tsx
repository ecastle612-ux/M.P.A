import { ModuleAlignmentPage } from "../../../../components/commercial/module-alignment-page";

export default function Page() {
  return (
    <ModuleAlignmentPage
      product="Shared Platform"
      title="Documents"
      description="Shared document surface for entitled products."
      readiness="aligned"
      entitlement="platform.documents"
      includedIn={["Property Manager", "Facility Operations", "Complete Platform"]}
    />
  );
}
