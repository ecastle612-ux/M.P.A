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
  whyItMatters?: string;
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
    whyItMatters: "Without a property, occupancy, rent, and repairs have nowhere to attach.",
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
    whyItMatters: "Move-ins, leases, and vacant-unit actions all start from a unit record.",
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
      "Once your units are ready, move residents in with the guided wizard — lease, portal invite, and occupancy update together.",
    whyItMatters: "Residents unlock rent charges, communications, and maintenance context.",
    examples: ["Move-in contact details and emergency contacts", "Assign tenants to specific units", "Prepare for lease creation"],
    primaryLabel: "+ New Resident",
    primaryHref: "/residents/move-in",
    secondaryLabel: "Manual entry (advanced)",
    secondaryHref: "/tenants/new",
    filteredMessage: "No tenants match your search. Try a different name, email, or filter."
  },
  leases: {
    icon: "⎙",
    title: "Leases come from Move in",
    description:
      "The recommended path generates the lease inside guided Move in. Use New lease only for exceptional admin cases.",
    whyItMatters: "Active leases drive rent collection, deposits, and owner reporting.",
    examples: ["Fixed-term and month-to-month agreements", "Rent amounts, deposits, and move-in dates", "Renewals and lifecycle tracking"],
    primaryLabel: "Start Move in",
    primaryHref: "/residents/move-in",
    secondaryLabel: "New lease (advanced)",
    secondaryHref: "/leases/new",
    filteredMessage: "No leases match your filters. Adjust search or status to continue."
  },
  maintenance: {
    icon: "⚙",
    title: "Track repairs and requests",
    description:
      "Log maintenance requests to assign vendors, notify tenants, and keep a clear history of work across your portfolio.",
    whyItMatters: "Every logged request becomes facility history you can reuse on the next similar issue.",
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
    whyItMatters: "Known vendors reduce rework when the same issue shows up again.",
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
    whyItMatters: "Charges create the ledger owners and residents rely on for balances.",
    examples: ["Monthly rent and security deposits", "Custom one-time charges", "Payment tracking and balances"],
    primaryLabel: "Create Charge",
    primaryHref: "/financials/charges/new",
    secondaryLabel: "Start Move in",
    secondaryHref: "/residents/move-in",
    filteredMessage: "No charges match your filters. Adjust search, type, or status."
  },
  expenses: {
    icon: "▤",
    title: "Track property expenses",
    description:
      "Record operating expenses to keep owner statements accurate and understand where money goes across your portfolio.",
    whyItMatters: "Expenses complete the owner statement and keep repair costs visible.",
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
    whyItMatters: "Owners expect a clear period close without re-entering property context each time.",
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
    whyItMatters: "Clear notices reduce follow-up calls after maintenance and policy changes.",
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
    ...(config.whyItMatters ? { whyItMatters: config.whyItMatters } : {}),
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
