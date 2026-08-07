/**
 * UX-013 Slice A — operational module selection for public acquisition.
 * Entitlement bind is Slice B; this module is UX/catalog continuity only.
 *
 * Commercial copy here is presentation-only: selection ids, pricing hrefs,
 * and checkout contracts must stay unchanged under feature freeze.
 */

export const ACQ_MODULE_SELECTIONS = ["property_ops", "facility_ops", "both"] as const;

export type AcqModuleSelection = (typeof ACQ_MODULE_SELECTIONS)[number];

export type AcqModuleOption = {
  id: AcqModuleSelection;
  title: string;
  /** One-line “what you get” — avoids plan-name collision (Essentials / Professional). */
  subtitle: string;
  /** Buyer self-identification line. */
  bestFor: string;
  /** How this choice maps to the next pricing step (display only). */
  packageHint: string;
  outcomes: string[];
};

export const ACQ_MODULE_OPTIONS: readonly AcqModuleOption[] = [
  {
    id: "property_ops",
    title: "Property Operations",
    subtitle: "The property management workspace you run day to day",
    bestFor: "Best for property managers and leasing teams",
    packageHint: "One module · Essentials pricing on the next step",
    outcomes: [
      "Portfolio, units, and residents in one workspace",
      "Leasing and applicant screening",
      "Maintenance requests and vendor coordination"
    ]
  },
  {
    id: "facility_ops",
    title: "Facility Operations",
    subtitle: "The facility and technician workspace for buildings you operate",
    bestFor: "Best for facility and maintenance operations teams",
    packageHint: "One module · Essentials pricing on the next step",
    outcomes: [
      "Facility hub for technicians and floor work",
      "Preventive maintenance and inspections",
      "Inventory tracking and facility reporting"
    ]
  },
  {
    id: "both",
    title: "Property + Facility",
    subtitle: "Both operating modules in one organization and one subscription",
    bestFor: "Best for teams that run property and facility work together",
    packageHint: "Both modules · Professional bundle savings on the next step",
    outcomes: [
      "Everything in Property Operations and Facility Operations",
      "Shared messaging, documents, and team seats",
      "Priced as one bundle — more than one module, less than two separate plans"
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
