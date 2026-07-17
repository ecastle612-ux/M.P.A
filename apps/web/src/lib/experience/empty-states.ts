export type ModuleEmptyStateKey =
  | "properties"
  | "units"
  | "tenants"
  | "leases"
  | "maintenance"
  | "vendors"
  | "rentCharges"
  | "expenses"
  | "ownerStatements"
  | "announcements";

export type ModuleEmptyStateConfig = {
  icon: string;
  title: string;
  description: string;
  examples?: string[];
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  filteredMessage: string;
};

export const MODULE_EMPTY_STATES: Record<ModuleEmptyStateKey, ModuleEmptyStateConfig> = {
  properties: {
    icon: "▣",
    title: "Build your portfolio",
    description:
      "Properties are the foundation of everything inside M.P.A. — units, tenants, leases, maintenance, and financials all connect here.",
    examples: [
      "Apartment buildings and multi-family communities",
      "HOA and condo associations",
      "Commercial and mixed-use developments"
    ],
    primaryLabel: "Create Property",
    primaryHref: "/properties/new",
    secondaryLabel: "Continue Setup",
    secondaryHref: "/setup",
    filteredMessage: "Nothing matches your search. Try a different name, city, or filter."
  },
  units: {
    icon: "▦",
    title: "Add units to your properties",
    description:
      "Units let you track occupancy, rent, and who lives where. Add your first unit once a property is in place.",
    examples: ["Studio, 1-bed, and 2-bed apartments", "Retail suites and office spaces", "Garage or storage units"],
    primaryLabel: "Add Unit",
    primaryHref: "/units/new",
    secondaryLabel: "View Properties",
    secondaryHref: "/properties",
    filteredMessage: "No units match your filters. Adjust search or status to continue."
  },
  tenants: {
    icon: "◎",
    title: "Add residents to your portfolio",
    description:
      "Once your units are ready, add residents to begin managing leases, payments, maintenance, and communications in one place.",
    examples: ["Move-in contact details and emergency contacts", "Assign tenants to specific units", "Prepare for lease creation"],
    primaryLabel: "Add Tenant",
    primaryHref: "/tenants/new",
    secondaryLabel: "View Units",
    secondaryHref: "/units",
    filteredMessage: "No tenants match your search. Try a different name, email, or filter."
  },
  leases: {
    icon: "⎙",
    title: "Formalize occupancy with a lease",
    description:
      "Leases connect tenants to units and unlock rent collection. Create a lease when someone is ready to move in.",
    examples: ["Fixed-term and month-to-month agreements", "Rent amounts, deposits, and move-in dates", "Renewals and lifecycle tracking"],
    primaryLabel: "Create Lease",
    primaryHref: "/leases/new",
    secondaryLabel: "View Tenants",
    secondaryHref: "/tenants",
    filteredMessage: "No leases match your filters. Adjust search or status to continue."
  },
  maintenance: {
    icon: "⚙",
    title: "Track repairs and requests",
    description:
      "Log maintenance requests to assign vendors, notify tenants, and keep a clear history of work across your portfolio.",
    examples: ["HVAC, plumbing, and appliance repairs", "Turnover and make-ready work", "Emergency and routine service"],
    primaryLabel: "Log Request",
    primaryHref: "/maintenance/new",
    secondaryLabel: "View Vendors",
    secondaryHref: "/vendors",
    filteredMessage: "No work orders match your filters. Adjust search, status, or priority."
  },
  vendors: {
    icon: "◈",
    title: "Build your vendor network",
    description:
      "Create a trusted network of maintenance professionals so repairs move faster and every job stays visible.",
    examples: ["Plumbers, electricians, and HVAC contractors", "Landscaping and cleaning crews", "Preferred vendors for urgent work"],
    primaryLabel: "Add Vendor",
    primaryHref: "/vendors/new",
    filteredMessage: "No vendors match your search. Try a different name or filter."
  },
  rentCharges: {
    icon: "¤",
    title: "Financial activity starts with leases",
    description:
      "Rent charges appear when leases become active. Create a lease first, or manually record a charge when you're ready to collect.",
    examples: ["Monthly rent and security deposits", "Custom one-time charges", "Payment tracking and balances"],
    primaryLabel: "Create Charge",
    primaryHref: "/financials/charges/new",
    secondaryLabel: "Create Lease",
    secondaryHref: "/leases/new",
    filteredMessage: "No charges match your filters. Adjust search, type, or status."
  },
  expenses: {
    icon: "▤",
    title: "Track property expenses",
    description:
      "Record operating expenses to keep owner statements accurate and understand where money goes across your portfolio.",
    examples: ["Repairs linked to maintenance work", "Utilities and insurance", "Management and administrative costs"],
    primaryLabel: "Record Expense",
    primaryHref: "/financials/expenses/new",
    secondaryLabel: "Financial Overview",
    secondaryHref: "/financials",
    filteredMessage: "No expenses match your filters. Adjust search or category."
  },
  ownerStatements: {
    icon: "▤",
    title: "Share results with property owners",
    description:
      "Owner statements summarize income, expenses, and net performance for a period — ready to review and deliver.",
    examples: ["Monthly and quarterly reporting", "Income, expenses, and occupancy summaries", "Outstanding balance snapshots"],
    primaryLabel: "Generate Statement",
    primaryHref: "/financials/owner-statements/generate",
    secondaryLabel: "Financial Overview",
    secondaryHref: "/financials",
    filteredMessage: "No statements match your filters. Adjust search or status."
  },
  announcements: {
    icon: "✉",
    title: "Reach your residents",
    description:
      "Send building updates, maintenance notices, and community news. Compose a message, choose who receives it, and track readership.",
    examples: ["Move-in welcome messages", "Scheduled maintenance notices", "Community events and policy updates"],
    primaryLabel: "Compose Message",
    primaryHref: "/communications/new",
    filteredMessage: "No announcements match your filters. Adjust search or status."
  }
};

export function getModuleEmptyStateProps(
  module: ModuleEmptyStateKey,
  options: { canCreate?: boolean; canSecondary?: boolean } = {}
) {
  const config = MODULE_EMPTY_STATES[module];
  const { canCreate = true, canSecondary = true } = options;

  return {
    icon: config.icon,
    title: config.title,
    description: config.description,
    ...(config.examples ? { examples: config.examples } : {}),
    ...(canCreate ? { action: { label: config.primaryLabel, href: config.primaryHref } } : {}),
    ...(canSecondary && config.secondaryLabel && config.secondaryHref
      ? { secondaryAction: { label: config.secondaryLabel, href: config.secondaryHref } }
      : {})
  };
}

export function getFilteredEmptyMessage(module: ModuleEmptyStateKey): string {
  return MODULE_EMPTY_STATES[module].filteredMessage;
}
