import type { PermissionCapability } from "@mpa/shared";

export type NavigationItem = {
  href: string;
  label: string;
  requiredCapability?: PermissionCapability;
  /** When true, only exact pathname matches are active (no prefix match). */
  exact?: boolean;
};

export const NAVIGATION_PERMISSIONS: Record<string, string> = {
  "/migration": "migration:read",
  "/master-admin": "master_admin"
};

export type NavigationGroup = {
  title: string;
  items: NavigationItem[];
};

export const SHELL_NAVIGATION_GROUPS: NavigationGroup[] = [
  {
    title: "Operations",
    items: [
      { href: "/dashboard", label: "Operations Center" },
      { href: "/properties", label: "Properties" },
      { href: "/units", label: "Units" },
      { href: "/applicants", label: "Applicants" },
      { href: "/tenants", label: "Tenants" },
      { href: "/residents/move-in", label: "Move in" },
      { href: "/residents/move-out", label: "Move out" },
      { href: "/residents/transfer", label: "Transfer unit" },
      { href: "/residents/bulk", label: "Bulk residents" },
      { href: "/leases", label: "Leases" },
      { href: "/maintenance", label: "Maintenance" },
      { href: "/vendors", label: "Vendors" },
      { href: "/communications", label: "Communications" },
      { href: "/communications/inbox", label: "Inbox" },
      { href: "/financials", label: "Accounting" },
      { href: "/ai-operations", label: "AI Operations" }
    ]
  },
  {
    title: "Workspace",
    items: [
      { href: "/migration", label: "Migration Center", requiredCapability: "migration:read" },
      { href: "/settings", label: "Settings" },
      { href: "/profile", label: "Profile" },
      { href: "/portal", label: "Portals" }
    ]
  },
  {
    title: "Master Admin",
    items: [
      {
        href: "/master-admin",
        label: "Master Admin",
        requiredCapability: "master_admin",
        exact: true
      },
      {
        href: "/master-admin/dashboards",
        label: "Dashboard Switcher",
        requiredCapability: "master_admin"
      },
      {
        href: "/master-admin/providers",
        label: "Provider Status",
        requiredCapability: "master_admin"
      },
      {
        href: "/master-admin/testing",
        label: "Testing Utilities",
        requiredCapability: "master_admin"
      },
      { href: "/master-admin/health", label: "System Health", requiredCapability: "master_admin" },
      { href: "/master-admin/flags", label: "Feature Flags", requiredCapability: "master_admin" }
    ]
  }
];

export function isRouteActive(pathname: string, href: string, exact = false): boolean {
  if (href === "/" || exact) {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
