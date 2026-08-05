/**
 * UX-013 Slice A — operational module selection for public acquisition.
 * Entitlement bind is Slice B; this module is UX/catalog continuity only.
 */

export const ACQ_MODULE_SELECTIONS = ["property_ops", "facility_ops", "both"] as const;

export type AcqModuleSelection = (typeof ACQ_MODULE_SELECTIONS)[number];

export type AcqModuleOption = {
  id: AcqModuleSelection;
  title: string;
  subtitle: string;
  outcomes: string[];
};

export const ACQ_MODULE_OPTIONS: readonly AcqModuleOption[] = [
  {
    id: "property_ops",
    title: "Property Operations",
    subtitle: "Professional property management platform",
    outcomes: [
      "Portfolio, units, and residents in one workspace",
      "Leasing and screening workflows",
      "Maintenance and vendor coordination"
    ]
  },
  {
    id: "facility_ops",
    title: "Facility Operations",
    subtitle: "Professional facility operations platform",
    outcomes: [
      "Facility hub for technicians and floor work",
      "Preventive maintenance and inspections",
      "Inventory and facility reporting"
    ]
  },
  {
    id: "both",
    title: "Both Modules",
    subtitle: "Property and facility together — bundle pricing applies",
    outcomes: [
      "Property and facility operations in one organization",
      "Shared messaging, documents, and team seats",
      "Higher value than one module; less than two separate plans"
    ]
  }
] as const;

export function isAcqModuleSelection(value: string): value is AcqModuleSelection {
  return (ACQ_MODULE_SELECTIONS as readonly string[]).includes(value);
}

export function parseAcqModuleSelection(
  value: string | string[] | undefined | null
): AcqModuleSelection | null {
  if (typeof value !== "string") return null;
  return isAcqModuleSelection(value) ? value : null;
}

export function moduleSelectionLabel(selection: AcqModuleSelection): string {
  return ACQ_MODULE_OPTIONS.find((option) => option.id === selection)?.title ?? selection;
}

export function modulesPricingHref(selection: AcqModuleSelection): string {
  return `/pricing?modules=${selection}`;
}

export function modulesCheckoutHref(input: {
  plan: string;
  interval: string;
  modules: AcqModuleSelection;
}): string {
  return `/acquire/start?plan=${input.plan}&interval=${input.interval}&modules=${input.modules}`;
}
