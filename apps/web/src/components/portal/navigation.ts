export const MANAGER_PORTAL_NAVIGATION = [
  { href: "/launcher", label: "Workspace Launcher" },
  { href: "/setup", label: "Guided Setup" },
  { href: "/billing", label: "Billing & Plan" },
  { href: "/profile", label: "Profile" }
] as const;

export const OWNER_PORTAL_NAVIGATION = [
  { href: "/portal/owner", label: "Owner home" },
  { href: "/profile", label: "Profile" }
] as const;

export const TENANT_PORTAL_NAVIGATION = [
  { href: "/portal/tenant", label: "Home" },
  { href: "/portal/tenant/billing", label: "Billing" },
  { href: "/profile", label: "Profile" }
] as const;

export const VENDOR_PORTAL_NAVIGATION = [
  { href: "/portal/vendor", label: "Vendor home" },
  { href: "/profile", label: "Profile" }
] as const;
