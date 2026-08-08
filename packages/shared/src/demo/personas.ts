import type { DemoProductId } from "./products";

/**
 * Demonstration personas — not real accounts.
 * Instant switch; no logout / auth.
 */
export const DEMO_PERSONAS = [
  "property_manager",
  "leasing_agent",
  "maintenance_technician",
  "vendor",
  "resident",
  "owner",
  "facility_manager",
  "facility_technician",
  "executive"
] as const;

export type DemoPersona = (typeof DEMO_PERSONAS)[number];

export function isDemoPersona(value: unknown): value is DemoPersona {
  return typeof value === "string" && (DEMO_PERSONAS as readonly string[]).includes(value);
}

export function toDemoPersonaLabel(persona: DemoPersona): string {
  switch (persona) {
    case "property_manager":
      return "Property Manager";
    case "leasing_agent":
      return "Leasing Agent";
    case "maintenance_technician":
      return "Maintenance Technician";
    case "vendor":
      return "Vendor";
    case "resident":
      return "Resident";
    case "owner":
      return "Owner";
    case "facility_manager":
      return "Facility Manager";
    case "facility_technician":
      return "Technician";
    case "executive":
      return "Executive";
    default:
      return "Demo persona";
  }
}

export function personasForDemoProduct(product: DemoProductId): readonly DemoPersona[] {
  switch (product) {
    case "mpa_property_manager":
      return [
        "property_manager",
        "leasing_agent",
        "maintenance_technician",
        "vendor",
        "resident",
        "owner",
        "executive"
      ];
    case "mpa_facility_operations":
      return ["facility_manager", "facility_technician", "executive"];
    case "mpa_complete_platform":
      return DEMO_PERSONAS;
    default:
      return ["property_manager"];
  }
}

export function defaultPersonaForProduct(product: DemoProductId): DemoPersona {
  switch (product) {
    case "mpa_facility_operations":
      return "facility_manager";
    case "mpa_complete_platform":
      return "executive";
    default:
      return "property_manager";
  }
}

/** Whether persona views a portal-shaped surface vs staff workspace. */
export function isPortalPersona(persona: DemoPersona): boolean {
  return persona === "resident" || persona === "owner" || persona === "vendor";
}

export function isFacilityPersona(persona: DemoPersona): boolean {
  return persona === "facility_manager" || persona === "facility_technician";
}
