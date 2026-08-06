import { ModuleAlignmentPage } from "../../../../components/commercial/module-alignment-page";

export default function Page() {
  return (
    <ModuleAlignmentPage
      product="Shared Platform"
      title="Communications"
      description="Shared communications surface for entitled products."
      readiness="aligned"
      entitlement="platform.communications"
      includedIn={["Property Manager", "Facility Operations", "Complete Platform"]}
    />
  );
}
