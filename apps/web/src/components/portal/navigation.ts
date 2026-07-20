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
  { href: "/portal/tenant/maintenance", label: "Maintenance" },
  { href: "/portal/tenant/payments", label: "Payments" },
  { href: "/portal/tenant/messages", label: "Messages" },
  { href: "/portal/tenant/announcements", label: "Announcements" },
  { href: "/portal/tenant/documents", label: "Documents" },
  { href: "/portal/tenant/notifications", label: "Notifications" },
  { href: "/portal/tenant/community", label: "Community" },
  { href: "/portal/tenant/preferences", label: "Preferences" },
  { href: "/profile", label: "Profile" }
] as const;

export const VENDOR_PORTAL_NAVIGATION = [
  { href: "/portal/vendor", label: "Work queue" },
  { href: "/profile", label: "Profile" }
] as const;
