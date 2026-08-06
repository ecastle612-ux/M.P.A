import {
  skuIncludesFacilityOperations,
  skuIncludesPropertyManager,
  type ProductSku
} from "./skus";

export const PLATFORM_ENTITLEMENTS = [
  "platform.org",
  "platform.documents",
  "platform.communications",
  "platform.search",
  "platform.quick_actions",
  "platform.launcher",
  "platform.guided_setup",
  "platform.billing_self",
  "platform.marketplace_vendor_consume",
  "platform.ai"
] as const;

export const PROPERTY_MANAGER_ENTITLEMENTS = [
  "pm.mission_control",
  "pm.properties",
  "pm.residents",
  "pm.leasing",
  "pm.maintenance",
  "pm.vendors",
  "pm.financial_operations",
  "pm.reports_owner",
  "pm.portal_owner",
  "pm.portal_tenant"
] as const;

export const FACILITY_ENTITLEMENTS = [
  "facility.mission_control",
  "facility.operations",
  "facility.assets",
  "facility.inventory",
  "facility.parts",
  "facility.preventive",
  "facility.inspections",
  "facility.safety",
  "facility.compliance",
  "facility.building_systems"
  // facility.capital_projects intentionally off by default (future)
] as const;

export const FUTURE_FACILITY_ENTITLEMENTS = ["facility.capital_projects"] as const;

export type EntitlementKey =
  | (typeof PLATFORM_ENTITLEMENTS)[number]
  | (typeof PROPERTY_MANAGER_ENTITLEMENTS)[number]
  | (typeof FACILITY_ENTITLEMENTS)[number]
  | (typeof FUTURE_FACILITY_ENTITLEMENTS)[number]
  | `admin.${string}`;

export function entitlementsForSku(sku: ProductSku): EntitlementKey[] {
  const entitlements: EntitlementKey[] = [...PLATFORM_ENTITLEMENTS];

  if (skuIncludesPropertyManager(sku)) {
    entitlements.push(...PROPERTY_MANAGER_ENTITLEMENTS);
  }

  if (skuIncludesFacilityOperations(sku)) {
    entitlements.push(...FACILITY_ENTITLEMENTS);
    if (sku === "mpa_facility_operations") {
      entitlements.push("platform.marketplace_vendor_consume");
    }
  }

  return Array.from(new Set(entitlements));
}

export function hasEntitlement(
  granted: readonly string[],
  required: EntitlementKey | string
): boolean {
  return granted.includes(required);
}

export function entitlementsRequireComplete(entitlement: string): boolean {
  const isPm = (PROPERTY_MANAGER_ENTITLEMENTS as readonly string[]).includes(entitlement);
  const isFacility =
    (FACILITY_ENTITLEMENTS as readonly string[]).includes(entitlement) ||
    (FUTURE_FACILITY_ENTITLEMENTS as readonly string[]).includes(entitlement);
  // A capability "requires Complete" from a single-product customer's perspective
  // when it belongs to the other product family.
  return isPm || isFacility;
}
