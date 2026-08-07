/**
 * UX-013 Slice A — operational module selection for public acquisition.
 * Entitlement bind is Slice B; this module is UX/catalog continuity only.
 *
 * Commercial presentation only: selection ids, pricing hrefs, and checkout
 * contracts stay unchanged. Facility is marketed as Coming Soon on /modules.
 */

export const ACQ_MODULE_SELECTIONS = ["property_ops", "facility_ops", "both"] as const;

export type AcqModuleSelection = (typeof ACQ_MODULE_SELECTIONS)[number];

export type AcqCapabilityGroup = {
  title: string;
  items: readonly string[];
  /** included = available today; planned = not sold as live yet */
  status: "included" | "planned";
};

export type AcqModuleCta = {
  label: string;
  href: string;
  /** pricing continues the self-serve funnel; interest uses existing contact-sales */
  kind: "pricing" | "interest";
};

export type AcqModuleOption = {
  id: AcqModuleSelection;
  title: string;
  subtitle: string;
  bestFor: string;
  /** Buyer-facing availability for this commercial choice */
  availability: "available" | "coming_soon";
  /** Short capability headline under the title */
  capabilitySummary: string;
  /** How this maps to the next step (display only) */
  packageHint: string;
  groups: readonly AcqCapabilityGroup[];
  /** Extra clarity lines (e.g. Complete Platform composition) */
  composition?: readonly string[];
  cta: AcqModuleCta;
};

const PROPERTY_MANAGER_GROUPS: readonly AcqCapabilityGroup[] = [
  {
    title: "Property Operations",
    status: "included",
    items: [
      "Property portfolio management",
      "Buildings / Units",
      "Resident management",
      "Occupancy tracking"
    ]
  },
  {
    title: "Leasing",
    status: "included",
    items: [
      "Applications",
      "Screening workflow",
      "Lease lifecycle",
      "SignWell e-signatures"
    ]
  },
  {
    title: "Maintenance",
    status: "included",
    items: [
      "Work orders",
      "Technician management",
      "Vendor management",
      "Resident maintenance requests"
    ]
  },
  {
    title: "Financial Operations",
    status: "included",
    items: [
      "Rent collection",
      "Resident billing",
      "Delinquency tracking",
      "Vendor payments",
      "Financial dashboards"
    ]
  },
  {
    title: "Communication",
    status: "included",
    items: [
      "Resident messaging",
      "Owner messaging",
      "Vendor messaging",
      "Notification center"
    ]
  },
  {
    title: "Documents",
    status: "included",
    items: [
      "Document vault",
      "Lease documents",
      "Property documents",
      "Resident documents",
      "Vendor documents"
    ]
  },
  {
    title: "Owner Experience",
    status: "included",
    items: ["Owner portal", "Portfolio overview", "Property financial summaries"]
  }
] as const;

const FACILITY_PLANNED_ITEMS = [
  "Asset management",
  "Inventory",
  "Preventive Maintenance",
  "Inspections",
  "Safety Programs",
  "Compliance",
  "Capital Projects",
  "Facility Reporting"
] as const;

const FACILITY_PLANNED_GROUPS: readonly AcqCapabilityGroup[] = [
  {
    title: "Facility Management",
    status: "planned",
    items: FACILITY_PLANNED_ITEMS
  }
] as const;

const COMPLETE_SHARED_GROUPS: readonly AcqCapabilityGroup[] = [
  {
    title: "Unified Platform",
    status: "included",
    items: [
      "Unified users",
      "Shared documents",
      "Shared messaging",
      "Shared dashboards",
      "Unified Assistant",
      "One organization",
      "One login"
    ]
  }
] as const;

export function countIncludedCapabilities(option: AcqModuleOption): number {
  return option.groups
    .filter((group) => group.status === "included")
    .reduce((total, group) => total + group.items.length, 0);
}

export function countListedCapabilities(groups: readonly AcqCapabilityGroup[]): number {
  return groups.reduce((total, group) => total + group.items.length, 0);
}

const PROPERTY_MANAGER_INCLUDED_COUNT = countListedCapabilities(PROPERTY_MANAGER_GROUPS);

export const ACQ_MODULE_OPTIONS: readonly AcqModuleOption[] = [
  {
    id: "property_ops",
    title: "Property Manager",
    subtitle: "Production-certified property management — everything you need to run the portfolio",
    bestFor: "Best for property managers, leasing, and resident operations teams",
    availability: "available",
    capabilitySummary: `${PROPERTY_MANAGER_INCLUDED_COUNT} included capabilities`,
    packageHint: "Available today · continue to plans & pricing",
    groups: PROPERTY_MANAGER_GROUPS,
    cta: {
      label: "See plans & pricing",
      href: "/pricing?modules=property_ops",
      kind: "pricing"
    }
  },
  {
    id: "facility_ops",
    title: "Facility Operations",
    subtitle: "Facility management for assets, inventory, preventive work, and compliance",
    bestFor: "Best for facility and maintenance operations teams",
    availability: "coming_soon",
    capabilitySummary: "Launching soon",
    packageHint: "Not available for purchase yet — join the waitlist",
    groups: FACILITY_PLANNED_GROUPS,
    cta: {
      label: "Join waitlist / Contact sales",
      href: "/contact-sales",
      kind: "interest"
    }
  },
  {
    id: "both",
    title: "Complete Platform",
    subtitle: "Property Manager today, plus Facility Operations when it releases — one organization",
    bestFor: "Best for teams that want the full operating surface over time",
    availability: "available",
    capabilitySummary: "Everything included",
    packageHint: "Property Manager available now · Facility Operations when released",
    composition: [
      "Includes everything in Property Manager",
      "Plus everything in Facility Operations once released"
    ],
    groups: [
      ...COMPLETE_SHARED_GROUPS,
      {
        title: "Facility Operations (when released)",
        status: "planned",
        items: FACILITY_PLANNED_ITEMS
      }
    ],
    cta: {
      label: "See plans & pricing",
      href: "/pricing?modules=both",
      kind: "pricing"
    }
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
