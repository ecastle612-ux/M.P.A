import { entitlementsForMember, type MemberOperatingScope } from "../auth/operating-scope";
import { staffHasTenantCommsEntitlement } from "../communications/conversations";
import type { EntitlementKey } from "./entitlements";
import { hasEntitlement } from "./entitlements";
import type { ProductSku } from "./skus";

export type ApiEntitlementRequirement = EntitlementKey | null | "deny" | "tenant_comms_staff";

export type RouteAccessDecision =
  | { allowed: true; entitlement: EntitlementKey | null }
  | { allowed: false; entitlement: EntitlementKey | null; reason: string };

/**
 * Maps customer app pathnames to required entitlements.
 * Fail closed: unknown product namespaces are denied.
 */
export function requiredEntitlementForPath(pathname: string): EntitlementKey | null | "deny" {
  const path = (pathname.split("?")[0] ?? pathname).split("#")[0] ?? pathname;

  if (
    path === "/" ||
    path.startsWith("/login") ||
    path.startsWith("/forgot-password") ||
    path.startsWith("/reset-password") ||
    path.startsWith("/accept-invitation") ||
    path.startsWith("/unauthorized") ||
    path.startsWith("/api/") ||
    path.startsWith("/_next")
  ) {
    return null;
  }

  // Master Admin is operator-gated separately — not an org entitlement.
  if (path.startsWith("/admin")) {
    return null;
  }

  if (path === "/launcher" || path.startsWith("/launcher/")) {
    return "platform.launcher";
  }
  if (path === "/setup" || path.startsWith("/setup/")) {
    return "platform.guided_setup";
  }
  if (path === "/billing" || path.startsWith("/billing/")) {
    return "platform.billing_self";
  }
  if (path.startsWith("/settings")) {
    return "platform.org";
  }
  if (path === "/profile" || path.startsWith("/profile/")) {
    return null;
  }
  if (path === "/dashboard" || path.startsWith("/dashboard/")) {
    return null; // redirects to SKU home
  }
  if (path.startsWith("/portal")) {
    return null; // role portals; commercial modules live under /pm and /facility
  }

  if (path.startsWith("/shared/documents") || path.startsWith("/shared/tables")) {
    return "platform.documents";
  }
  if (path.startsWith("/shared/reports")) {
    return "platform.reports";
  }
  if (path.startsWith("/shared/communications")) {
    return "platform.communications";
  }
  if (path.startsWith("/shared/")) {
    return "deny";
  }

  const pmRoutes: Array<[string, EntitlementKey]> = [
    ["/pm/mission-control", "pm.mission_control"],
    ["/pm/properties", "pm.properties"],
    ["/pm/residents", "pm.residents"],
    ["/pm/leasing", "pm.leasing"],
    ["/pm/maintenance", "pm.maintenance"],
    ["/pm/reports", "pm.maintenance"],
    ["/pm/vendors", "pm.vendors"],
    ["/pm/financial-operations", "pm.financial_operations"]
  ];
  for (const [prefix, entitlement] of pmRoutes) {
    if (path === prefix || path.startsWith(`${prefix}/`)) {
      return entitlement;
    }
  }
  if (path.startsWith("/pm/")) {
    return "deny";
  }

  const facilityRoutes: Array<[string, EntitlementKey]> = [
    ["/facility/mission-control", "facility.mission_control"],
    ["/facility/operations", "facility.operations"],
    ["/facility/reports", "facility.operations"],
    ["/facility/vendors", "facility.operations"],
    ["/facility/assets", "facility.assets"],
    ["/facility/inventory", "facility.inventory"],
    ["/facility/parts", "facility.parts"],
    ["/facility/preventive-maintenance", "facility.preventive"],
    ["/facility/inspections", "facility.inspections"],
    ["/facility/safety", "facility.safety"],
    ["/facility/compliance", "facility.compliance"],
    ["/facility/building-systems", "facility.building_systems"],
    ["/facility/capital-projects", "facility.capital_projects"]
  ];
  for (const [prefix, entitlement] of facilityRoutes) {
    if (path === prefix || path.startsWith(`${prefix}/`)) {
      return entitlement;
    }
  }
  if (path.startsWith("/facility/")) {
    return "deny";
  }

  return null;
}

/**
 * Coarse API catalog (ADR-026 / PLAT-002 C3).
 * Pages keep requiredEntitlementForPath (which leaves /api/ as null).
 * Portal, webhooks, commerce, media, and auth stay null — helpers or signatures own them.
 */
export function requiredEntitlementForApiPath(pathname: string): ApiEntitlementRequirement {
  const path = (pathname.split("?")[0] ?? pathname).split("#")[0] ?? pathname;
  if (!path.startsWith("/api/")) {
    return null;
  }

  if (
    path.startsWith("/api/admin") ||
    path.startsWith("/api/portal") ||
    path.startsWith("/api/auth") ||
    path.startsWith("/api/commerce") ||
    path.startsWith("/api/demo") ||
    path.startsWith("/api/invitations") ||
    path.startsWith("/api/profile") ||
    path.startsWith("/api/shared/media")
  ) {
    return null;
  }

  if (
    path.startsWith("/api/finance/webhooks") ||
    path.startsWith("/api/finance/resident") ||
    path.startsWith("/api/finance/checkout")
  ) {
    return null;
  }
  if (path.startsWith("/api/finance/")) {
    return "pm.financial_operations";
  }

  if (path.startsWith("/api/pm/properties") || path.startsWith("/api/pm/mission-control")) {
    return "pm.properties";
  }
  if (path.startsWith("/api/pm/maintenance/vendors") || path.startsWith("/api/pm/vendors")) {
    return "pm.vendors";
  }
  if (path.startsWith("/api/pm/maintenance") || path.startsWith("/api/pm/reports")) {
    return "pm.maintenance";
  }
  if (path.startsWith("/api/pm/residents")) {
    return "pm.residents";
  }
  if (path.startsWith("/api/pm/leasing")) {
    return "pm.leasing";
  }
  if (path.startsWith("/api/pm/")) {
    return "deny";
  }

  if (path.startsWith("/api/facility/")) {
    return requiredEntitlementForPath(path.slice("/api".length));
  }

  if (path.startsWith("/api/shared/reports")) {
    return "platform.reports";
  }
  if (path.startsWith("/api/shared/documents") || path.startsWith("/api/shared/tables")) {
    return "platform.documents";
  }
  if (path.startsWith("/api/shared/communications/conversations")) {
    return "tenant_comms_staff";
  }
  if (path.startsWith("/api/shared/communications")) {
    return "platform.communications";
  }
  if (path.startsWith("/api/shared/")) {
    return "deny";
  }

  return null;
}

export function evaluateApiPathEntitlement(input: {
  pathname: string;
  sku: ProductSku | null;
  extraEntitlements?: readonly string[] | undefined;
  roles?: readonly string[] | undefined;
  storedScope?: MemberOperatingScope | null | undefined;
}): RouteAccessDecision {
  const required = requiredEntitlementForApiPath(input.pathname);
  if (required === null) {
    return { allowed: true, entitlement: null };
  }
  if (required === "deny") {
    return { allowed: false, entitlement: null, reason: "Unknown commercial API route" };
  }

  const granted = [
    ...entitlementsForMember({
      sku: input.sku,
      roles: input.roles,
      storedScope: input.storedScope
    }),
    ...(input.extraEntitlements ?? [])
  ];

  if (required === "tenant_comms_staff") {
    if (!staffHasTenantCommsEntitlement(granted)) {
      return {
        allowed: false,
        entitlement: "pm.portal_tenant",
        reason: "Missing tenant communication staff entitlements"
      };
    }
    return { allowed: true, entitlement: "pm.portal_tenant" };
  }

  if (!input.sku) {
    const bootstrap = new Set(["platform.org", "platform.guided_setup", "platform.billing_self", "platform.launcher"]);
    if (!bootstrap.has(required)) {
      return {
        allowed: false,
        entitlement: required,
        reason: "Organization has no commercial subscription"
      };
    }
  }

  if (!hasEntitlement(granted, required)) {
    return {
      allowed: false,
      entitlement: required,
      reason: `Missing entitlement ${required}`
    };
  }

  return { allowed: true, entitlement: required };
}

export function evaluatePathEntitlement(input: {
  pathname: string;
  sku: ProductSku | null;
  extraEntitlements?: readonly string[] | undefined;
  roles?: readonly string[] | undefined;
  storedScope?: MemberOperatingScope | null | undefined;
}): RouteAccessDecision {
  const required = requiredEntitlementForPath(input.pathname);
  if (required === null) {
    return { allowed: true, entitlement: null };
  }
  if (required === "deny") {
    return { allowed: false, entitlement: null, reason: "Unknown commercial route" };
  }

  const granted = new Set<string>([
    ...entitlementsForMember({
      sku: input.sku,
      roles: input.roles,
      storedScope: input.storedScope
    }),
    ...(input.extraEntitlements ?? [])
  ]);

  // No SKU: only setup/billing/launcher/org paths
  if (!input.sku) {
    const bootstrap = new Set(["platform.org", "platform.guided_setup", "platform.billing_self", "platform.launcher"]);
    if (!bootstrap.has(required)) {
      return {
        allowed: false,
        entitlement: required,
        reason: "Organization has no commercial subscription"
      };
    }
  }

  if (!hasEntitlement([...granted], required)) {
    return {
      allowed: false,
      entitlement: required,
      reason: `Missing entitlement ${required}`
    };
  }

  return { allowed: true, entitlement: required };
}

export type SearchResultItem = {
  id: string;
  label: string;
  href: string;
  group: string;
  entitlement: EntitlementKey | null;
};

export function searchCatalogForSku(
  sku: ProductSku | null,
  query: string,
  input: { roles?: readonly string[] | undefined; storedScope?: MemberOperatingScope | null | undefined } = {}
): SearchResultItem[] {
  const decisionPath = (href: string, label: string, group: string, entitlement: EntitlementKey | null): SearchResultItem | null => {
    const access = evaluatePathEntitlement({
      pathname: href,
      sku,
      roles: input.roles,
      storedScope: input.storedScope
    });
    if (!access.allowed) {
      return null;
    }
    return { id: href, label, href, group, entitlement };
  };

  const catalog: SearchResultItem[] = [];
  const push = (item: SearchResultItem | null) => {
    if (item) {
      catalog.push(item);
    }
  };

  push(decisionPath("/launcher", "Workspace Launcher", "Home", "platform.launcher"));
  push(decisionPath("/setup", "Guided Setup", "Home", "platform.guided_setup"));
  push(decisionPath("/billing", "Billing & Plan", "Home", "platform.billing_self"));
  push(decisionPath("/settings/organization", "Organization Settings", "Home", "platform.org"));

  if (sku) {
    push(decisionPath("/pm/mission-control", "Mission Control", "Property Manager", "pm.mission_control"));
    push(decisionPath("/pm/properties", "Properties", "Property Manager", "pm.properties"));
    push(
      decisionPath(
        "/pm/properties?new=1",
        "Add property",
        "Property Manager",
        "pm.properties"
      )
    );
    push(decisionPath("/pm/residents", "Residents", "Property Manager", "pm.residents"));
    push(decisionPath("/pm/leasing", "Leasing", "Property Manager", "pm.leasing"));
    push(decisionPath("/pm/maintenance", "Maintenance", "Property Manager", "pm.maintenance"));
    push(
      decisionPath(
        "/pm/reports/work-orders",
        "Work order reports",
        "Property Manager",
        "pm.maintenance"
      )
    );
    push(decisionPath("/pm/vendors", "Vendors", "Property Manager", "pm.vendors"));
    push(
      decisionPath(
        "/pm/financial-operations",
        "Financial Operations",
        "Property Manager",
        "pm.financial_operations"
      )
    );
    push(
      decisionPath(
        "/pm/financial-operations#charges",
        "Charges & ledger",
        "Property Manager",
        "pm.financial_operations"
      )
    );
    push(
      decisionPath(
        "/pm/financial-operations#payments",
        "Payments",
        "Property Manager",
        "pm.financial_operations"
      )
    );
    push(
      decisionPath(
        "/pm/financial-operations#vendor-invoices",
        "Vendor invoices",
        "Property Manager",
        "pm.financial_operations"
      )
    );
    push(
      decisionPath(
        "/pm/financial-operations#reports",
        "Reports",
        "Property Manager",
        "pm.financial_operations"
      )
    );

    push(
      decisionPath("/facility/mission-control", "Mission Control", "Facility Operations", "facility.mission_control")
    );
    push(decisionPath("/facility/operations", "Facility Operations", "Facility Operations", "facility.operations"));
    push(decisionPath("/facility/reports", "Work order reports", "Facility Operations", "facility.operations"));
    push(decisionPath("/facility/vendors", "Vendors", "Facility Operations", "facility.operations"));
    push(decisionPath("/facility/assets", "Assets", "Facility Operations", "facility.assets"));
    push(decisionPath("/facility/inventory", "Inventory", "Facility Operations", "facility.inventory"));
    push(decisionPath("/facility/parts", "Parts", "Facility Operations", "facility.parts"));
    push(
      decisionPath(
        "/facility/preventive-maintenance",
        "Preventive Maintenance",
        "Facility Operations",
        "facility.preventive"
      )
    );
    push(decisionPath("/facility/inspections", "Inspections", "Facility Operations", "facility.inspections"));
    push(decisionPath("/facility/safety", "Safety", "Facility Operations", "facility.safety"));
    push(decisionPath("/facility/compliance", "Compliance", "Facility Operations", "facility.compliance"));
    push(
      decisionPath(
        "/facility/building-systems",
        "Building Systems",
        "Facility Operations",
        "facility.building_systems"
      )
    );

    push(decisionPath("/shared/documents", "Documents", "Shared Platform", "platform.documents"));
    push(decisionPath("/shared/tables", "Tables", "Shared Platform", "platform.documents"));
    push(decisionPath("/shared/reports", "Reporting & Analytics", "Shared Platform", "platform.reports"));
    push(decisionPath("/shared/communications", "Communications", "Shared Platform", "platform.communications"));
  }

  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return catalog;
  }
  return catalog.filter(
    (item) =>
      item.label.toLowerCase().includes(normalized) ||
      item.group.toLowerCase().includes(normalized) ||
      item.href.toLowerCase().includes(normalized)
  );
}
