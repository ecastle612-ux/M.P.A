export type MasterAdminWorkspaceId =
  | "platform"
  | "customers"
  | "operations"
  | "support"
  | "sales"
  | "development"
  | "analytics";

export type WorkspaceLink = {
  href: string;
  label: string;
  description: string;
};

export type WorkspaceDefinition = {
  id: MasterAdminWorkspaceId;
  label: string;
  purpose: string;
  items: WorkspaceLink[];
};

/** Workspaces that deep-link into empty PM portfolio surfaces — hide for HQ-only operators. */
const MASTER_ADMIN_ONLY_HIDDEN_WORKSPACES: ReadonlySet<MasterAdminWorkspaceId> = new Set([
  "operations"
]);

export const MASTER_ADMIN_WORKSPACES: WorkspaceDefinition[] = [
  {
    id: "platform",
    label: "Platform",
    purpose: "Keep the product running",
    items: [
      {
        href: "/master-admin/health",
        label: "Platform Health",
        description: "Org-scoped table and data health checks"
      },
      {
        href: "/settings/integrations",
        label: "Providers",
        description: "Provider connection and delivery posture"
      },
      {
        href: "/master-admin/notifications",
        label: "Push Diagnostics",
        description: "Device registrations, health, and test sends"
      },
      {
        href: "/settings/preferences",
        label: "Preferences",
        description: "Appearance, notifications, and install options"
      },
      {
        href: "/settings",
        label: "Settings",
        description: "Organization, team, subscription, and preferences"
      },
      {
        href: "/master-admin/flags",
        label: "Feature Flags",
        description: "Public flags and provider credential presence"
      }
    ]
  },
  {
    id: "customers",
    label: "Customers",
    purpose: "Reach every customer entity",
    items: [
      {
        href: "/master-admin/impersonation",
        label: "Organizations & People",
        description: "Directory, search, and impersonation entry"
      },
      {
        href: "/setup",
        label: "Organization Setup",
        description: "Resume or guide org setup wizard"
      },
      {
        href: "/migration",
        label: "Import / Migration",
        description: "Portfolio import from other software"
      },
      {
        href: "/settings/team",
        label: "Invite Team",
        description: "Invite property managers and staff"
      }
    ]
  },
  {
    id: "operations",
    label: "Operations",
    purpose: "Day-to-day product surfaces",
    items: [
      { href: "/dashboard", label: "Dashboard", description: "Property manager Operations Center" },
      { href: "/properties", label: "Properties", description: "Portfolio and facility entry" },
      { href: "/tenants", label: "Residents", description: "Resident and tenant records" },
      { href: "/maintenance", label: "Maintenance", description: "Work orders and vendor flow" },
      { href: "/communications", label: "Messages", description: "Inbox and announcements" },
      { href: "/financials", label: "Financials", description: "Charges, payments, statements" },
      { href: "/ai-operations", label: "AI Operations", description: "AI workspace" }
    ]
  },
  {
    id: "support",
    label: "Support",
    purpose: "Reproduce, assist, emergency access",
    items: [
      {
        href: "/master-admin/impersonation",
        label: "Impersonation Center",
        description: "Act as any user with audit trail"
      },
      {
        href: "/master-admin/recovery",
        label: "Auth Recovery",
        description: "Org Admin recovery, ownership restore, escalations"
      },
      {
        href: "/portal",
        label: "Portal Testing",
        description: "Enter Resident, Vendor, Owner, Manager portals"
      },
      {
        href: "/master-admin/testing",
        label: "Seed Demo Data",
        description: "Seed or reset demo portfolio for demos"
      },
      {
        href: "/portal/certification",
        label: "Certification",
        description: "Portal certification surface"
      }
    ]
  },
  {
    id: "sales",
    label: "Sales",
    purpose: "Design Partners, demos, growth",
    items: [
      {
        href: "/master-admin/commercial",
        label: "Commercial Pipeline",
        description: "COM-001 opportunities and activation handoff"
      },
      {
        href: "/master-admin/testing",
        label: "Demo Mode",
        description: "Seed data and prepare demo walks"
      },
      {
        href: "/portal",
        label: "Launch Demo Portals",
        description: "Walk any portal role for demos"
      },
      {
        href: "/migration",
        label: "Design Partner Import",
        description: "Guided migration for new partners"
      }
    ]
  },
  {
    id: "development",
    label: "Development",
    purpose: "Build, certify, configure",
    items: [
      {
        href: "/master-admin/flags",
        label: "Feature Flags",
        description: "Env flags and credential presence"
      },
      {
        href: "/master-admin/testing",
        label: "Testing Utilities",
        description: "Seed and reset utilities"
      },
      {
        href: "/settings/integrations",
        label: "Providers Settings",
        description: "Org provider status"
      },
      {
        href: "/settings/preferences",
        label: "Email & Push",
        description: "Notification preferences"
      }
    ]
  },
  {
    id: "analytics",
    label: "Analytics",
    purpose: "Live business and platform signals",
    items: [
      {
        href: "/dashboard",
        label: "Operations Metrics",
        description: "Occupancy, tasks, maintenance snapshot"
      },
      {
        href: "/financials",
        label: "Financial Metrics",
        description: "Rent, balances, statements"
      },
      {
        href: "/migration",
        label: "Migration Metrics",
        description: "Import progress and review queues"
      },
      {
        href: "/master-admin/health",
        label: "Data Health",
        description: "Table count health for active org"
      }
    ]
  }
];

export const QUICK_ACTIONS = [
  { href: "/setup", label: "New Organization" },
  { href: "/migration/new", label: "Launch Migration" },
  { href: "/master-admin/impersonation", label: "Impersonate User" },
  { href: "/portal", label: "Open Any Portal" },
  { href: "/settings/team", label: "Invite Team" },
  { href: "/settings/preferences", label: "Preferences" },
  { href: "/master-admin/testing", label: "Launch Demo" },
  { href: "/communications/new", label: "Send Announcement" },
  { href: "/settings/integrations", label: "View Providers" },
  { href: "/master-admin/notifications", label: "Push Diagnostics" },
  { href: "/master-admin/health", label: "Platform Health" }
] as const;

const MASTER_ADMIN_ONLY_HIDDEN_QUICK_ACTIONS = new Set(["/communications/new"]);

export function getMissionControlWorkspaces(masterAdminOnlyShell = false): WorkspaceDefinition[] {
  if (!masterAdminOnlyShell) return MASTER_ADMIN_WORKSPACES;
  return MASTER_ADMIN_WORKSPACES.filter(
    (workspace) => !MASTER_ADMIN_ONLY_HIDDEN_WORKSPACES.has(workspace.id)
  ).map((workspace) => {
    if (workspace.id !== "analytics") return workspace;
    return {
      ...workspace,
      items: workspace.items.filter(
        (item) => item.href !== "/dashboard" && item.href !== "/financials"
      )
    };
  });
}

export function getMissionControlQuickActions(masterAdminOnlyShell = false) {
  if (!masterAdminOnlyShell) return [...QUICK_ACTIONS];
  return QUICK_ACTIONS.filter((action) => !MASTER_ADMIN_ONLY_HIDDEN_QUICK_ACTIONS.has(action.href));
}
