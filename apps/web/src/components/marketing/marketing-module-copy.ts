/**
 * Customer-facing module blurbs for public marketing surfaces.
 * Keeps commercial catalog honesty without exposing engineering readiness labels.
 */
export const MARKETING_MODULE_COPY: Record<string, string> = {
  organizations: "Company profile, team membership, and organization settings.",
  documents: "Shared document library to upload, organize, and retrieve property records.",
  communications: "Messages and notifications across residents, owners, and vendors.",
  pm_mission_control: "Your Property Manager home for ranked attention and next actions.",
  properties: "Portfolio properties and units in one operating record.",
  residents: "Resident records connected to leases, billing, and maintenance.",
  leasing: "Lease records and occupancy handoffs for your portfolio.",
  maintenance: "Unit and residential maintenance work — distinct from Facility Operations.",
  vendors: "Vendor relationships and work assigned from maintenance.",
  financial_operations:
    "Resident billing, rent collection, collections, vendor invoice approval, and owner summaries.",
  facility_mission_control:
    "Your Facility Operations home for daily attention once your plan is active.",
  facility_operations: "Facility work coverage included with the Facility Operations plan.",
  assets: "Equipment and asset coverage included with the Facility Operations plan.",
  inventory: "Storeroom and materials coverage included with the Facility Operations plan.",
  parts: "Parts catalog coverage included with the Facility Operations plan.",
  preventive_maintenance:
    "Preventive maintenance coverage included with the Facility Operations plan.",
  inspections: "Building and facility inspection coverage included with the Facility Operations plan.",
  safety: "Safety program coverage included with the Facility Operations plan.",
  compliance: "Facility compliance coverage included with the Facility Operations plan.",
  building_systems: "Building systems coverage included with the Facility Operations plan."
};

export function marketingModuleDescription(moduleId: string, fallback: string): string {
  return MARKETING_MODULE_COPY[moduleId] ?? fallback;
}
