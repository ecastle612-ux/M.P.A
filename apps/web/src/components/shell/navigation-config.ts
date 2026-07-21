import type { PermissionCapability } from "@mpa/shared";

export type NavigationItem = {
  href: string;
  label: string;
  requiredCapability?: PermissionCapability;
  /** When true, only exact pathname matches are active (no prefix match). */
  exact?: boolean;
  /** Mobile accordion section (UX-008). */
  mobileSection?: MobileNavSectionId;
  /** Always show near top of mobile drawer when permitted. */
  pinned?: boolean;
  /** Search synonyms for Search M.P.A. / future module index. */
  synonyms?: string[];
  /** Optional badge source key for mobile nav counts. */
  badgeKey?: MobileNavBadgeKey;
};

export type MobileNavSectionId =
  | "portfolio"
  | "maintenance"
  | "leasing"
  | "accounting"
  | "communications"
  | "intelligence"
  | "workspace"
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

export const MOBILE_NAV_SECTION_ORDER: Array<{ id: MobileNavSectionId; title: string }> = [
  { id: "portfolio", title: "Portfolio" },
  { id: "maintenance", title: "Maintenance" },
  { id: "leasing", title: "Leasing" },
  { id: "accounting", title: "Accounting" },
  { id: "communications", title: "Communications" },
  { id: "intelligence", title: "Intelligence" },
  { id: "workspace", title: "Workspace" },
  { id: "master-admin", title: "Master Admin" }
];

export const MOBILE_NAV_EXPANDED_SECTION_KEY = "mpa.mobileNav.expandedSection";

export const SHELL_NAVIGATION_GROUPS: NavigationGroup[] = [
  {
    title: "Operations",
    items: [
      {
        href: "/dashboard",
        label: "Operations Center",
        pinned: true,
        synonyms: ["dashboard", "ops", "today", "home", "operations"]
      },
      {
        href: "/properties",
        label: "Properties",
        pinned: true,
        mobileSection: "portfolio",
        synonyms: ["property", "buildings", "portfolio"]
      },
      {
        href: "/units",
        label: "Units",
        mobileSection: "portfolio",
        synonyms: ["unit", "apartment", "apt"]
      },
      {
        href: "/applicants",
        label: "Applicants",
        mobileSection: "portfolio",
        synonyms: ["applicant", "application", "screening"]
      },
      {
        href: "/tenants",
        label: "Tenants",
        mobileSection: "portfolio",
        synonyms: ["resident", "residents", "tenant", "renter"]
      },
      {
        href: "/residents/move-in",
        label: "Move in",
        mobileSection: "leasing",
        synonyms: ["move-in", "move in"]
      },
      {
        href: "/residents/move-out",
        label: "Move out",
        mobileSection: "leasing",
        synonyms: ["move-out", "move out"]
      },
      {
        href: "/residents/transfer",
        label: "Transfer unit",
        mobileSection: "leasing",
        synonyms: ["transfer"]
      },
      {
        href: "/residents/bulk",
        label: "Bulk residents",
        mobileSection: "leasing",
        synonyms: ["bulk"]
      },
      {
        href: "/leases",
        label: "Leases",
        mobileSection: "leasing",
        badgeKey: "leases",
        synonyms: ["lease", "leasing", "renewal", "contract"]
      },
      {
        href: "/maintenance",
        label: "Maintenance",
        pinned: true,
        mobileSection: "maintenance",
        badgeKey: "maintenance",
        synonyms: ["work order", "work orders", "repair", "ticket", "inspection"]
      },
      {
        href: "/vendors",
        label: "Vendors",
        mobileSection: "maintenance",
        synonyms: ["vendor", "vendor jobs", "contractor"]
      },
      {
        href: "/communications",
        label: "Communications",
        mobileSection: "communications",
        synonyms: ["announce", "announcement", "broadcast"]
      },
      {
        href: "/communications/inbox",
        label: "Inbox",
        pinned: true,
        mobileSection: "communications",
        badgeKey: "messages",
        synonyms: ["messages", "message", "inbox", "chat"]
      },
      {
        href: "/financials",
        label: "Accounting",
        mobileSection: "accounting",
        synonyms: ["payment", "payments", "rent", "financials", "accounting", "books"]
      },
      {
        href: "/financials/reports",
        label: "Reports",
        mobileSection: "accounting",
        requiredCapability: "financial:read",
        synonyms: ["report", "reports", "analytics"]
      },
      {
        href: "/ai-operations",
        label: "AI Operations",
        mobileSection: "intelligence",
        synonyms: ["ai", "assistant", "intelligence"]
      }
    ]
  },
  {
    title: "Workspace",
    items: [
      {
        href: "/migration",
        label: "Migration Center",
        requiredCapability: "migration:read",
        mobileSection: "workspace",
        synonyms: ["migration", "import"]
      },
      {
        href: "/settings",
        label: "Settings",
        mobileSection: "workspace",
        synonyms: ["settings", "preferences"]
      },
      {
        href: "/profile",
        label: "Profile",
        mobileSection: "workspace",
        synonyms: ["profile", "account"]
      },
      {
        href: "/portal",
        label: "Portals",
        mobileSection: "workspace",
        synonyms: ["portal", "portals"]
      }
    ]
  },
  {
    title: "Master Admin",
    items: [
      {
        href: "/master-admin",
        label: "Master Admin",
        requiredCapability: "master_admin",
        exact: true,
        mobileSection: "master-admin",
        synonyms: ["master admin", "admin"]
      },
      {
        href: "/master-admin/dashboards",
        label: "Dashboard Switcher",
        requiredCapability: "master_admin",
        mobileSection: "master-admin"
      },
      {
        href: "/master-admin/providers",
        label: "Provider Status",
        requiredCapability: "master_admin",
        mobileSection: "master-admin"
      },
      {
        href: "/master-admin/testing",
        label: "Testing Utilities",
        requiredCapability: "master_admin",
        mobileSection: "master-admin"
      },
      {
        href: "/master-admin/impersonation",
        label: "Impersonation Center",
        requiredCapability: "master_admin",
        mobileSection: "master-admin",
        synonyms: ["impersonate", "act as", "support mode"]
      },
      {
        href: "/master-admin/health",
        label: "System Health",
        requiredCapability: "master_admin",
        mobileSection: "master-admin"
      },
      {
        href: "/master-admin/flags",
        label: "Feature Flags",
        requiredCapability: "master_admin",
        mobileSection: "master-admin"
      }
    ]
  }
];

export const MOBILE_QUICK_CREATE_ACTIONS = [
  { label: "Property", href: "/properties/new", synonyms: ["add property", "new property"] },
  { label: "Resident", href: "/tenants/new", synonyms: ["add tenant", "add resident", "new resident"] },
  { label: "Work Order", href: "/maintenance/new", synonyms: ["new work order", "create work order"] },
  { label: "Announcement", href: "/communications/new", synonyms: ["new announcement", "announce"] }
] as const;

export function flattenShellNavigationItems(): NavigationItem[] {
  return SHELL_NAVIGATION_GROUPS.flatMap((group) => group.items);
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

export function findMobileSectionForPath(pathname: string): MobileNavSectionId | null {
  const items = flattenShellNavigationItems();
  const match = items.find((item) => item.mobileSection && isRouteActive(pathname, item.href, item.exact));
  return match?.mobileSection ?? null;
}
