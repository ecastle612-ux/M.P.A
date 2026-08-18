import type { ProductSku } from "../commercial/skus";
import type { EntitlementKey } from "../commercial/entitlements";
import {
  entitlementsForMember,
  isPortalOnlyRoles,
  type MemberOperatingScope
} from "../auth/operating-scope";
import {
  isManagerClassRole,
  isStaffSearchActor,
  staffSearchLooksLikeGeneratedAssetCode,
  staffSearchLooksLikeRequestNumber
} from "./search";
import { contextualPmPlanHref } from "../facility/preventive-maintenance";

export const QUICK_CREATE_ACTION_IDS = [
  "fo_work_order",
  "fo_asset",
  "fo_request_form",
  "fo_work_template",
  "fo_pm_plan",
  "pm_property",
  "pm_resident",
  "pm_lease",
  "pm_maintenance",
  "pm_charge"
] as const;

export type QuickCreateActionId = (typeof QUICK_CREATE_ACTION_IDS)[number];

export interface QuickCreateAction {
  id: QuickCreateActionId;
  label: string;
  description: string;
  href: string;
  surface: "property" | "facility";
  entitlement: EntitlementKey;
}

const FO_QUICK_CREATE: readonly QuickCreateAction[] = [
  {
    id: "fo_work_order",
    label: "Work Order",
    description: "Create a facility work order",
    href: "/facility/operations?new=1",
    surface: "facility",
    entitlement: "facility.operations"
  },
  {
    id: "fo_asset",
    label: "Asset",
    description: "Register a facility asset",
    href: "/facility/assets?new=1",
    surface: "facility",
    entitlement: "facility.assets"
  },
  {
    id: "fo_request_form",
    label: "Request Form",
    description: "Create a public request form",
    href: "/facility/settings/request-forms?new=1",
    surface: "facility",
    entitlement: "facility.request_forms"
  },
  {
    id: "fo_work_template",
    label: "Work Template",
    description: "Create a facility work template",
    href: "/facility/settings/work-templates?new=1",
    surface: "facility",
    entitlement: "facility.operations"
  },
  {
    id: "fo_pm_plan",
    label: "Preventive Maintenance Plan",
    description: "Schedule repeating facility work",
    href: "/facility/preventive-maintenance?new=1",
    surface: "facility",
    entitlement: "facility.preventive"
  }
];

const PM_QUICK_CREATE: readonly QuickCreateAction[] = [
  {
    id: "pm_property",
    label: "Property",
    description: "Add a property to the portfolio",
    href: "/pm/properties?new=1",
    surface: "property",
    entitlement: "pm.properties"
  },
  {
    id: "pm_resident",
    label: "Resident",
    description: "Add a resident record",
    href: "/pm/residents?new=1",
    surface: "property",
    entitlement: "pm.residents"
  },
  {
    id: "pm_lease",
    label: "Lease",
    description: "Start a lease record",
    href: "/pm/leasing?new=1",
    surface: "property",
    entitlement: "pm.leasing"
  },
  {
    id: "pm_maintenance",
    label: "Maintenance",
    description: "Create residential maintenance work",
    href: "/pm/maintenance?new=1",
    surface: "property",
    entitlement: "pm.maintenance"
  },
  {
    id: "pm_charge",
    label: "Charge",
    description: "Open charges in Financial Operations",
    href: "/pm/financial-operations#charges",
    surface: "property",
    entitlement: "pm.financial_operations"
  }
];

export interface QuickCreateActor {
  sku: ProductSku | null;
  roles: readonly string[];
  storedScope?: MemberOperatingScope | null;
}

export function authorizedQuickCreateActions(actor: QuickCreateActor): QuickCreateAction[] {
  if (isPortalOnlyRoles(actor.roles) || !isStaffSearchActor(actor.roles)) {
    return [];
  }
  if (!isManagerClassRole(actor.roles)) {
    return [];
  }

  const entitled = new Set(
    entitlementsForMember({
      sku: actor.sku,
      roles: actor.roles,
      storedScope: actor.storedScope ?? null
    })
  );

  return [...FO_QUICK_CREATE, ...PM_QUICK_CREATE].filter((action) => entitled.has(action.entitlement));
}

export function contextualWorkOrderHref(input: {
  facilityAssetId?: string;
  propertyId?: string;
}): string {
  const params = new URLSearchParams({ new: "1" });
  if (input.facilityAssetId) params.set("facilityAssetId", input.facilityAssetId);
  if (input.propertyId) params.set("propertyId", input.propertyId);
  return `/facility/operations?${params.toString()}`;
}

export function contextualPreventivePlanHref(input: {
  facilityAssetId?: string;
  propertyId?: string;
}): string {
  return contextualPmPlanHref(input);
}

export function contextualPmMaintenanceHref(input: {
  propertyId?: string;
  residentId?: string;
}): string {
  const params = new URLSearchParams({ new: "1" });
  if (input.propertyId) params.set("propertyId", input.propertyId);
  if (input.residentId) params.set("residentId", input.residentId);
  return `/pm/maintenance?${params.toString()}`;
}

/** At most one relevant authorized create after a failed search. Never aggressive. */
export function suggestedCreatesForFailedSearch(
  query: string,
  actions: readonly QuickCreateAction[]
): QuickCreateAction[] {
  const allowed = new Map(actions.map((action) => [action.id, action]));
  if (/\b(preventive|inspection|quarterly|pm plan)\b/i.test(query)) {
    const plan = allowed.get("fo_pm_plan");
    return plan ? [plan] : [];
  }
  if (staffSearchLooksLikeGeneratedAssetCode(query) || /\b(chair|asset|serial|tag)\b/i.test(query)) {
    const asset = allowed.get("fo_asset");
    return asset ? [asset] : [];
  }
  if (staffSearchLooksLikeRequestNumber(query) || /\b(work order|repair|broken)\b/i.test(query)) {
    const fo = allowed.get("fo_work_order");
    if (fo) return [fo];
    const pm = allowed.get("pm_maintenance");
    return pm ? [pm] : [];
  }
  return [];
}
