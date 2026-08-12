import type { DemoPersona } from "./personas";
import { isFacilityPersona, isPortalPersona } from "./personas";
import type { DemoProductId } from "./products";

export type DemoNavItem = {
  id: string;
  label: string;
  surface: string;
  group: "pm" | "facility" | "portal" | "shared";
};

const PM_NAV: DemoNavItem[] = [
  { id: "mission_control", label: "Mission Control", surface: "mission-control", group: "pm" },
  { id: "properties", label: "Properties", surface: "properties", group: "pm" },
  { id: "residents", label: "Residents", surface: "residents", group: "pm" },
  { id: "leasing", label: "Leasing", surface: "leasing", group: "pm" },
  { id: "maintenance", label: "Maintenance", surface: "maintenance", group: "pm" },
  { id: "vendors", label: "Vendors", surface: "vendors", group: "pm" },
  { id: "financial", label: "Financial Operations", surface: "financial", group: "pm" },
  { id: "documents", label: "Documents", surface: "documents", group: "shared" },
  { id: "reports", label: "Reporting", surface: "reports", group: "shared" },
  { id: "communications", label: "Communications", surface: "communications", group: "shared" },
  { id: "assistant", label: "Assistant", surface: "assistant", group: "shared" },
  { id: "timeline", label: "Timeline", surface: "timeline", group: "shared" }
];

const FO_NAV: DemoNavItem[] = [
  { id: "fo_mission", label: "Mission Control", surface: "fo-mission-control", group: "facility" },
  { id: "sites", label: "Sites & Locations", surface: "sites", group: "facility" },
  { id: "assets", label: "Assets", surface: "assets", group: "facility" },
  { id: "systems", label: "Building Systems", surface: "building-systems", group: "facility" },
  { id: "corrective", label: "Corrective Work", surface: "corrective", group: "facility" },
  { id: "preventive", label: "Preventive Maintenance", surface: "preventive", group: "facility" },
  { id: "inventory", label: "Inventory", surface: "inventory", group: "facility" },
  { id: "parts", label: "Parts", surface: "parts", group: "facility" },
  { id: "inspections", label: "Inspections", surface: "inspections", group: "facility" },
  { id: "safety", label: "Safety", surface: "safety", group: "facility" },
  { id: "compliance", label: "Compliance", surface: "compliance", group: "facility" },
  { id: "fo_assistant", label: "Assistant", surface: "assistant", group: "shared" }
];

const PORTAL_NAV: Record<"resident" | "owner" | "vendor", DemoNavItem[]> = {
  resident: [
    { id: "res_home", label: "Resident Home", surface: "portal-resident", group: "portal" },
    { id: "res_billing", label: "Billing", surface: "portal-resident-billing", group: "portal" },
    { id: "res_maint", label: "Maintenance", surface: "portal-resident-maintenance", group: "portal" }
  ],
  owner: [
    { id: "own_home", label: "Owner Home", surface: "portal-owner", group: "portal" },
    { id: "own_fin", label: "Financials", surface: "portal-owner-financials", group: "portal" }
  ],
  vendor: [
    { id: "ven_home", label: "Vendor Home", surface: "portal-vendor", group: "portal" },
    { id: "ven_wo", label: "Assigned Work", surface: "portal-vendor-work", group: "portal" }
  ]
};

export function demoNavFor(product: DemoProductId, persona: DemoPersona): DemoNavItem[] {
  if (isPortalPersona(persona)) {
    if (persona === "resident") return PORTAL_NAV.resident;
    if (persona === "owner") return PORTAL_NAV.owner;
    return PORTAL_NAV.vendor;
  }

  if (product === "mpa_facility_operations" || isFacilityPersona(persona)) {
    if (product === "mpa_property_manager") {
      return filterPmNavForPersona(persona);
    }
    if (product === "mpa_complete_platform" && !isFacilityPersona(persona) && persona !== "executive") {
      return filterPmNavForPersona(persona);
    }
    if (product === "mpa_complete_platform" && persona === "executive") {
      return [...PM_NAV.slice(0, 6), ...FO_NAV.slice(0, 6)];
    }
    return FO_NAV;
  }

  return filterPmNavForPersona(persona);
}

function filterPmNavForPersona(persona: DemoPersona): DemoNavItem[] {
  if (persona === "leasing_agent") {
    return PM_NAV.filter((item) =>
      ["mission_control", "properties", "residents", "leasing", "documents", "communications", "assistant"].includes(
        item.id
      )
    );
  }
  if (persona === "maintenance_technician") {
    return PM_NAV.filter((item) =>
      ["mission_control", "properties", "maintenance", "documents", "communications", "assistant"].includes(item.id)
    );
  }
  return PM_NAV;
}

export function demoHref(product: DemoProductId, surface: string): string {
  return `/demo/${product}/${surface}`;
}

export function defaultDemoSurface(product: DemoProductId, persona: DemoPersona): string {
  const nav = demoNavFor(product, persona);
  return nav[0]?.surface ?? "mission-control";
}
