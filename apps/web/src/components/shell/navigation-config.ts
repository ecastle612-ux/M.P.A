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
  /** Search synonyms for Search M.P.A. / future module index. */
  synonyms?: string[];
  /** Optional badge source key for mobile nav counts. */
  badgeKey?: MobileNavBadgeKey;
};

/** UX-016 Slice C — workflow-aligned mobile accordion sections. */
export type MobileNavSectionId =
  | "dashboard"
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
  /** When true, group starts expanded and is not user-collapsible (Dashboard). */
  alwaysExpanded?: boolean;
};

export const MOBILE_NAV_SECTION_ORDER: Array<{ id: MobileNavSectionId; title: string }> = [
  { id: "dashboard", title: "Dashboard" },
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
export const SIDEBAR_EXPANDED_GROUPS_KEY = "mpa.sidebar.expandedGroups.v1";

/**
 * UX-016 Slice C — workflow navigation hierarchy.
 * Groups represent real work, not modules or database tables.
 * Destinations remain existing entitled hrefs only.
 */
export const SHELL_NAVIGATION_GROUPS: NavigationGroup[] = [
  {
    title: "Dashboard",
    alwaysExpanded: true,
    items: [
      {
        href: "/dashboard",
        label: "Dashboard",
        pinned: true,
        exact: true,
        mobileSection: "dashboard",
        synonyms: ["dashboard", "ops", "today", "home", "operations", "operations center", "command center"]
      }
    ]
  },
  {
    title: "My Work",
    items: [
      {
        href: "/inbox",
        label: "Waiting on me",
        pinned: true,
        mobileSection: "my-work",
        synonyms: ["unified inbox", "ops inbox", "operational inbox", "notifications inbox", "waiting", "approvals"]
      },
      {
        href: "/maintenance",
        label: "Work orders",
        pinned: true,
        mobileSection: "my-work",
        badgeKey: "maintenance",
        requiredModule: "maintenance",
        synonyms: ["work order", "work orders", "repair", "ticket", "today's jobs", "assigned tasks", "maintenance"]
      },
      {
        href: "/facility",
        label: "Facility floor",
        exact: true,
        pinned: true,
        mobileSection: "my-work",
        requiredCapability: "facility:dashboard",
        requiredModule: "facility_operations",
        synonyms: ["facility", "technician", "facility hub", "ops floor", "today's jobs"]
      },
      {
        href: "/facility/inspections",
        label: "Inspections",
        mobileSection: "my-work",
        requiredCapability: "facility:inspection:read",
        requiredModule: "facility_operations",
        synonyms: ["inspection", "inspections", "checklist", "walkthrough"]
      },
      {
        href: "/facility/calendar",
        label: "Schedule",
        mobileSection: "my-work",
        requiredCapability: "facility:calendar:read",
        requiredModule: "facility_operations",
        synonyms: ["calendar", "due", "schedule board", "urgent"]
      },
      {
        href: "/activity",
        label: "Activity",
        mobileSection: "my-work",
        synonyms: ["timeline", "activity timeline", "ops activity", "completed today"]
      }
    ]
  },
  {
    title: "Operations",
    items: [
      {
        href: "/properties",
        label: "Properties",
        pinned: true,
        mobileSection: "operations",
        requiredModule: "property_operations",
        synonyms: ["property", "buildings", "portfolio"]
      },
      {
        href: "/units",
        label: "Units",
        mobileSection: "operations",
        requiredModule: "property_operations",
        synonyms: ["unit", "apartment", "apt"]
      },
      {
        href: "/tenants",
        label: "Residents",
        mobileSection: "operations",
        requiredModule: "property_operations",
        synonyms: ["resident", "residents", "tenant", "renter"]
      },
      {
        href: "/applicants",
        label: "Applicants",
        mobileSection: "operations",
        requiredModule: "screening",
        synonyms: ["applicant", "application", "screening"]
      },
      {
        href: "/leases",
        label: "Leases",
        mobileSection: "operations",
        badgeKey: "leases",
        requiredModule: "leasing",
        synonyms: ["lease", "leasing", "renewal", "contract"]
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
      }
    ]
  },
  {
    title: "Financial",
    items: [
      {
        href: "/financials",
        label: "Accounting",
        exact: true,
        mobileSection: "financial",
        requiredModule: "financials",
        synonyms: ["payment", "payments", "rent", "financials", "accounting", "books", "invoices", "expenses"]
      }
    ]
  },
  {
    title: "Documents",
    items: [
      {
        href: "/settings/documents",
        label: "Documents",
        mobileSection: "documents",
        synonyms: ["files", "vault", "templates", "signatures", "document"]
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
        exact: true,
        mobileSection: "communication",
        requiredModule: "messaging",
        synonyms: ["announce", "announcement", "broadcast", "communications"]
      }
    ]
  },
  {
    title: "Analytics",
    items: [
      {
        href: "/financials/reports",
        label: "Reports",
        mobileSection: "analytics",
        requiredCapability: "financial:read",
        requiredModule: "financials",
        synonyms: ["report", "reports", "analytics", "insights", "forecasts"]
      },
      {
        href: "/facility/reports",
        label: "Facility reports",
        mobileSection: "analytics",
        requiredCapability: "facility:report:read",
        requiredModule: "facility_operations",
        synonyms: ["facility reports", "technician report", "inventory report", "asset register"]
      },
      {
        href: "/ai-operations",
        label: "AI insights",
        mobileSection: "analytics",
        requiredModule: "ai_copilot",
        synonyms: ["ai", "assistant", "intelligence", "insights", "ai operations"]
      }
    ]
  },
  {
    title: "Administration",
    items: [
      {
        href: "/settings",
        label: "Settings",
        mobileSection: "administration",
        synonyms: ["settings", "preferences", "billing", "integrations", "users", "roles"]
      },
      {
        href: "/profile",
        label: "Profile",
        mobileSection: "administration",
        synonyms: ["profile", "account"]
      },
      {
        href: "/migration",
        label: "Migration Center",
        requiredCapability: "migration:read",
        mobileSection: "administration",
        synonyms: ["migration", "import"]
      },
      {
        href: "/portal",
        label: "Portals",
        mobileSection: "administration",
        synonyms: ["portal", "portals"]
      }
    ]
  },
  {
    title: "Master Admin",
    items: [
      {
        href: "/master-admin",
        label: "Operations Center",
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
        synonyms: ["impersonate", "act as", "support mode"]
      },
      {
        href: "/settings/integrations",
        label: "Providers",
        requiredCapability: "master_admin",
        mobileSection: "master-admin"
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
        href: "/master-admin/flags",
        label: "Feature Flags",
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
    title: "Mission Control",
    alwaysExpanded: true,
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
    title: "Platform",
    items: [
      {
        href: "/master-admin/health",
        label: "Platform Health",
        requiredCapability: "master_admin",
        mobileSection: "master-admin"
      },
      {
        href: "/settings/integrations",
        label: "Providers",
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
        href: "/settings/preferences",
        label: "Preferences",
        requiredCapability: "master_admin",
        mobileSection: "master-admin"
      },
      {
        href: "/settings",
        label: "Settings",
        requiredCapability: "master_admin",
        mobileSection: "master-admin",
        synonyms: ["settings", "preferences", "appearance", "theme", "dark mode", "light mode"]
      }
    ]
  },
  {
    title: "Customers",
    items: [
      {
        href: "/master-admin/impersonation",
        label: "Organizations & People",
        requiredCapability: "master_admin",
        mobileSection: "master-admin",
        synonyms: ["impersonate", "customers", "directory"]
      },
      {
        href: "/migration",
        label: "Import / Migration",
        requiredCapability: "master_admin",
        mobileSection: "master-admin",
        synonyms: ["import", "onboarding"]
      },
      {
        href: "/settings/team",
        label: "Invite Team",
        requiredCapability: "master_admin",
        mobileSection: "master-admin"
      }
    ]
  },
  {
    title: "Support",
    items: [
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
      }
    ]
  }
];

export const MOBILE_QUICK_CREATE_ACTIONS = [
  { label: "Work Order", href: "/maintenance/new", synonyms: ["new work order", "create work order"] },
  { label: "Lease", href: "/leases/new", synonyms: ["new lease", "create lease"] },
  { label: "Resident", href: "/tenants/new", synonyms: ["add tenant", "add resident", "new resident"] },
  { label: "Document", href: "/settings/documents", synonyms: ["upload document", "documents", "files"] },
  { label: "Property", href: "/properties/new", synonyms: ["add property", "new property"] },
  { label: "Announcement", href: "/communications/new", synonyms: ["new announcement", "announce"] }
] as const;

/** Contextual nav when working inside a property (UX-016 Slice C). */
export type PropertyContextNavItem = {
  href: string;
  label: string;
  exact?: boolean;
  requiredCapability?: PermissionCapability;
  requiredModule?: string;
};

export function parsePropertyIdFromPathname(pathname: string): string | null {
  const match = pathname.match(/^\/properties\/([^/]+)(?:\/|$)/);
  if (!match?.[1] || match[1] === "new") return null;
  return match[1];
}

export function parsePropertyIdFromSearch(search: string): string | null {
  const raw = search.startsWith("?") ? search.slice(1) : search;
  const value = new URLSearchParams(raw).get("propertyId");
  return value && value.trim() ? value.trim() : null;
}

export function resolveActivePropertyId(pathname: string, search: string): string | null {
  return parsePropertyIdFromPathname(pathname) ?? parsePropertyIdFromSearch(search);
}

export function buildPropertyContextNav(propertyId: string): PropertyContextNavItem[] {
  const encoded = encodeURIComponent(propertyId);
  return [
    {
      href: `/properties/${propertyId}`,
      label: "Overview",
      exact: true,
      requiredModule: "property_operations"
    },
    {
      href: `/tenants?propertyId=${encoded}`,
      label: "Residents",
      requiredModule: "property_operations"
    },
    {
      href: `/maintenance?propertyId=${encoded}`,
      label: "Maintenance",
      requiredModule: "maintenance"
    },
    {
      href: "/settings/documents",
      label: "Documents"
    },
    {
      href: `/financials/charges?propertyId=${encoded}`,
      label: "Accounting",
      requiredModule: "financials"
    },
    {
      href: `/facility/inspections?propertyId=${encoded}`,
      label: "Inspections",
      requiredCapability: "facility:inspection:read",
      requiredModule: "facility_operations"
    },
    {
      href: "/activity",
      label: "Activity"
    },
    {
      href: `/properties/${propertyId}/edit`,
      label: "Settings",
      requiredModule: "property_operations"
    }
  ];
}

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
  const pathOnly = href.split("?")[0] ?? href;
  if (pathOnly === "/" || exact) {
    return pathname === pathOnly;
  }
  return pathname === pathOnly || pathname.startsWith(`${pathOnly}/`);
}

/** Active matching that respects optional query constraints (property context). */
export function isNavHrefActive(
  pathname: string,
  search: string,
  href: string,
  exact = false
): boolean {
  const [pathOnly = href, query = ""] = href.split("?");
  if (!isRouteActive(pathname, pathOnly, exact)) {
    return false;
  }
  if (!query) {
    // Prefer exact path matches over query-scoped siblings when no query on href.
    if (exact) return pathname === pathOnly;
    return true;
  }
  const required = new URLSearchParams(query);
  const current = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  for (const [key, value] of required.entries()) {
    if (current.get(key) !== value) return false;
  }
  return pathname === pathOnly;
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

export function workflowGroupTitles(): string[] {
  return SHELL_NAVIGATION_GROUPS.map((group) => group.title);
}
