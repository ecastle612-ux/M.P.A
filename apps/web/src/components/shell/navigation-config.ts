import type { PermissionCapability } from "@mpa/shared";

export type NavigationItem = {
  href: string;
  label: string;
  requiredCapability?: PermissionCapability;
};

export const NAVIGATION_PERMISSIONS: Record<string, string> = {
  "/migration": "migration:read"
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
      { href: "/leases", label: "Leases" },
      { href: "/maintenance", label: "Maintenance" },
      { href: "/vendors", label: "Vendors" },
      { href: "/communications", label: "Communications" },
      { href: "/communications/inbox", label: "Inbox" },
      { href: "/financials", label: "Financials" },
      { href: "/ai-operations", label: "AI Operations" }
    ]
  },
  {
    title: "Workspace",
    items: [
      { href: "/migration", label: "Migration Center", requiredCapability: "migration:read" },
      { href: "/profile", label: "Profile" },
      { href: "/portal", label: "Portals" }
    ]
  }
];

export function isRouteActive(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
