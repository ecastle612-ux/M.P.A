import { effectiveSurfaces, type MemberOperatingScope } from "../auth/operating-scope";
import { hasEntitlement } from "../commercial/entitlements";
import { type ProductSku } from "../commercial/skus";
import type { ExecutivePersona, ReportArea } from "./schemas";
import { EXECUTIVE_PERSONAS, REPORT_AREAS } from "./schemas";

export const SHARED_REPORT_STAFF_ROLES = [
  "organization_admin",
  "property_manager",
  "leasing_agent",
  "maintenance_technician"
] as const;

export const SHARED_REPORT_PORTAL_ROLES = ["tenant", "vendor", "property_owner"] as const;

/** Property Manager product areas. Finance is added only when entitled + permitted. */
export const PM_REPORT_AREAS = [
  "property_operations",
  "resident_experience",
  "maintenance",
  "vendors",
  "documents",
  "commercial",
  "platform_health"
] as const satisfies readonly ReportArea[];

/** Facility Operations product areas. No residents, PM-only ops, or finance. */
export const FO_REPORT_AREAS = [
  "facility_operations",
  "maintenance",
  "assets",
  "compliance",
  "vendors",
  "documents"
] as const satisfies readonly ReportArea[];

export type ReportWorkSurfaceFilter = "residential" | "facility" | "union";

export type AuthorizedReportShape = {
  allowed: boolean;
  denyReason: "portal_role" | "no_staff_role" | "no_sku" | "technician_denied" | null;
  persona: ExecutivePersona | null;
  allowedPersonas: readonly ExecutivePersona[];
  areas: readonly ReportArea[];
  loadFinance: boolean;
  loadPropertyFacts: boolean;
  loadResidentFacts: boolean;
  loadFacilityFacts: boolean;
  workSurface: ReportWorkSurfaceFilter | null;
};

export type ResolveAuthorizedReportShapeInput = {
  roles: readonly string[];
  sku: ProductSku | null;
  entitlements: readonly string[];
  capabilities: readonly string[];
  personaOverride?: string | null;
  areaOverride?: string | null;
  storedScope?: MemberOperatingScope | null | undefined;
};

function uniqueAreas(areas: readonly ReportArea[]): ReportArea[] {
  return [...new Set(areas)];
}

function isExecutivePersona(value: string | null | undefined): value is ExecutivePersona {
  return Boolean(value && (EXECUTIVE_PERSONAS as readonly string[]).includes(value));
}

function isReportArea(value: string | null | undefined): value is ReportArea {
  return Boolean(value && (REPORT_AREAS as readonly string[]).includes(value));
}

function deny(
  reason: NonNullable<AuthorizedReportShape["denyReason"]>
): AuthorizedReportShape {
  return {
    allowed: false,
    denyReason: reason,
    persona: null,
    allowedPersonas: [],
    areas: [],
    loadFinance: false,
    loadPropertyFacts: false,
    loadResidentFacts: false,
    loadFacilityFacts: false,
    workSurface: null
  };
}

function hasStaffRole(roles: readonly string[]): boolean {
  return roles.some((role) =>
    (SHARED_REPORT_STAFF_ROLES as readonly string[]).includes(role)
  );
}

function hasOnlyPortalRole(roles: readonly string[]): boolean {
  const portal = roles.some((role) =>
    (SHARED_REPORT_PORTAL_ROLES as readonly string[]).includes(role)
  );
  return portal && !hasStaffRole(roles);
}

function isTechnicianOnly(roles: readonly string[]): boolean {
  return (
    roles.includes("maintenance_technician") &&
    !roles.includes("organization_admin") &&
    !roles.includes("property_manager") &&
    !roles.includes("leasing_agent")
  );
}

function canLoadFinanceFacts(
  entitlements: readonly string[],
  capabilities: readonly string[]
): boolean {
  return (
    hasEntitlement(entitlements, "pm.financial_operations") &&
    capabilities.includes("pm.finance:reports.read")
  );
}

function areasForResolvedPersona(input: {
  persona: ExecutivePersona;
  includesPm: boolean;
  includesFo: boolean;
  loadFinance: boolean;
}): ReportArea[] {
  if (input.persona === "facility_manager") {
    return [...FO_REPORT_AREAS];
  }

  if (input.persona === "property_manager") {
    const areas: ReportArea[] = [
      "property_operations",
      "maintenance",
      "resident_experience",
      "vendors",
      "documents"
    ];
    if (input.loadFinance) {
      areas.push("financial_performance");
    }
    return areas;
  }

  if (input.persona === "organization_owner") {
    const areas: ReportArea[] = [
      "property_operations",
      "resident_experience",
      "commercial",
      "documents",
      "platform_health",
      "maintenance",
      "vendors"
    ];
    if (input.loadFinance) {
      areas.push("financial_performance");
    }
    if (input.includesFo) {
      areas.push("facility_operations", "assets", "compliance");
    }
    return uniqueAreas(areas);
  }

  return [];
}

function workSurfaceFor(input: {
  persona: ExecutivePersona;
  includesPm: boolean;
  includesFo: boolean;
}): ReportWorkSurfaceFilter {
  if (input.persona === "facility_manager") {
    return "facility";
  }
  if (input.persona === "property_manager") {
    return "residential";
  }
  if (input.includesPm && input.includesFo) {
    return "union";
  }
  if (input.includesFo) {
    return "facility";
  }
  return "residential";
}

function finalizeShape(input: {
  defaultPersona: ExecutivePersona;
  allowedPersonas: readonly ExecutivePersona[];
  includesPm: boolean;
  includesFo: boolean;
  loadFinance: boolean;
  personaOverride?: string | null | undefined;
  areaOverride?: string | null | undefined;
}): AuthorizedReportShape {
  let persona = input.defaultPersona;
  if (isExecutivePersona(input.personaOverride) && input.allowedPersonas.includes(input.personaOverride)) {
    persona = input.personaOverride;
  }

  const financeForPersona = input.loadFinance && persona !== "facility_manager";
  let areas = areasForResolvedPersona({
    persona,
    includesPm: input.includesPm,
    includesFo: input.includesFo && persona !== "property_manager",
    loadFinance: financeForPersona
  });

  if (input.areaOverride && input.areaOverride !== "all" && isReportArea(input.areaOverride)) {
    if (areas.includes(input.areaOverride)) {
      areas = [input.areaOverride];
    }
  }

  return {
    allowed: true,
    denyReason: null,
    persona,
    allowedPersonas: input.allowedPersonas,
    areas,
    loadFinance: financeForPersona && areas.includes("financial_performance"),
    loadPropertyFacts: areas.includes("property_operations"),
    loadResidentFacts: areas.includes("resident_experience"),
    loadFacilityFacts: areas.some((area) =>
      area === "facility_operations" || area === "assets" || area === "compliance"
    ),
    workSurface: workSurfaceFor({
      persona,
      includesPm: input.includesPm,
      includesFo: input.includesFo
    })
  };
}

/**
 * ADR-032 intersection: allowed report = role/capability ∩ SKU/module.
 * Query-string persona/area may narrow only. They never expand authority.
 */
export function resolveAuthorizedReportShape(
  input: ResolveAuthorizedReportShapeInput
): AuthorizedReportShape {
  if (hasOnlyPortalRole(input.roles)) {
    return deny("portal_role");
  }

  if (!hasStaffRole(input.roles)) {
    return deny("no_staff_role");
  }

  if (!input.sku) {
    return deny("no_sku");
  }

  const surfaces = effectiveSurfaces({
    sku: input.sku,
    roles: input.roles,
    storedScope: input.storedScope
  });
  const includesPm = surfaces.has("property");
  const includesFo = surfaces.has("facility");
  const loadFinance = canLoadFinanceFacts(input.entitlements, input.capabilities);

  if (isTechnicianOnly(input.roles)) {
    if (!includesFo) {
      return deny("technician_denied");
    }
    return finalizeShape({
      defaultPersona: "facility_manager",
      allowedPersonas: ["facility_manager"],
      includesPm: false,
      includesFo: true,
      loadFinance: false,
      personaOverride: input.personaOverride,
      areaOverride: input.areaOverride
    });
  }

  if (includesFo && !includesPm) {
    return finalizeShape({
      defaultPersona: "facility_manager",
      allowedPersonas: ["facility_manager"],
      includesPm: false,
      includesFo: true,
      loadFinance: false,
      personaOverride: input.personaOverride,
      areaOverride: input.areaOverride
    });
  }

  const isAdmin = input.roles.includes("organization_admin");
  const isManager = input.roles.includes("property_manager");

  if (includesPm && includesFo) {
    if (isAdmin) {
      return finalizeShape({
        defaultPersona: "organization_owner",
        allowedPersonas: ["organization_owner", "property_manager", "facility_manager"],
        includesPm: true,
        includesFo: true,
        loadFinance,
        personaOverride: input.personaOverride,
        areaOverride: input.areaOverride
      });
    }
    if (isManager) {
      return finalizeShape({
        defaultPersona: "property_manager",
        allowedPersonas: ["property_manager", "facility_manager"],
        includesPm: true,
        includesFo: true,
        loadFinance,
        personaOverride: input.personaOverride,
        areaOverride: input.areaOverride
      });
    }
    return finalizeShape({
      defaultPersona: "property_manager",
      allowedPersonas: ["property_manager"],
      includesPm: true,
      includesFo: false,
      loadFinance: false,
      personaOverride: input.personaOverride,
      areaOverride: input.areaOverride
    });
  }

  if (isAdmin) {
    return finalizeShape({
      defaultPersona: "organization_owner",
      allowedPersonas: ["organization_owner", "property_manager"],
      includesPm: true,
      includesFo: false,
      loadFinance,
      personaOverride: input.personaOverride,
      areaOverride: input.areaOverride
    });
  }

  if (isManager) {
    return finalizeShape({
      defaultPersona: "property_manager",
      allowedPersonas: ["property_manager"],
      includesPm: true,
      includesFo: false,
      loadFinance,
      personaOverride: input.personaOverride,
      areaOverride: input.areaOverride
    });
  }

  return finalizeShape({
    defaultPersona: "property_manager",
    allowedPersonas: ["property_manager"],
    includesPm: true,
    includesFo: false,
    loadFinance: false,
    personaOverride: input.personaOverride,
    areaOverride: input.areaOverride
  });
}
