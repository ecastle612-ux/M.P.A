import type { UserRole } from "../types/roles";
import type { NavGroup, NavItem } from "./modules";
import type { MasterAdminNavGroup } from "./master-admin";

export const NAV_ICON_NAMES = [
  "missionControl",
  "launcher",
  "setup",
  "properties",
  "residents",
  "leasing",
  "maintenance",
  "financialOperations",
  "onlinePayments",
  "vendors",
  "workOrderReports",
  "operations",
  "myWork",
  "assets",
  "inventory",
  "requestForms",
  "workTemplates",
  "reports",
  "preventive",
  "inspections",
  "safety",
  "compliance",
  "parts",
  "buildingSystems",
  "documents",
  "tables",
  "communications",
  "organization",
  "team",
  "billing",
  "settings",
  "adminCommand",
  "adminSupport",
  "adminHealth",
  "customers",
  "operators",
  "viewAs",
  "provisioning",
  "lifecycle",
  "subscriptions",
  "complimentary",
  "checkout"
] as const;

export type NavIconName = (typeof NAV_ICON_NAMES)[number];

export const NAV_SECTION_IDS = [
  "overview",
  "work",
  "portfolio",
  "finance",
  "facilities",
  "partners",
  "workspace",
  "insights",
  "manage",
  "home",
  "operations",
  "customers",
  "commercial"
] as const;

export type NavSectionId = (typeof NAV_SECTION_IDS)[number];

export type OperationalSurface = "property" | "facility" | "shared" | "admin" | "account";

export type PresentedNavItem = NavItem & {
  icon: NavIconName;
  section: NavSectionId;
};

export type PresentedNavSection = {
  id: NavSectionId;
  title: string;
  items: PresentedNavItem[];
};

export type PresentedNavGroup = {
  id: string;
  title: string;
  product: NavGroup["product"] | "master_admin";
  current: boolean;
  sections: PresentedNavSection[];
};

export type CompleteSurfaceOption = {
  id: "property" | "facility";
  label: "Property Operations" | "Facility Operations";
  href: string;
};

const SECTION_TITLES: Record<NavSectionId, string> = {
  overview: "Overview",
  work: "Work",
  portfolio: "Portfolio",
  finance: "Finance",
  facilities: "Facilities",
  partners: "Partners",
  workspace: "Workspace",
  insights: "Insights",
  manage: "Manage",
  home: "Home",
  operations: "Operations",
  customers: "Customers",
  commercial: "Commercial"
};

const HREF_META: Record<string, { icon: NavIconName; section: NavSectionId }> = {
  "/launcher": { icon: "launcher", section: "home" },
  "/setup": { icon: "setup", section: "home" },
  "/pm/mission-control": { icon: "missionControl", section: "overview" },
  "/pm/properties": { icon: "properties", section: "portfolio" },
  "/pm/residents": { icon: "residents", section: "portfolio" },
  "/pm/leasing": { icon: "leasing", section: "portfolio" },
  "/pm/maintenance": { icon: "maintenance", section: "portfolio" },
  "/pm/reports/work-orders": { icon: "workOrderReports", section: "portfolio" },
  "/pm/vendors": { icon: "vendors", section: "partners" },
  "/pm/financial-operations": { icon: "financialOperations", section: "finance" },
  "/facility/mission-control": { icon: "missionControl", section: "overview" },
  "/facility/my-work": { icon: "myWork", section: "work" },
  "/facility/operations": { icon: "operations", section: "work" },
  "/facility/reports": { icon: "reports", section: "work" },
  "/facility/vendors": { icon: "vendors", section: "partners" },
  "/facility/settings/work-templates": { icon: "workTemplates", section: "facilities" },
  "/facility/settings/request-forms": { icon: "requestForms", section: "facilities" },
  "/facility/assets": { icon: "assets", section: "facilities" },
  "/facility/preventive-maintenance": { icon: "preventive", section: "facilities" },
  "/facility/inspections": { icon: "inspections", section: "facilities" },
  "/facility/safety": { icon: "safety", section: "facilities" },
  "/facility/compliance": { icon: "compliance", section: "facilities" },
  "/facility/inventory": { icon: "inventory", section: "facilities" },
  "/facility/parts": { icon: "parts", section: "facilities" },
  "/facility/building-systems": { icon: "buildingSystems", section: "facilities" },
  "/shared/documents": { icon: "documents", section: "workspace" },
  "/shared/tables": { icon: "tables", section: "workspace" },
  "/shared/reports": { icon: "reports", section: "insights" },
  "/shared/communications": { icon: "communications", section: "workspace" },
  "/billing": { icon: "billing", section: "manage" },
  "/settings/organization": { icon: "organization", section: "manage" },
  "/settings/team": { icon: "team", section: "manage" },
  "/profile": { icon: "settings", section: "manage" },
  "/portal/tenant": { icon: "missionControl", section: "overview" },
  "/portal/tenant/billing": { icon: "billing", section: "finance" },
  "/portal/tenant/maintenance": { icon: "maintenance", section: "work" },
  "/portal/tenant/messages": { icon: "communications", section: "workspace" },
  "/portal/tenant/documents": { icon: "documents", section: "workspace" },
  "/portal/owner": { icon: "properties", section: "overview" },
  "/portal/owner/financials": { icon: "financialOperations", section: "finance" },
  "/portal/vendor": { icon: "operations", section: "work" },
  "/admin": { icon: "adminCommand", section: "operations" },
  "/admin/support": { icon: "adminSupport", section: "operations" },
  "/admin/system": { icon: "adminHealth", section: "operations" },
  "/admin/platform/organizations": { icon: "organization", section: "customers" },
  "/admin/platform/customers": { icon: "customers", section: "customers" },
  "/admin/platform/operators": { icon: "operators", section: "customers" },
  "/admin/support/view-as": { icon: "viewAs", section: "customers" },
  "/admin/commercial/billing": { icon: "billing", section: "commercial" },
  "/admin/commercial/provisioning": { icon: "provisioning", section: "commercial" },
  "/admin/commercial/lifecycle": { icon: "lifecycle", section: "commercial" },
  "/admin/commercial/subscriptions": { icon: "subscriptions", section: "commercial" },
  "/admin/commercial/complimentary-access": { icon: "complimentary", section: "commercial" },
  "/admin/commercial/checkout": { icon: "checkout", section: "commercial" }
};

/** Technician daily destinations — manager admin stays authorized, just off the rail. */
const TECHNICIAN_SIDEBAR_HREFS = new Set<string>([
  "/facility/my-work",
  "/facility/operations",
  "/pm/maintenance",
  "/pm/properties",
  "/shared/documents",
  "/shared/communications",
  "/shared/tables"
]);

const PORTAL_ONLY_ROLES: ReadonlySet<UserRole> = new Set(["tenant", "vendor", "property_owner"]);

export function navIconForHref(href: string): NavIconName {
  const exact = HREF_META[href];
  if (exact) {
    return exact.icon;
  }
  if (href.startsWith("/pm/financial-operations")) {
    return href.includes("online-payments") || href.includes("payment") ? "onlinePayments" : "financialOperations";
  }
  if (href.startsWith("/facility/my-work")) {
    return "myWork";
  }
  if (href.startsWith("/facility/settings/request-forms")) {
    return "requestForms";
  }
  if (href.startsWith("/facility/settings/work-templates")) {
    return "workTemplates";
  }
  if (href.startsWith("/facility/operations")) {
    return "operations";
  }
  if (href.startsWith("/admin")) {
    return "adminCommand";
  }
  return "settings";
}

export function navSectionForHref(href: string): NavSectionId {
  const exact = HREF_META[href];
  if (exact) {
    return exact.section;
  }
  if (href.startsWith("/pm/financial-operations")) {
    return "finance";
  }
  if (href.startsWith("/facility/my-work") || href.startsWith("/facility/operations")) {
    return "work";
  }
  if (href.startsWith("/facility/settings")) {
    return "facilities";
  }
  if (href.startsWith("/admin/commercial")) {
    return "commercial";
  }
  if (href.startsWith("/admin/platform") || href.startsWith("/admin/support")) {
    return "customers";
  }
  if (href.startsWith("/admin")) {
    return "operations";
  }
  return "manage";
}

export function navSectionTitle(id: NavSectionId): string {
  return SECTION_TITLES[id];
}

export function operationalSurfaceFromPath(pathname: string): OperationalSurface {
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return "admin";
  }
  if (pathname.startsWith("/pm/")) {
    return "property";
  }
  if (pathname.startsWith("/facility/")) {
    return "facility";
  }
  if (pathname.startsWith("/shared/") || pathname.startsWith("/settings/")) {
    return "shared";
  }
  return "account";
}

export function isExactAdminHome(pathname: string, href: string): boolean {
  return href === "/admin" && pathname === "/admin";
}

/**
 * Longest-prefix active match so nested/detail routes light the parent item
 * without stealing siblings that share a shorter prefix.
 */
export function isNavItemActive(pathname: string, href: string, candidates: readonly string[]): boolean {
  if (href === "/admin") {
    return pathname === "/admin";
  }
  const matches = candidates.filter((candidate) => pathname === candidate || pathname.startsWith(`${candidate}/`));
  if (matches.length === 0) {
    return false;
  }
  const best = [...matches].sort((left, right) => right.length - left.length)[0];
  return best === href;
}

export function navCandidatesFromGroups(groups: readonly NavGroup[] | readonly PresentedNavGroup[]): string[] {
  const hrefs: string[] = [];
  for (const group of groups) {
    if ("sections" in group) {
      for (const section of group.sections) {
        for (const item of section.items) {
          hrefs.push(item.href);
        }
      }
    } else {
      for (const item of group.items) {
        hrefs.push(item.href);
      }
    }
  }
  return hrefs;
}

export function isTechnicianOnlyStaff(roles: readonly UserRole[]): boolean {
  const staff = roles.filter((role) => !PORTAL_ONLY_ROLES.has(role));
  return staff.length > 0 && staff.every((role) => role === "maintenance_technician");
}

export function presentNavigationGroups(
  groups: readonly NavGroup[],
  input: { roles?: readonly UserRole[]; pathname?: string | null } = {}
): PresentedNavGroup[] {
  const roles = input.roles ?? [];
  const technicianOnly = isTechnicianOnlyStaff(roles);
  const pathname = input.pathname ?? "";
  const surface = operationalSurfaceFromPath(pathname);

  return groups
    .map((group) => {
      const items = group.items
        .filter((item) => !technicianOnly || TECHNICIAN_SIDEBAR_HREFS.has(item.href))
        .map((item) => annotateNavItem(item));

      const sectionMap = new Map<NavSectionId, PresentedNavItem[]>();
      for (const item of items) {
        const bucket = sectionMap.get(item.section) ?? [];
        bucket.push(item);
        sectionMap.set(item.section, bucket);
      }

      const sections: PresentedNavSection[] = [];
      for (const sectionId of NAV_SECTION_IDS) {
        const sectionItems = sectionMap.get(sectionId);
        if (!sectionItems || sectionItems.length === 0) {
          continue;
        }
        sections.push({
          id: sectionId,
          title: navSectionTitle(sectionId),
          items: sectionItems
        });
      }

      return {
        id: group.id,
        title: group.title,
        product: group.product,
        current: isGroupCurrent(group, surface),
        sections
      } satisfies PresentedNavGroup;
    })
    .filter((group) => group.sections.length > 0);
}

export function presentMasterAdminNav(
  groups: readonly MasterAdminNavGroup[],
  pathname = ""
): PresentedNavGroup[] {
  const surface = operationalSurfaceFromPath(pathname);
  return groups.map((group) => {
    const items: PresentedNavItem[] = group.items.map((item) =>
      annotateNavItem({
        href: item.href,
        label: item.label,
        readiness: "aligned",
        entitlement: null
      })
    );
    return {
      id: group.id,
      title: group.title,
      product: "master_admin",
      current: surface === "admin",
      sections: [
        {
          id: group.id as NavSectionId,
          title: group.title,
          items
        }
      ]
    } satisfies PresentedNavGroup;
  });
}

export function completeSurfaceOptions(groups: readonly NavGroup[]): CompleteSurfaceOption[] {
  const options: CompleteSurfaceOption[] = [];
  const hrefs = navCandidatesFromGroups(groups);
  if (hrefs.includes("/pm/mission-control")) {
    options.push({
      id: "property",
      label: "Property Operations",
      href: "/pm/mission-control"
    });
  }
  if (hrefs.includes("/facility/mission-control")) {
    options.push({
      id: "facility",
      label: "Facility Operations",
      href: "/facility/mission-control"
    });
  }
  return options;
}

export function surfaceLabelForPath(
  pathname: string,
  skuLabel: string | null,
  options: readonly CompleteSurfaceOption[]
): string {
  const surface = operationalSurfaceFromPath(pathname);
  if (surface === "property") {
    return options.some((option) => option.id === "facility") ? "Property Operations" : (skuLabel ?? "Property Operations");
  }
  if (surface === "facility") {
    return options.some((option) => option.id === "property") ? "Facility Operations" : (skuLabel ?? "Facility Operations");
  }
  if (surface === "admin") {
    return "Owner Operations";
  }
  return skuLabel ?? "Workspace";
}

/** Sidebar destinations remain one click; surface switch is a direct Mission Control hop. */
export function sidebarClickCountToHref(input: {
  href: string;
  groups: readonly NavGroup[];
  roles?: readonly UserRole[];
  fromPathname?: string;
}): { clicks: number; available: boolean; via: "sidebar" | "surface-switch" | "unavailable" } {
  const presented = presentNavigationGroups(input.groups, {
    ...(input.roles ? { roles: input.roles } : {}),
    ...(input.fromPathname ? { pathname: input.fromPathname } : {})
  });
  const hrefs = navCandidatesFromGroups(presented);
  if (hrefs.includes(input.href)) {
    return { clicks: 1, available: true, via: "sidebar" };
  }
  const options = completeSurfaceOptions(input.groups);
  if (options.some((option) => option.href === input.href)) {
    return { clicks: 1, available: true, via: "surface-switch" };
  }
  const rawHrefs = navCandidatesFromGroups(input.groups);
  if (rawHrefs.includes(input.href)) {
    return { clicks: 1, available: true, via: "sidebar" };
  }
  return { clicks: Number.POSITIVE_INFINITY, available: false, via: "unavailable" };
}

function annotateNavItem(item: NavItem): PresentedNavItem {
  return {
    ...item,
    icon: navIconForHref(item.href),
    section: navSectionForHref(item.href)
  };
}

function isGroupCurrent(group: NavGroup, surface: OperationalSurface): boolean {
  if (group.product === "property_manager") {
    return surface === "property";
  }
  if (group.product === "facility_operations") {
    return surface === "facility";
  }
  if (group.product === "shared") {
    return surface === "shared";
  }
  if (group.product === "launcher") {
    return surface === "account";
  }
  return false;
}
