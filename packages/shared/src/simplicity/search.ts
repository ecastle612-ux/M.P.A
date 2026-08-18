import { isPortalOnlyRoles, type MemberOperatingScope } from "../auth/operating-scope";
import { hasEntitlement, type EntitlementKey } from "../commercial/entitlements";
import {
  facilityMyWorkOrderHref,
  facilityOperationsWorkOrderHref
} from "../facility/mission-control-attention";
import type { ProductSku } from "../commercial/skus";
import type { UserRole } from "../types/roles";

export const STAFF_SEARCH_MIN_QUERY_LENGTH = 2;
export const STAFF_SEARCH_PER_DOMAIN_CAP = 6;
export const STAFF_SEARCH_TOTAL_CAP = 24;

export const STAFF_SEARCH_DOMAINS = [
  "property",
  "unit",
  "resident",
  "lease",
  "pm_work_order",
  "facility_work_order",
  "asset",
  "vendor",
  "request_form",
  "destination"
] as const;

export type StaffSearchDomain = (typeof STAFF_SEARCH_DOMAINS)[number];

export type StaffSearchActor = {
  sku: ProductSku | null;
  roles: readonly string[];
  storedScope?: MemberOperatingScope | null;
  entitlements: readonly string[];
  userId: string;
};

export type StaffSearchResult = {
  domain: StaffSearchDomain;
  recordId: string;
  title: string;
  subtitle: string;
  matchReason: string;
  href: string;
};

const STAFF_ROLES = new Set<UserRole>([
  "organization_admin",
  "property_manager",
  "leasing_agent",
  "maintenance_technician"
]);

export function isStaffSearchActor(roles: readonly string[]): boolean {
  if (isPortalOnlyRoles(roles)) return false;
  return roles.some((role) => STAFF_ROLES.has(role as UserRole));
}

export function isManagerClassRole(roles: readonly string[]): boolean {
  return roles.some((role) => role === "organization_admin" || role === "property_manager");
}

/** Dual-role manager+technician uses manager search. Technician-only is narrowed. */
export function isTechnicianOnlySearchActor(roles: readonly string[]): boolean {
  return roles.includes("maintenance_technician") && !isManagerClassRole(roles);
}

export function sanitizeStaffSearchQuery(raw: string): string {
  return raw.replace(/[%_,.()]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}

export function staffSearchQueryIsUseful(raw: string): boolean {
  return sanitizeStaffSearchQuery(raw).length >= STAFF_SEARCH_MIN_QUERY_LENGTH;
}

export function authorizedSearchDomains(actor: StaffSearchActor): StaffSearchDomain[] {
  if (!isStaffSearchActor(actor.roles)) return [];
  const domains: StaffSearchDomain[] = ["destination"];
  const entitled = (key: EntitlementKey) => hasEntitlement(actor.entitlements, key);
  const technicianOnly = isTechnicianOnlySearchActor(actor.roles);

  // Buildings/sites live on property_properties for both PM and FO.
  if (entitled("pm.properties") || entitled("facility.operations") || entitled("facility.assets")) {
    domains.push("property");
  }
  if (entitled("pm.properties")) domains.push("unit");
  if (entitled("pm.residents")) domains.push("resident");
  if (entitled("pm.leasing") && !technicianOnly) domains.push("lease");
  if (entitled("pm.maintenance")) domains.push("pm_work_order");
  if (entitled("facility.operations")) domains.push("facility_work_order");
  if (entitled("facility.assets")) domains.push("asset");
  if (entitled("pm.vendors") || entitled("facility.operations")) domains.push("vendor");
  if (entitled("facility.request_forms") && isManagerClassRole(actor.roles)) {
    domains.push("request_form");
  }
  return domains;
}

export function staffSearchLooksLikeRequestNumber(query: string): boolean {
  return /^fr-\d{4}-\d+/i.test(query.trim());
}

export function staffSearchLooksLikeGeneratedAssetCode(query: string): boolean {
  return /^ast-\d{1,6}$/i.test(query.trim());
}

export function staffWorkOrderHref(input: {
  surface: "residential" | "facility";
  workOrderId: string;
  technicianOnly: boolean;
  assignedToViewer: boolean;
}): string {
  if (input.surface === "residential") {
    return `/pm/maintenance?workOrderId=${encodeURIComponent(input.workOrderId)}`;
  }
  if (input.technicianOnly && input.assignedToViewer) {
    return facilityMyWorkOrderHref(input.workOrderId);
  }
  return facilityOperationsWorkOrderHref(input.workOrderId);
}

export function staffAssetHref(assetId: string): string {
  return `/facility/assets/${assetId}`;
}

export function staffPropertyHref(input: { propertyId: string; facilityBuilding?: boolean }): string {
  if (input.facilityBuilding) {
    return `/facility/assets?site=${encodeURIComponent(input.propertyId)}`;
  }
  return `/pm/properties/${input.propertyId}`;
}

export function staffUnitHref(propertyId: string): string {
  return `/pm/properties/${propertyId}`;
}

export function staffResidentHref(residentId: string): string {
  return `/pm/residents/${residentId}`;
}

export function staffLeaseHref(leaseId: string): string {
  return `/pm/leasing/${leaseId}`;
}

export function staffVendorHref(input: { facility: boolean; vendorId: string }): string {
  return input.facility ? `/facility/vendors` : `/pm/vendors`;
}

export function staffRequestFormHref(formId: string): string {
  return `/facility/settings/request-forms?formId=${encodeURIComponent(formId)}`;
}

export function publicSearchPayloadContainsSecrets(value: string): boolean {
  return (
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(value) ||
    /public_token|status_token|intake/i.test(value)
  );
}

export const STAFF_SEARCH_DOMAIN_LABELS: Record<StaffSearchDomain, string> = {
  property: "Property",
  unit: "Unit",
  resident: "Resident",
  lease: "Lease",
  pm_work_order: "Work Order",
  facility_work_order: "Work Order",
  asset: "Asset",
  vendor: "Vendor",
  request_form: "Request Form",
  destination: "Go to"
};

export function staffSearchDomainLabel(
  domain: StaffSearchDomain,
  options?: { facilityBuilding?: boolean }
): string {
  if (domain === "property" && options?.facilityBuilding) {
    return "Building";
  }
  return STAFF_SEARCH_DOMAIN_LABELS[domain];
}

export const EMPTY_SEARCH_DESTINATION_HREFS = [
  "/facility/my-work",
  "/facility/mission-control",
  "/facility/operations",
  "/facility/assets",
  "/facility/settings/request-forms",
  "/pm/mission-control",
  "/pm/properties",
  "/pm/residents",
  "/pm/maintenance",
  "/pm/financial-operations"
] as const;

export function matchReasonFor(input: {
  query: string;
  haystacks: ReadonlyArray<{ label: string; value?: string | null }>;
}): string {
  const needle = input.query.trim().toLowerCase();
  for (const field of input.haystacks) {
    const value = field.value?.trim();
    if (value && value.toLowerCase().includes(needle)) {
      return `Matched ${field.label}`;
    }
  }
  return "Matched record";
}

export function sanitizeSearchPresentation(value: string): string {
  if (publicSearchPayloadContainsSecrets(value)) {
    return value.replace(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
      ""
    ).replace(/\s+/g, " ").trim();
  }
  return value;
}
