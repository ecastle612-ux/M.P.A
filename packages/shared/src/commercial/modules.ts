import type { EntitlementKey } from "./entitlements";
import type { ProductSku } from "./skus";
import type { UserRole } from "../types/roles";
import { entitlementsForSku } from "./entitlements";
import { skuIncludesFacilityOperations, skuIncludesPropertyManager } from "./skus";
import {
  missionControlNavLabelForSku,
  navigationGroupTitleForSku
} from "./complete-launcher";

/** Staff nav hrefs a role may see. Managers see every SKU-entitled item. */
const STAFF_NAV_HREFS_BY_ROLE: Record<UserRole, readonly string[] | "all"> = {
  organization_admin: "all",
  property_manager: "all",
  leasing_agent: [
    "/launcher",
    "/setup",
    "/pm/mission-control",
    "/pm/properties",
    "/pm/residents",
    "/pm/leasing",
    "/shared/documents",
    "/shared/reports",
    "/shared/communications",
    "/settings/organization"
  ],
  maintenance_technician: [
    "/launcher",
    "/setup",
    "/pm/mission-control",
    "/pm/properties",
    "/pm/maintenance",
    "/facility/mission-control",
    "/facility/operations",
    "/facility/assets",
    "/facility/preventive-maintenance",
    "/facility/inspections",
    "/facility/safety",
    "/facility/compliance",
    "/facility/inventory",
    "/facility/parts",
    "/facility/building-systems",
    "/shared/documents",
    "/shared/reports",
    "/shared/communications",
    "/settings/organization"
  ],
  property_owner: [],
  tenant: [],
  vendor: []
};

function roleAllowsNavHref(roles: readonly UserRole[], href: string): boolean {
  if (roles.length === 0) {
    return true;
  }
  let allowAll = false;
  const allowed = new Set<string>();
  for (const role of roles) {
    const entry = STAFF_NAV_HREFS_BY_ROLE[role];
    if (entry === "all") {
      allowAll = true;
      break;
    }
    for (const item of entry) {
      allowed.add(item);
    }
  }
  if (allowAll) {
    return true;
  }
  // Portal-only memberships should not be in the staff shell; keep SKU nav rather than blank.
  if (allowed.size === 0) {
    return true;
  }
  return allowed.has(href);
}

export type ModuleOwner = "property_manager" | "facility_operations" | "shared_platform" | "master_admin";

/** Architectural readiness for Phase 1 alignment — not business feature completeness. */
export type ModuleReadiness = "aligned" | "planned";

export type CommercialModule = {
  id: string;
  label: string;
  owner: ModuleOwner;
  entitlement: EntitlementKey | null;
  href: string;
  readiness: ModuleReadiness;
  description: string;
  /** Shown in Master Admin even when deferred. */
  plannedLabel?: string;
};

export const COMMERCIAL_MODULES: readonly CommercialModule[] = [
  {
    id: "organizations",
    label: "Organizations",
    owner: "shared_platform",
    entitlement: "platform.org",
    href: "/settings/organization",
    readiness: "aligned",
    description: "Company, team, and membership foundation."
  },
  {
    id: "documents",
    label: "Documents",
    owner: "shared_platform",
    entitlement: "platform.documents",
    href: "/shared/documents",
    readiness: "aligned",
    description:
      "Document Intelligence Center — one library, many relationships, search, preview, versions, and professional PDF export."
  },
  {
    id: "reports",
    label: "Reporting & Analytics",
    owner: "shared_platform",
    entitlement: "platform.reports",
    href: "/shared/reports",
    readiness: "aligned",
    description:
      "Executive intelligence layer — insights first, decision-ready reports across property, facility, finance, documents, and commercial."
  },
  {
    id: "communications",
    label: "Communications",
    owner: "shared_platform",
    entitlement: "platform.communications",
    href: "/shared/communications",
    readiness: "aligned",
    description: "Shared messages and notifications for residents, owners, and vendors."
  },
  {
    id: "pm_mission_control",
    label: "Mission Control",
    owner: "property_manager",
    entitlement: "pm.mission_control",
    href: "/pm/mission-control",
    readiness: "aligned",
    description: "Property Manager attention home."
  },
  {
    id: "properties",
    label: "Properties",
    owner: "property_manager",
    entitlement: "pm.properties",
    href: "/pm/properties",
    readiness: "aligned",
    description: "Portfolio properties and units — create via Properties (J1)."
  },
  {
    id: "residents",
    label: "Residents",
    owner: "property_manager",
    entitlement: "pm.residents",
    href: "/pm/residents",
    readiness: "aligned",
    description: "Resident operational records."
  },
  {
    id: "leasing",
    label: "Leasing",
    owner: "property_manager",
    entitlement: "pm.leasing",
    href: "/pm/leasing",
    readiness: "aligned",
    description: "Vacancy-to-lease pipeline."
  },
  {
    id: "maintenance",
    label: "Maintenance",
    owner: "property_manager",
    entitlement: "pm.maintenance",
    href: "/pm/maintenance",
    readiness: "aligned",
    description: "Residential / unit maintenance — not Facility Operations."
  },
  {
    id: "vendors",
    label: "Vendors",
    owner: "property_manager",
    entitlement: "pm.vendors",
    href: "/pm/vendors",
    readiness: "aligned",
    description: "Vendor desk and marketplace consumption."
  },
  {
    id: "financial_operations",
    label: "Financial Operations",
    owner: "property_manager",
    entitlement: "pm.financial_operations",
    href: "/pm/financial-operations",
    readiness: "aligned",
    description: "Resident billing & rent collection Command Center (S1).",
    plannedLabel: "S1 Resident Billing complete — vendor AP / late fees pending later slices"
  },
  {
    id: "facility_mission_control",
    label: "Mission Control",
    owner: "facility_operations",
    entitlement: "facility.mission_control",
    href: "/facility/mission-control",
    readiness: "aligned",
    description: "Facility Operations attention home."
  },
  {
    id: "facility_operations",
    label: "Facility Operations",
    owner: "facility_operations",
    entitlement: "facility.operations",
    href: "/facility/operations",
    readiness: "aligned",
    description: "Create, assign, start, progress, complete, and cancel facility work orders.",
  },
  {
    id: "facility_vendors",
    label: "Vendors",
    owner: "facility_operations",
    entitlement: "facility.operations",
    href: "/facility/vendors",
    readiness: "aligned",
    description:
      "Facility vendor directory for HVAC, plumbing, electrical, and contractors — assign from Operations."
  },
  {
    id: "assets",
    label: "Buildings & Sites",
    owner: "facility_operations",
    entitlement: "facility.assets",
    href: "/facility/assets",
    readiness: "aligned",
    description: "Building and site records used as context for facility work orders.",
  },
  {
    id: "inventory",
    label: "Inventory Work",
    owner: "facility_operations",
    entitlement: "facility.inventory",
    href: "/facility/inventory",
    readiness: "aligned",
    description: "Facility work orders categorized for inventory and materials tasks.",
  },
  {
    id: "parts",
    label: "Parts Work",
    owner: "facility_operations",
    entitlement: "facility.parts",
    href: "/facility/parts",
    readiness: "aligned",
    description: "Facility work orders categorized for parts-related tasks.",
  },
  {
    id: "preventive_maintenance",
    label: "Preventive Work",
    owner: "facility_operations",
    entitlement: "facility.preventive",
    href: "/facility/preventive-maintenance",
    readiness: "aligned",
    description: "Facility work orders categorized for preventive maintenance tasks.",
  },
  {
    id: "inspections",
    label: "Inspection Work",
    owner: "facility_operations",
    entitlement: "facility.inspections",
    href: "/facility/inspections",
    readiness: "aligned",
    description: "Facility work orders categorized for inspection tasks.",
  },
  {
    id: "safety",
    label: "Safety Work",
    owner: "facility_operations",
    entitlement: "facility.safety",
    href: "/facility/safety",
    readiness: "aligned",
    description: "Facility work orders categorized for safety tasks.",
  },
  {
    id: "compliance",
    label: "Compliance Work",
    owner: "facility_operations",
    entitlement: "facility.compliance",
    href: "/facility/compliance",
    readiness: "aligned",
    description: "Facility work orders categorized for compliance tasks.",
  },
  {
    id: "building_systems",
    label: "Building Systems Work",
    owner: "facility_operations",
    entitlement: "facility.building_systems",
    href: "/facility/building-systems",
    readiness: "aligned",
    description: "Facility work orders categorized for building-systems tasks.",
  },
  {
    id: "capital_projects",
    label: "Capital Projects",
    owner: "facility_operations",
    entitlement: "facility.capital_projects",
    href: "/facility/capital-projects",
    readiness: "planned",
    description: "Future capital planning.",
    plannedLabel: "Future — intentionally deferred"
  }
] as const;

export type NavItem = {
  href: string;
  label: string;
  readiness: ModuleReadiness;
  entitlement: EntitlementKey | null;
};

export type NavGroup = {
  id: string;
  title: string;
  product: "launcher" | "property_manager" | "facility_operations" | "shared" | "account";
  items: NavItem[];
};

export function modulesForSku(sku: ProductSku | null): CommercialModule[] {
  if (!sku) {
    return COMMERCIAL_MODULES.filter((module) => module.owner === "shared_platform");
  }
  const entitlements = new Set(entitlementsForSku(sku));
  return COMMERCIAL_MODULES.filter((module) => {
    if (module.id === "capital_projects") {
      return false;
    }
    if (!module.entitlement) {
      return true;
    }
    return entitlements.has(module.entitlement);
  });
}

export function navigationGroupsForSku(
  sku: ProductSku | null,
  roles: readonly UserRole[] = []
): NavGroup[] {
  const entitlements = new Set(
    sku
      ? entitlementsForSku(sku)
      : ["platform.guided_setup", "platform.billing_self", "platform.org", "platform.launcher"]
  );

  const isComplete = sku === "mpa_complete_platform";
  const groups: NavGroup[] = [
    {
      id: "home",
      title: navigationGroupTitleForSku("home", sku) ?? "Home",
      product: "launcher",
      items: [
        {
          href: "/launcher",
          label: isComplete ? "Start here" : "Workspace Launcher",
          readiness: "aligned",
          entitlement: "platform.launcher"
        },
        { href: "/setup", label: "Guided Setup", readiness: "aligned", entitlement: "platform.guided_setup" }
      ]
    }
  ];

  if (sku && skuIncludesPropertyManager(sku)) {
    groups.push({
      id: "property_manager",
      title: navigationGroupTitleForSku("property_manager", sku) ?? "Property Manager",
      product: "property_manager",
      items: [
        {
          href: "/pm/mission-control",
          label: missionControlNavLabelForSku("property", sku),
          readiness: "aligned",
          entitlement: "pm.mission_control"
        },
        { href: "/pm/properties", label: "Properties", readiness: "aligned", entitlement: "pm.properties" },
        { href: "/pm/residents", label: "Residents", readiness: "aligned", entitlement: "pm.residents" },
        { href: "/pm/leasing", label: "Leasing", readiness: "aligned", entitlement: "pm.leasing" },
        { href: "/pm/maintenance", label: "Maintenance", readiness: "aligned", entitlement: "pm.maintenance" },
        { href: "/pm/vendors", label: "Vendors", readiness: "aligned", entitlement: "pm.vendors" },
        {
          href: "/pm/financial-operations",
          label: "Financial Operations",
          readiness: "aligned",
          entitlement: "pm.financial_operations"
        }
      ]
    });
  }

  if (sku && skuIncludesFacilityOperations(sku)) {
    groups.push({
      id: "facility_operations",
      title: navigationGroupTitleForSku("facility_operations", sku) ?? "Facility Operations",
      product: "facility_operations",
      items: [
        {
          href: "/facility/mission-control",
          label: missionControlNavLabelForSku("facility", sku),
          readiness: "aligned",
          entitlement: "facility.mission_control"
        },
        {
          href: "/facility/operations",
          label: "Operations",
          readiness: "aligned",
          entitlement: "facility.operations"
        },
        {
          href: "/facility/vendors",
          label: "Vendors",
          readiness: "aligned",
          entitlement: "facility.operations"
        },
        {
          href: "/facility/assets",
          label: "Buildings & Sites",
          readiness: "aligned",
          entitlement: "facility.assets"
        },
        {
          href: "/facility/preventive-maintenance",
          label: "Preventive Work",
          readiness: "aligned",
          entitlement: "facility.preventive"
        },
        {
          href: "/facility/inspections",
          label: "Inspection Work",
          readiness: "aligned",
          entitlement: "facility.inspections"
        },
        {
          href: "/facility/safety",
          label: "Safety Work",
          readiness: "aligned",
          entitlement: "facility.safety"
        },
        {
          href: "/facility/compliance",
          label: "Compliance Work",
          readiness: "aligned",
          entitlement: "facility.compliance"
        },
        {
          href: "/facility/inventory",
          label: "Inventory Work",
          readiness: "aligned",
          entitlement: "facility.inventory"
        },
        {
          href: "/facility/parts",
          label: "Parts Work",
          readiness: "aligned",
          entitlement: "facility.parts"
        },
        {
          href: "/facility/building-systems",
          label: "Building Systems Work",
          readiness: "aligned",
          entitlement: "facility.building_systems"
        }
      ]
    });
  }

  groups.push({
    id: "shared",
    title: navigationGroupTitleForSku("shared", sku) ?? "Shared Platform",
    product: "shared",
    items: [
      { href: "/shared/documents", label: "Documents", readiness: "aligned", entitlement: "platform.documents" },
      {
        href: "/shared/reports",
        label: "Reporting & Analytics",
        readiness: "aligned",
        entitlement: "platform.reports"
      },
      {
        href: "/shared/communications",
        label: "Communications",
        readiness: "aligned",
        entitlement: "platform.communications"
      },
      { href: "/billing", label: "Billing & Plan", readiness: "aligned", entitlement: "platform.billing_self" },
      { href: "/settings/organization", label: "Organization", readiness: "aligned", entitlement: "platform.org" },
      { href: "/settings/team", label: "Team", readiness: "aligned", entitlement: "platform.org" }
    ]
  });

  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        // Nav only ships live workflows — never tease unfinished modules.
        if (item.readiness === "planned") {
          return false;
        }
        if (item.entitlement && !entitlements.has(item.entitlement)) {
          return false;
        }
        return roleAllowsNavHref(roles, item.href);
      })
    }))
    .filter((group) => group.items.length > 0);
}

export type WorkspaceLauncherItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  product: "property_manager" | "facility_operations" | "shared" | "setup";
  readiness: ModuleReadiness;
};

export function workspaceLauncherItemsForSku(sku: ProductSku | null): WorkspaceLauncherItem[] {
  if (!sku) {
    return [
      {
        id: "setup",
        title: "Guided Setup",
        description: "Choose your commercial product and activate your organization.",
        href: "/setup",
        product: "setup",
        readiness: "aligned"
      },
      {
        id: "billing",
        title: "Billing & Plan",
        description: "See Property Manager, Facility Operations, and Complete Platform.",
        href: "/billing",
        product: "shared",
        readiness: "aligned"
      }
    ];
  }

  const items: WorkspaceLauncherItem[] = [
    {
      id: "launcher_home",
      title: "Workspace Launcher",
      description: "Jump to the correct product home for your subscription.",
      href: "/launcher",
      product: "shared",
      readiness: "aligned"
    }
  ];

  const complete = sku === "mpa_complete_platform";

  if (skuIncludesPropertyManager(sku)) {
    items.push(
      {
        id: "pm_mc",
        title: complete ? "Property Operations" : "Mission Control",
        description: complete
          ? "Portfolio attention home — properties, residents, leasing, and residential maintenance."
          : "Attention home for properties, leasing, maintenance, and vendors.",
        href: "/pm/mission-control",
        product: "property_manager",
        readiness: "aligned"
      },
      {
        id: "pm_leasing",
        title: "Leasing Pipeline",
        description: complete
          ? "Vacancy-to-lease work in Property Operations."
          : "Property Manager workspace for vacancy-to-lease work.",
        href: "/pm/leasing",
        product: "property_manager",
        readiness: "aligned"
      },
      {
        id: "pm_maintenance",
        title: "Maintenance Triage",
        description: complete
          ? "Residential maintenance inside Property Operations."
          : "Residential maintenance — not Facility Operations.",
        href: "/pm/maintenance",
        product: "property_manager",
        readiness: "aligned"
      },
      {
        id: "pm_financial_operations",
        title: "Financial Operations",
        description: "Resident billing & rent collection Command Center (S1).",
        href: "/pm/financial-operations",
        product: "property_manager",
        readiness: "aligned"
      }
    );
  }

  if (skuIncludesFacilityOperations(sku)) {
    items.push({
      id: "fac_mc",
      title: complete ? "Facility Operations" : "Mission Control",
      description: complete
        ? "Facility attention home — buildings, work orders, preventive maintenance, and systems."
        : "Attention home for facility, assets, and building operations.",
      href: "/facility/mission-control",
      product: "facility_operations",
      readiness: "aligned"
    });
  }

  items.push(
    {
      id: "docs",
      title: "Documents",
      description: "Shared platform documents.",
      href: "/shared/documents",
      product: "shared",
      readiness: "aligned"
    },
    {
      id: "reports",
      title: "Reporting & Analytics",
      description: "Executive insights and decision-ready reports.",
      href: "/shared/reports",
      product: "shared",
      readiness: "aligned"
    },
    {
      id: "billing",
      title: "Billing & Plan",
      description: "Your commercial product and what Complete Platform adds.",
      href: "/billing",
      product: "shared",
      readiness: "aligned"
    },
    {
      id: "setup",
      title: "Guided Setup",
      description: "Product-aware onboarding checklist.",
      href: "/setup",
      product: "setup",
      readiness: "aligned"
    }
  );

  return items;
}

export type UpgradeCue = {
  moduleLabel: string;
  requires: "Complete Platform" | "Property Manager" | "Facility Operations";
  reason: string;
};

export function upgradeCuesForSku(sku: ProductSku | null): UpgradeCue[] {
  if (!sku) {
    return [
      {
        moduleLabel: "All product modules",
        requires: "Property Manager",
        reason: "Select a commercial product in Guided Setup to unlock modules."
      }
    ];
  }

  if (sku === "mpa_complete_platform") {
    // Version 1.0: no upgrade cues that advertise unavailable modules.
    return [];
  }

  if (sku === "mpa_property_manager") {
    return [
      {
        moduleLabel:
          "Facility Mission Control, Operations, Buildings & Sites, and facility work-order categories (preventive, inspection, safety, compliance, inventory, parts, building systems)",
        requires: "Complete Platform",
        reason: "These Facility Operations workflows belong to FO. Complete Platform includes both products."
      }
    ];
  }

  return [
    {
      moduleLabel: "Properties, Residents, Leasing, Maintenance, Vendors, Financial Operations, Owner/Tenant portals",
      requires: "Complete Platform",
      reason: "These modules belong to Property Manager. Complete Platform includes both products."
    }
  ];
}
