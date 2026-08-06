import type { EntitlementKey } from "./entitlements";
import type { ProductSku } from "./skus";
import { entitlementsForSku } from "./entitlements";
import { skuIncludesFacilityOperations, skuIncludesPropertyManager } from "./skus";

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
    description: "Shared document surface (alignment shell)."
  },
  {
    id: "communications",
    label: "Communications",
    owner: "shared_platform",
    entitlement: "platform.communications",
    href: "/shared/communications",
    readiness: "aligned",
    description: "Shared communications surface (alignment shell)."
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
    description: "Portfolio properties and units."
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
    readiness: "planned",
    description: "Rent, charges, and collections.",
    plannedLabel: "Included in Property Manager — implementation deferred"
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
    readiness: "planned",
    description: "Facility corrective operations.",
    plannedLabel: "Included in Facility Operations — not yet implemented"
  },
  {
    id: "assets",
    label: "Assets",
    owner: "facility_operations",
    entitlement: "facility.assets",
    href: "/facility/assets",
    readiness: "planned",
    description: "Asset registry.",
    plannedLabel: "Included in Facility Operations — not yet implemented"
  },
  {
    id: "inventory",
    label: "Inventory",
    owner: "facility_operations",
    entitlement: "facility.inventory",
    href: "/facility/inventory",
    readiness: "planned",
    description: "Storerooms and counts.",
    plannedLabel: "Included in Facility Operations — not yet implemented"
  },
  {
    id: "parts",
    label: "Parts",
    owner: "facility_operations",
    entitlement: "facility.parts",
    href: "/facility/parts",
    readiness: "planned",
    description: "Parts catalog and usage.",
    plannedLabel: "Included in Facility Operations — not yet implemented"
  },
  {
    id: "preventive_maintenance",
    label: "Preventive Maintenance",
    owner: "facility_operations",
    entitlement: "facility.preventive",
    href: "/facility/preventive-maintenance",
    readiness: "planned",
    description: "Preventive schedules on assets/systems.",
    plannedLabel: "Included in Facility Operations — not yet implemented"
  },
  {
    id: "inspections",
    label: "Inspections",
    owner: "facility_operations",
    entitlement: "facility.inspections",
    href: "/facility/inspections",
    readiness: "planned",
    description: "Facility and building inspection programs.",
    plannedLabel: "Included in Facility Operations — not yet implemented"
  },
  {
    id: "safety",
    label: "Safety",
    owner: "facility_operations",
    entitlement: "facility.safety",
    href: "/facility/safety",
    readiness: "planned",
    description: "Safety incidents and protocols.",
    plannedLabel: "Included in Facility Operations — not yet implemented"
  },
  {
    id: "compliance",
    label: "Compliance",
    owner: "facility_operations",
    entitlement: "facility.compliance",
    href: "/facility/compliance",
    readiness: "planned",
    description: "Building and facility compliance programs.",
    plannedLabel: "Included in Facility Operations — not yet implemented"
  },
  {
    id: "building_systems",
    label: "Building Systems",
    owner: "facility_operations",
    entitlement: "facility.building_systems",
    href: "/facility/building-systems",
    readiness: "planned",
    description: "HVAC, electrical, fire, and related systems.",
    plannedLabel: "Included in Facility Operations — not yet implemented"
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

export function navigationGroupsForSku(sku: ProductSku | null): NavGroup[] {
  const entitlements = new Set(sku ? entitlementsForSku(sku) : ["platform.guided_setup", "platform.billing_self", "platform.org"]);

  const groups: NavGroup[] = [
    {
      id: "home",
      title: "Home",
      product: "launcher",
      items: [
        { href: "/launcher", label: "Workspace Launcher", readiness: "aligned", entitlement: "platform.launcher" },
        { href: "/setup", label: "Guided Setup", readiness: "aligned", entitlement: "platform.guided_setup" }
      ]
    }
  ];

  if (sku && skuIncludesPropertyManager(sku)) {
    groups.push({
      id: "property_manager",
      title: "Property Manager",
      product: "property_manager",
      items: [
        { href: "/pm/mission-control", label: "Mission Control", readiness: "aligned", entitlement: "pm.mission_control" },
        { href: "/pm/properties", label: "Properties", readiness: "aligned", entitlement: "pm.properties" },
        { href: "/pm/residents", label: "Residents", readiness: "aligned", entitlement: "pm.residents" },
        { href: "/pm/leasing", label: "Leasing", readiness: "aligned", entitlement: "pm.leasing" },
        { href: "/pm/maintenance", label: "Maintenance", readiness: "aligned", entitlement: "pm.maintenance" },
        { href: "/pm/vendors", label: "Vendors", readiness: "aligned", entitlement: "pm.vendors" },
        {
          href: "/pm/financial-operations",
          label: "Financial Operations",
          readiness: "planned",
          entitlement: "pm.financial_operations"
        }
      ]
    });
  }

  if (sku && skuIncludesFacilityOperations(sku)) {
    groups.push({
      id: "facility_operations",
      title: "Facility Operations",
      product: "facility_operations",
      items: [
        {
          href: "/facility/mission-control",
          label: "Mission Control",
          readiness: "aligned",
          entitlement: "facility.mission_control"
        },
        { href: "/facility/operations", label: "Facility Operations", readiness: "planned", entitlement: "facility.operations" },
        { href: "/facility/assets", label: "Assets", readiness: "planned", entitlement: "facility.assets" },
        { href: "/facility/inventory", label: "Inventory", readiness: "planned", entitlement: "facility.inventory" },
        { href: "/facility/parts", label: "Parts", readiness: "planned", entitlement: "facility.parts" },
        {
          href: "/facility/preventive-maintenance",
          label: "Preventive Maintenance",
          readiness: "planned",
          entitlement: "facility.preventive"
        },
        { href: "/facility/inspections", label: "Inspections", readiness: "planned", entitlement: "facility.inspections" },
        { href: "/facility/safety", label: "Safety", readiness: "planned", entitlement: "facility.safety" },
        { href: "/facility/compliance", label: "Compliance", readiness: "planned", entitlement: "facility.compliance" },
        {
          href: "/facility/building-systems",
          label: "Building Systems",
          readiness: "planned",
          entitlement: "facility.building_systems"
        },
        {
          href: "/facility/capital-projects",
          label: "Capital Projects",
          readiness: "planned",
          entitlement: "facility.capital_projects"
        }
      ]
    });
  }

  groups.push({
    id: "shared",
    title: "Shared Platform",
    product: "shared",
    items: [
      { href: "/shared/documents", label: "Documents", readiness: "aligned", entitlement: "platform.documents" },
      {
        href: "/shared/communications",
        label: "Communications",
        readiness: "aligned",
        entitlement: "platform.communications"
      },
      { href: "/billing", label: "Billing & Plan", readiness: "aligned", entitlement: "platform.billing_self" },
      { href: "/settings/organization", label: "Settings", readiness: "aligned", entitlement: "platform.org" }
    ]
  });

  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (!item.entitlement) {
          return true;
        }
        // Capital projects: show as Planned in Facility/Complete nav for awareness, even if not entitled yet
        if (item.entitlement === "facility.capital_projects" && sku && skuIncludesFacilityOperations(sku)) {
          return true;
        }
        return entitlements.has(item.entitlement);
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

  if (skuIncludesPropertyManager(sku)) {
    items.push(
      {
        id: "pm_mc",
        title: "Property Manager · Mission Control",
        description: "Attention home for properties, leasing, maintenance, and vendors.",
        href: "/pm/mission-control",
        product: "property_manager",
        readiness: "aligned"
      },
      {
        id: "pm_leasing",
        title: "Leasing Pipeline",
        description: "Property Manager workspace for vacancy-to-lease work.",
        href: "/pm/leasing",
        product: "property_manager",
        readiness: "aligned"
      },
      {
        id: "pm_maintenance",
        title: "Maintenance Triage",
        description: "Residential maintenance — not Facility Operations.",
        href: "/pm/maintenance",
        product: "property_manager",
        readiness: "aligned"
      }
    );
  }

  if (skuIncludesFacilityOperations(sku)) {
    items.push(
      {
        id: "fac_mc",
        title: "Facility Operations · Mission Control",
        description: "Attention home for facility, assets, and building operations.",
        href: "/facility/mission-control",
        product: "facility_operations",
        readiness: "aligned"
      },
      {
        id: "fac_assets",
        title: "Asset Registry",
        description: "Facility workspace (planned capability).",
        href: "/facility/assets",
        product: "facility_operations",
        readiness: "planned"
      }
    );
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
    return [
      {
        moduleLabel: "Capital Projects",
        requires: "Complete Platform",
        reason: "Included later as a deferred Facility capability — intentionally planned."
      }
    ];
  }

  if (sku === "mpa_property_manager") {
    return [
      {
        moduleLabel: "Assets, Inventory, Parts, Preventive Maintenance, Facility Inspections, Safety, Compliance, Building Systems",
        requires: "Complete Platform",
        reason: "These modules belong to Facility Operations. Complete Platform includes both products."
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
