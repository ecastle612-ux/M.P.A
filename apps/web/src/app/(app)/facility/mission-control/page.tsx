import { ModuleAlignmentPage } from "../../../../components/commercial/module-alignment-page";

export default function Page() {
  return (
    <ModuleAlignmentPage
      product="Facility Operations"
      title="Mission Control"
      description="Facility Operations attention home — commercially aligned. Live facility workflows ship in later phases; start the day from Launcher or Property Manager Mission Control when entitled."
      readiness="aligned"
      entitlement="facility.mission_control"
      includedIn={["Facility Operations", "Complete Platform"]}
      requiresComplete="Property Manager-only customers"
    />
  );
}
