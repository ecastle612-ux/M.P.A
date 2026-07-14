export type NavigationItem = {
  href: string;
  label: string;
};

export type NavigationGroup = {
  title: string;
  items: NavigationItem[];
};

export const SHELL_NAVIGATION_GROUPS: NavigationGroup[] = [
  {
    title: "Operations",
    items: [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/properties", label: "Properties" },
      { href: "/units", label: "Units" },
      { href: "/tenants", label: "Tenants" }
    ]
  },
  {
    title: "Workspace",
    items: [
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
