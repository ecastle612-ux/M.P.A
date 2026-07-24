export type PortalNavigationItem = {
  href: string;
  label: string;
};

export const MANAGER_PORTAL_NAVIGATION = [
  { href: "/portal/manager", label: "Manager home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/profile", label: "Profile" }
] as const satisfies readonly PortalNavigationItem[];

/** OWNER-001 — desktop primary nav (approved). */
export const OWNER_PORTAL_NAVIGATION = [
  { href: "/portal/owner", label: "Dashboard" },
  { href: "/portal/owner/properties", label: "Properties" },
  { href: "/portal/owner/financials", label: "Financials" },
  { href: "/portal/owner/documents", label: "Documents" },
  { href: "/portal/owner/messages", label: "Messages" },
  { href: "/portal/owner/reports", label: "Reports" },
  { href: "/portal/owner/settings", label: "Settings" }
] as const satisfies readonly PortalNavigationItem[];

/**
 * OWNER-001 Approve amendment — mobile bottom navigation.
 * "More" surfaces Documents, Reports, and Settings.
 */
export const OWNER_PORTAL_MOBILE_BOTTOM_NAVIGATION = [
  { href: "/portal/owner", label: "Home" },
  { href: "/portal/owner/properties", label: "Properties" },
  { href: "/portal/owner/financials", label: "Financials" },
  { href: "/portal/owner/messages", label: "Messages" },
  { href: "/portal/owner/more", label: "More" }
] as const satisfies readonly PortalNavigationItem[];

/** DPX-003 — primary destinations; secondary live under More. */
export const TENANT_PORTAL_NAVIGATION = [
  { href: "/portal/tenant", label: "Home" },
  { href: "/portal/tenant/messages", label: "Messages" },
  { href: "/portal/tenant/payments", label: "Rent" },
  { href: "/portal/tenant/maintenance", label: "Maintenance" },
  { href: "/portal/tenant/documents", label: "Documents" },
  { href: "/portal/tenant/more", label: "More" }
] as const satisfies readonly PortalNavigationItem[];

/**
 * Tenant P0 — mobile bottom tabs (consumer chrome).
 * Documents / Community remain reachable via Home actions + More / desktop nav.
 */
export const TENANT_PORTAL_MOBILE_BOTTOM_NAVIGATION = [
  { href: "/portal/tenant", label: "Home" },
  { href: "/portal/tenant/payments", label: "Rent" },
  { href: "/portal/tenant/messages", label: "Messages" },
  { href: "/portal/tenant/maintenance", label: "Maintenance" },
  { href: "/portal/tenant/more", label: "More" }
] as const satisfies readonly PortalNavigationItem[];

/** Secondary destinations surfaced on /portal/tenant/more. */
export const TENANT_PORTAL_MORE_NAVIGATION = [
  { href: "/portal/tenant/announcements", label: "Announcements" },
  { href: "/portal/tenant/notifications", label: "Notifications" },
  { href: "/portal/tenant/community", label: "Community" },
  { href: "/portal/tenant/documents", label: "Documents" },
  { href: "/portal/tenant/maintenance/new", label: "New maintenance request" },
  { href: "/portal/tenant/preferences", label: "Preferences" },
  { href: "/profile", label: "Profile" }
] as const satisfies readonly PortalNavigationItem[];

export const VENDOR_PORTAL_NAVIGATION = [
  { href: "/portal/vendor", label: "Work queue" },
  { href: "/profile", label: "Profile" }
] as const satisfies readonly PortalNavigationItem[];
