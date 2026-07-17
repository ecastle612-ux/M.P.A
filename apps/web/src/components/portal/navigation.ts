export const MANAGER_PORTAL_NAVIGATION = [
  { href: "/portal/manager", label: "Manager home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/profile", label: "Profile" }
] as const;

export const OWNER_PORTAL_NAVIGATION = [
  { href: "/portal/owner", label: "Owner home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/profile", label: "Profile" }
] as const;

export const TENANT_PORTAL_NAVIGATION = [
  { href: "/portal/tenant", label: "Tenant home" },
  { href: "/portal/tenant/community", label: "Community" },
  { href: "/portal/tenant/messages", label: "Messages" },
  { href: "/portal/tenant/announcements", label: "Announcements" },
  { href: "/portal/tenant/preferences", label: "Preferences" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/profile", label: "Profile" }
] as const;

export const VENDOR_PORTAL_NAVIGATION = [
  { href: "/portal/vendor", label: "Vendor home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/profile", label: "Profile" }
] as const;
