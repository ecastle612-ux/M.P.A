/**
 * Customer-facing module blurbs for public marketing surfaces.
 * Keeps commercial catalog honesty without exposing engineering readiness labels.
 */
export const MARKETING_MODULE_COPY: Record<string, string> = {
  organizations: "Company profile, team membership, and organization settings.",
  documents: "Shared documents to upload, organize, and retrieve operational records.",
  tables: "Shared operational tables for structured records your team already keeps in spreadsheets.",
  reports: "Reports and operational summaries for property and facility work.",
  communications:
    "Messages with residents, owners, and vendors. Email is used for invitations, work orders, conversations, and lifecycle notices when those are sent.",
  pm_mission_control: "Your Property Manager home for ranked attention and next actions.",
  properties: "Portfolio properties and units in one operating record.",
  residents:
    "Resident records, Add Tenant, digital Tenant Portal invitations, and move-out history.",
  leasing: "Lease records and occupancy handoffs for your portfolio.",
  maintenance: "Unit and residential maintenance work — distinct from Facility Operations.",
  vendors: "Vendor relationships and work assigned from maintenance.",
  financial_operations:
    "Collect rent online with Stripe. Choose bank payments, cards, or both. Tenants can pay once or authorize AutoPay for recurring rent and eligible fees. You control the amounts and payment options. Late fees are configured and posted by you, not assessed automatically.",
  facility_mission_control:
    "Your Facility Operations home for daily attention, open work, and next actions.",
  facility_operations:
    "Create, assign, start, progress, complete, and cancel facility work orders — with vendor handoff when needed.",
  assets: "Facility asset registry for equipment, location, lifecycle, and work history.",
  inventory: "Facility stock ledger for on-hand quantities, movements, and reorder levels — not a warehouse system.",
  parts: "Work-order queue for parts-related facility tasks — not a catalog or BOM system.",
  preventive_maintenance:
    "Work-order queue for preventive facility tasks — not an automated schedule engine.",
  inspections: "Work-order queue for inspection tasks across buildings and sites.",
  safety: "Work-order queue for safety-related facility tasks.",
  compliance: "Work-order queue for compliance-related facility tasks.",
  building_systems: "Work-order queue for building-systems facility tasks."
};

export function marketingModuleDescription(moduleId: string, fallback: string): string {
  return MARKETING_MODULE_COPY[moduleId] ?? fallback;
}
