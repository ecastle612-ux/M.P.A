import type { PermissionCapability } from "@mpa/shared";

export type NavigationItem = {
  href: string;
  label: string;
  requiredCapability?: PermissionCapability;
  /**
   * BILL-001 Phase C — plan module key (e.g. property_operations, facility_operations, leasing).
   * When entitledModules is provided to nav helpers, items without the module are hidden.
   */
  requiredModule?: string;
  /** When true, only exact pathname matches are active (no prefix match). */
  exact?: boolean;
  /** Mobile accordion section (UX-008 / UX-016 Slice C). */
  mobileSection?: MobileNavSectionId;
  /** Always show near top of mobile drawer when permitted. */
  pinned?: boolean;
  /** Search synonyms for Search M.P.A. / Command Center. */
  synonyms?: string[];
  /** Optional badge source key for mobile nav counts. */
  badgeKey?: MobileNavBadgeKey;
};

export type MobileNavSectionId =
  | "my-work"
  | "operations"
  | "financial"
  | "documents"
  | "communication"
  | "analytics"
  | "administration"
  | "master-admin";

export type MobileNavBadgeKey = "messages" | "maintenance" | "approvals" | "leases" | "notifications";

export const NAVIGATION_PERMISSIONS: Record<string, string> = {
  "/migration": "migration:read",
  "/master-admin": "master_admin"
};

export type NavigationGroup = {
  title: string;
  items: NavigationItem[];
};

/** UX-016 Slice C — mobile drawer accordion order mirrors universal sidebar groups. */
export const MOBILE_NAV_SECTION_ORDER: Array<{ id: MobileNavSectionId; title: string }> = [
  { id: "my-work", title: "My Work" },
  { id: "operations", title: "Operations" },
  { id: "financial", title: "Financial" },
  { id: "documents", title: "Documents" },
  { id: "communication", title: "Communication" },
  { id: "analytics", title: "Analytics" },
  { id: "administration", title: "Administration" },
  { id: "master-admin", title: "Operations Center" }
];

export const MOBILE_NAV_EXPANDED_SECTION_KEY = "mpa.mobileNav.expandedSection";

/**
 * UX-016 Slice C — Intelligent Workspace Navigation.
 * Same destinations / entitlement fields; regrouped for work-first IA.
 */
export const SHELL_NAVIGATION_GROUPS: NavigationGroup[] = [
  {
    title: "Dashboard",
    items: [
      {
        href: "/dashboard",
        label: "Dashboard",
        pinned: true,
        mobileSection: "my-work",
        synonyms: ["dashboard", "ops", "today", "home", "operations", "operations center", "command center"]
      }
    ]
  },
  {
    title: "My Work",
    items: [
      {
        href: "/inbox",
        label: "Assigned Today",
        pinned: true,
        mobileSection: "my-work",
        synonyms: ["assigned today", "my work", "unified inbox", "ops inbox", "work"]
      },
      {
        href: "/inbox",
        label: "Waiting on Me",
        exact: true,
        mobileSection: "my-work",
        synonyms: ["waiting on me", "approvals", "blocked", "needs me"]
      },
      {
        href: "/maintenance",
        label: "High Priority",
        mobileSection: "my-work",
        badgeKey: "maintenance",
        requiredModule: "maintenance",
        synonyms: ["high priority", "urgent", "emergency work orders"]
      },
      {
        href: "/facility/calendar",
        label: "Scheduled Today",
        mobileSection: "my-work",
        requiredCapability: "facility:calendar:read",
        requiredModule: "facility_operations",
        synonyms: ["scheduled today", "calendar", "today schedule"]
      },
      {
        href: "/activity",
        label: "Completed Today",
        mobileSection: "my-work",
        synonyms: ["completed today", "done", "finished", "timeline"]
      }
    ]
  },
  {
    title: "Operations",
    items: [
      {
        href: "/properties",
        label: "Property Operations",
        pinned: true,
        mobileSection: "operations",
        requiredModule: "property_operations",
        synonyms: ["property", "properties", "buildings", "portfolio", "property operations"]
      },
      {
        href: "/units",
        label: "Units",
        mobileSection: "operations",
        requiredModule: "property_operations",
        synonyms: ["unit", "apartment", "apt"]
      },
      {
        href: "/maintenance",
        label: "Maintenance",
        pinned: true,
        mobileSection: "operations",
        badgeKey: "maintenance",
        requiredModule: "maintenance",
        synonyms: ["work order", "work orders", "repair", "ticket"]
      },
      {
        href: "/maintenance",
        label: "Work Orders",
        exact: true,
        mobileSection: "operations",
        requiredModule: "maintenance",
        synonyms: ["work orders", "tickets"]
      },
      {
        href: "/leases",
        label: "Leasing",
        mobileSection: "operations",
        badgeKey: "leases",
        requiredModule: "leasing",
        synonyms: ["lease", "leasing", "renewal", "contract"]
      },
      {
        href: "/applicants",
        label: "Applicants",
        mobileSection: "operations",
        requiredModule: "screening",
        synonyms: ["applicant", "application", "screening"]
      },
      {
        href: "/tenants",
        label: "Residents",
        mobileSection: "operations",
        requiredModule: "property_operations",
        synonyms: ["resident", "residents", "tenant", "renter"]
      },
      {
        href: "/residents/move-in",
        label: "Move in",
        mobileSection: "operations",
        requiredModule: "leasing",
        synonyms: ["move-in", "move in"]
      },
      {
        href: "/residents/move-out",
        label: "Move out",
        mobileSection: "operations",
        requiredModule: "leasing",
        synonyms: ["move-out", "move out"]
      },
      {
        href: "/residents/transfer",
        label: "Transfer unit",
        mobileSection: "operations",
        requiredModule: "leasing",
        synonyms: ["transfer"]
      },
      {
        href: "/residents/bulk",
        label: "Bulk residents",
        mobileSection: "operations",
        requiredModule: "leasing",
        synonyms: ["bulk"]
      },
      {
        href: "/vendors",
        label: "Vendors",
        mobileSection: "operations",
        requiredModule: "maintenance",
        synonyms: ["vendor", "vendor jobs", "contractor"]
      },
      {
        href: "/facility/inspections",
        label: "Inspections",
        mobileSection: "operations",
        requiredCapability: "facility:inspection:read",
        requiredModule: "facility_operations",
        synonyms: ["inspection", "inspections", "checklist", "walkthrough"]
      },
      {
        href: "/facility",
        label: "Facility",
        exact: true,
        mobileSection: "operations",
        requiredCapability: "facility:dashboard",
        requiredModule: "facility_operations",
        synonyms: ["facility", "technician", "facility hub", "ops floor"]
      },
      {
        href: "/facility/inventory",
        label: "Inventory",
        mobileSection: "operations",
        requiredCapability: "facility:inventory:read",
        requiredModule: "facility_operations",
        synonyms: ["inventory", "parts", "tools", "equipment stock"]
      },
      {
        href: "/facility/pm",
        label: "Preventive",
        mobileSection: "operations",
        requiredCapability: "facility:pm:read",
        requiredModule: "facility_operations",
        synonyms: ["pm", "preventive", "preventive maintenance", "schedule"]
      },
      {
        href: "/facility/calendar",
        label: "Calendar",
        mobileSection: "operations",
        requiredCapability: "facility:calendar:read",
        requiredModule: "facility_operations",
        synonyms: ["calendar", "due", "schedule board"]
      },
      {
        href: "/facility/reports",
        label: "Facility reports",
        mobileSection: "operations",
        requiredCapability: "facility:report:read",
        requiredModule: "facility_operations",
        synonyms: ["facility reports", "technician report", "inventory report", "asset register"]
      }
    ]
  },
  {
    title: "Financial",
    items: [
      {
        href: "/financials",
        label: "Accounting",
        mobileSection: "financial",
        requiredModule: "financials",
        synonyms: ["payment", "payments", "rent", "financials", "accounting", "books"]
      },
      {
        href: "/financials/charges",
        label: "Invoices",
        mobileSection: "financial",
        requiredModule: "financials",
        synonyms: ["invoices", "charges", "bill"]
      },
      {
        href: "/financials/payments",
        label: "Payments",
        mobileSection: "financial",
        requiredModule: "financials",
        synonyms: ["payments", "receive payment", "collect rent"]
      },
      {
        href: "/financials/expenses",
        label: "Expenses",
        mobileSection: "financial",
        requiredModule: "financials",
        synonyms: ["expenses", "spend", "payables"]
      },
      {
        href: "/financials/owner-statements",
        label: "Budgets",
        mobileSection: "financial",
        requiredModule: "financials",
        synonyms: ["budgets", "owner statements", "statements"]
      },
      {
        href: "/financials/reports",
        label: "Reports",
        mobileSection: "financial",
        requiredCapability: "financial:read",
        requiredModule: "financials",
        synonyms: ["report", "reports", "analytics", "financial reports"]
      }
    ]
  },
  {
    title: "Documents",
    items: [
      {
        href: "/settings/documents",
        label: "Document Vault",
        mobileSection: "documents",
        synonyms: ["documents", "vault", "files", "uploads"]
      },
      {
        href: "/leases",
        label: "Leases",
        mobileSection: "documents",
        badgeKey: "leases",
        requiredModule: "leasing",
        synonyms: ["lease documents", "lease files"]
      },
      {
        href: "/applicants",
        label: "Templates",
        mobileSection: "documents",
        requiredModule: "screening",
        synonyms: ["templates", "application templates"]
      },
      {
        href: "/leases",
        label: "Signatures",
        exact: true,
        mobileSection: "documents",
        requiredModule: "leasing",
        synonyms: ["signatures", "esign", "sign"]
      },
      {
        href: "/settings/documents",
        label: "Uploads",
        exact: true,
        mobileSection: "documents",
        synonyms: ["upload", "uploads", "add document"]
      }
    ]
  },
  {
    title: "Communication",
    items: [
      {
        href: "/communications/inbox",
        label: "Messages",
        pinned: true,
        mobileSection: "communication",
        badgeKey: "messages",
        requiredModule: "messaging",
        synonyms: ["messages", "message", "inbox", "chat"]
      },
      {
        href: "/communications",
        label: "Announcements",
        mobileSection: "communication",
        requiredModule: "messaging",
        synonyms: ["announce", "announcement", "broadcast"]
      },
      {
        href: "/activity",
        label: "Activity",
        mobileSection: "communication",
        synonyms: ["timeline", "activity timeline", "ops activity"]
      },
      {
        href: "/settings/notifications",
        label: "Notifications",
        mobileSection: "communication",
        badgeKey: "notifications",
        synonyms: ["notification settings", "alerts", "push"]
      }
    ]
  },
  {
    title: "Analytics",
    items: [
      {
        href: "/dashboard",
        label: "KPIs",
        exact: true,
        mobileSection: "analytics",
        synonyms: ["kpi", "kpis", "metrics", "pulse"]
      },
      {
        href: "/financials/reports",
        label: "Reports",
        mobileSection: "analytics",
        requiredCapability: "financial:read",
        requiredModule: "financials",
        synonyms: ["performance reports", "analytics reports"]
      },
      {
        href: "/financials/reports",
        label: "Forecasts",
        exact: true,
        mobileSection: "analytics",
        requiredCapability: "financial:read",
        requiredModule: "financials",
        synonyms: ["forecasts", "projection"]
      },
      {
        href: "/properties",
        label: "Occupancy",
        exact: true,
        mobileSection: "analytics",
        requiredModule: "property_operations",
        synonyms: ["occupancy", "vacancy"]
      },
      {
        href: "/ai-operations",
        label: "Performance",
        mobileSection: "analytics",
        requiredModule: "ai_copilot",
        synonyms: ["performance", "ai", "assistant", "intelligence"]
      }
    ]
  },
  {
    title: "Administration",
    items: [
      {
        href: "/settings/team",
        label: "Users",
        mobileSection: "administration",
        synonyms: ["users", "team", "invite user", "members"]
      },
      {
        href: "/settings/organization",
        label: "Organizations",
        mobileSection: "administration",
        synonyms: ["organization", "org settings"]
      },
      {
        href: "/settings/billing",
        label: "Billing",
        mobileSection: "administration",
        synonyms: ["billing", "subscription", "plan"]
      },
      {
        href: "/settings",
        label: "Settings",
        mobileSection: "administration",
        synonyms: ["settings", "preferences"]
      },
      {
        href: "/settings/integrations",
        label: "Integrations",
        mobileSection: "administration",
        synonyms: ["integrations", "providers", "connections"]
      },
      {
        href: "/master-admin/flags",
        label: "Feature Flags",
        requiredCapability: "master_admin",
        mobileSection: "master-admin",
        synonyms: ["feature flags", "flags"]
      },
      {
        href: "/migration",
        label: "Migration Center",
        requiredCapability: "migration:read",
        mobileSection: "administration",
        synonyms: ["migration", "import"]
      },
      {
        href: "/profile",
        label: "Profile",
        mobileSection: "administration",
        synonyms: ["profile", "account"]
      },
      {
        href: "/portal",
        label: "Portals",
        mobileSection: "administration",
        synonyms: ["portal", "portals"]
      },
      {
        href: "/master-admin",
        label: "Mission Control",
        requiredCapability: "master_admin",
        exact: true,
        mobileSection: "master-admin",
        synonyms: ["master admin", "admin", "mission control", "hq"]
      },
      {
        href: "/master-admin/impersonation",
        label: "Impersonation Center",
        requiredCapability: "master_admin",
        mobileSection: "master-admin",
        synonyms: ["impersonate", "act as", "support mode", "view as"]
      },
      {
        href: "/master-admin/testing",
        label: "Demo & Testing",
        requiredCapability: "master_admin",
        mobileSection: "master-admin"
      },
      {
        href: "/master-admin/health",
        label: "Platform Health",
        requiredCapability: "master_admin",
        mobileSection: "master-admin"
      },
      {
        href: "/master-admin/dashboards",
        label: "Surface Switcher",
        requiredCapability: "master_admin",
        mobileSection: "master-admin"
      }
    ]
  }
];

/**
 * Sidebar for Master Admin–only operators (no PM portfolio capabilities).
 * Mirrors Mission Control workspaces — no property-manager tabs.
 */
export const MASTER_ADMIN_ONLY_NAVIGATION_GROUPS: NavigationGroup[] = [
  {
    title: "Dashboard",
    items: [
      {
        href: "/master-admin",
        label: "Mission Control",
        requiredCapability: "master_admin",
        exact: true,
        pinned: true,
        mobileSection: "master-admin",
        synonyms: ["master admin", "admin", "operations center", "hq", "home", "dashboard"]
      }
    ]
  },
  {
    title: "My Work",
    items: [
      {
        href: "/master-admin/impersonation",
        label: "Waiting on Me",
        requiredCapability: "master_admin",
        mobileSection: "master-admin",
        synonyms: ["customers", "directory", "impersonate", "waiting"]
      },
      {
        href: "/master-admin/recovery",
        label: "High Priority",
        requiredCapability: "master_admin",
        mobileSection: "master-admin",
        synonyms: ["recovery", "support", "escalations"]
      },
      {
        href: "/master-admin/commercial",
        label: "Assigned Today",
        requiredCapability: "master_admin",
        mobileSection: "master-admin",
        synonyms: ["commercial", "pipeline", "customer success"]
      }
    ]
  },
  {
    title: "Administration",
    items: [
      {
        href: "/master-admin/health",
        label: "Platform Health",
        requiredCapability: "master_admin",
        mobileSection: "master-admin"
      },
      {
        href: "/settings/integrations",
        label: "Integrations",
        requiredCapability: "master_admin",
        mobileSection: "master-admin"
      },
      {
        href: "/master-admin/flags",
        label: "Feature Flags",
        requiredCapability: "master_admin",
        mobileSection: "master-admin"
      },
      {
        href: "/settings/team",
        label: "Users",
        requiredCapability: "master_admin",
        mobileSection: "master-admin"
      },
      {
        href: "/master-admin/impersonation",
        label: "Organizations",
        requiredCapability: "master_admin",
        mobileSection: "master-admin",
        synonyms: ["organizations", "people"]
      },
      {
        href: "/settings/billing",
        label: "Billing",
        requiredCapability: "master_admin",
        mobileSection: "master-admin"
      },
      {
        href: "/settings",
        label: "Settings",
        requiredCapability: "master_admin",
        mobileSection: "master-admin",
        synonyms: ["settings", "preferences", "appearance", "theme", "dark mode", "light mode"]
      },
      {
        href: "/settings/preferences",
        label: "Preferences",
        requiredCapability: "master_admin",
        mobileSection: "master-admin"
      },
      {
        href: "/migration",
        label: "Import / Migration",
        requiredCapability: "master_admin",
        mobileSection: "master-admin",
        synonyms: ["import", "onboarding"]
      },
      {
        href: "/portal",
        label: "Portal Testing",
        requiredCapability: "master_admin",
        mobileSection: "master-admin",
        synonyms: ["portals", "emergency"]
      },
      {
        href: "/master-admin/testing",
        label: "Demo & Seed",
        requiredCapability: "master_admin",
        mobileSection: "master-admin"
      },
      {
        href: "/master-admin/dashboards",
        label: "Surface Switcher",
        requiredCapability: "master_admin",
        mobileSection: "master-admin"
      },
      {
        href: "/profile",
        label: "Profile",
        requiredCapability: "master_admin",
        mobileSection: "master-admin"
      }
    ]
  }
];

export const MOBILE_QUICK_CREATE_ACTIONS = [
  { label: "Work Order", href: "/maintenance/new", synonyms: ["new work order", "create work order"] },
  { label: "Lease", href: "/leases", synonyms: ["new lease", "create lease"] },
  { label: "Resident", href: "/tenants/new", synonyms: ["add tenant", "add resident", "new resident"] },
  { label: "Document", href: "/settings/documents", synonyms: ["upload document", "document vault"] },
  { label: "Invite User", href: "/settings/team", synonyms: ["invite user", "invite teammate"] },
  { label: "Property", href: "/properties/new", synonyms: ["add property", "new property"] }
] as const;

/** Master Admin without PM portfolio permissions — hide property-manager chrome. */
export function isMasterAdminOnlyPermissions(permissions: readonly string[]): boolean {
  if (!permissions.includes("master_admin")) return false;
  const pmSignals = ["property:read", "dashboard:read", "unit:read", "tenant:read", "lease:read"] as const;
  return !pmSignals.some((capability) => permissions.includes(capability));
}

export function getShellNavigationGroups(
  permissions: readonly string[],
  options?: { masterAdminOnlyShell?: boolean; entitledModules?: readonly string[] | null }
): NavigationGroup[] {
  if (options?.masterAdminOnlyShell || isMasterAdminOnlyPermissions(permissions)) {
    return MASTER_ADMIN_ONLY_NAVIGATION_GROUPS;
  }
  // Avoid flashing Properties/Units/Tenants before session permissions resolve.
  if (permissions.length === 0) {
    return [];
  }
  const modules = options?.entitledModules;
  if (modules == null || modules.length === 0) {
    return SHELL_NAVIGATION_GROUPS;
  }
  const moduleSet = new Set(modules);
  return SHELL_NAVIGATION_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.requiredModule || moduleSet.has(item.requiredModule))
  })).filter((group) => group.items.length > 0);
}

export function flattenShellNavigationItems(
  permissions: readonly string[] = [],
  options?: { masterAdminOnlyShell?: boolean; entitledModules?: readonly string[] | null }
): NavigationItem[] {
  return getShellNavigationGroups(permissions, options).flatMap((group) => group.items);
}

export function shellHomeHref(
  permissions: readonly string[],
  options?: { masterAdminOnlyShell?: boolean }
): string {
  if (options?.masterAdminOnlyShell || isMasterAdminOnlyPermissions(permissions)) {
    return "/master-admin";
  }
  return "/dashboard";
}

export function isRouteActive(pathname: string, href: string, exact = false): boolean {
  if (href === "/" || exact) {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function navItemFavoriteKey(href: string): string {
  return `nav:${href}`;
}

export function matchesNavSearch(item: NavigationItem, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return false;
  const haystack = [item.label, item.href, ...(item.synonyms ?? [])].join(" ").toLowerCase();
  return haystack.includes(normalized) || normalized.split(/\s+/).every((token) => haystack.includes(token));
}

export function findMobileSectionForPath(
  pathname: string,
  permissions: readonly string[] = [],
  options?: { masterAdminOnlyShell?: boolean }
): MobileNavSectionId | null {
  const items = flattenShellNavigationItems(permissions, options);
  const match = items.find((item) => item.mobileSection && isRouteActive(pathname, item.href, item.exact));
  return match?.mobileSection ?? null;
}

/** Universal group titles for Slice C structure tests / docs alignment. */
export const UNIVERSAL_SIDEBAR_GROUP_ORDER = [
  "Dashboard",
  "My Work",
  "Operations",
  "Financial",
  "Documents",
  "Communication",
  "Analytics",
  "Administration"
] as const;
