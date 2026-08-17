export const MANAGER_PORTAL_NAVIGATION = [
  { href: "/launcher", label: "Workspace Launcher" },
  { href: "/setup", label: "Guided Setup" },
  { href: "/billing", label: "Billing & Plan" },
  { href: "/profile", label: "Profile" }
] as const;

export const OWNER_PORTAL_NAVIGATION = [
  { href: "/portal/owner", label: "Portfolio" },
  { href: "/portal/owner/financials", label: "Financials" },
  { href: "/profile", label: "Profile" }
] as const;

export const TENANT_PORTAL_NAVIGATION = [
  { href: "/portal/tenant", label: "Home", shortLabel: "Home" },
  { href: "/portal/tenant/billing", label: "Billing", shortLabel: "Billing" },
  { href: "/portal/tenant/maintenance", label: "Maintenance", shortLabel: "Fix" },
  { href: "/portal/tenant/messages", label: "Messages", shortLabel: "Inbox" },
  { href: "/portal/tenant/documents", label: "Documents", shortLabel: "Docs" },
  { href: "/profile", label: "Account", shortLabel: "Account" }
] as const;

export const VENDOR_PORTAL_NAVIGATION = [
  { href: "/portal/vendor", label: "Vendor work", shortLabel: "Work" },
  { href: "/profile", label: "Account", shortLabel: "Account" }
] as const;
