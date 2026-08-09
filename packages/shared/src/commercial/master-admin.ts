import { COMMERCIAL_MODULES } from "./modules";
import { SKU_SUMMARIES, PRODUCT_SKUS } from "./skus";

export type MasterAdminNavItem = {
  href: string;
  label: string;
  description: string;
  status: "aligned" | "planned";
};

export type MasterAdminNavGroup = {
  id: string;
  title: string;
  items: MasterAdminNavItem[];
};

/**
 * Master Admin OS navigation — exposes every commercial product and operational
 * workspace. Planned items remain visible so nothing disappears because it is
 * not yet implemented.
 */
export const MASTER_ADMIN_NAV: readonly MasterAdminNavGroup[] = [
  {
    id: "mission_control",
    title: "Mission Control",
    items: [
      {
        href: "/admin",
        label: "Command Center",
        description: "Platform health, commercial pulse, and recent operator activity.",
        status: "aligned"
      },
      {
        href: "/admin/support",
        label: "Support",
        description: "Customer/org lookup, failure timeline, and support notes placeholder.",
        status: "aligned"
      },
      {
        href: "/admin/system",
        label: "System",
        description: "Platform health for Stripe, Supabase, email, jobs, demo, and auth.",
        status: "aligned"
      },
      {
        href: "/admin/launch-readiness",
        label: "Launch Readiness",
        description: "Customer clarity and commercial readiness checks.",
        status: "aligned"
      }
    ]
  },
  {
    id: "products",
    title: "Commercial Products",
    items: [
      {
        href: "/admin/products/property-manager",
        label: "Property Manager",
        description: SKU_SUMMARIES.mpa_property_manager.description,
        status: "aligned"
      },
      {
        href: "/admin/products/facility-operations",
        label: "Facility Operations",
        description: SKU_SUMMARIES.mpa_facility_operations.description,
        status: "aligned"
      },
      {
        href: "/admin/products/complete-platform",
        label: "Complete Platform",
        description: SKU_SUMMARIES.mpa_complete_platform.description,
        status: "aligned"
      }
    ]
  },
  {
    id: "commercial",
    title: "Commercial",
    items: [
      {
        href: "/admin/commercial/catalog",
        label: "Catalog",
        description: "COM-002 offer catalog, motions, limits, and commercial flags.",
        status: "aligned"
      },
      {
        href: "/admin/commercial/checkout",
        label: "Checkout",
        description: "COM-002 Slice C SaaS Checkout verification — payments, webhooks, duplicates.",
        status: "aligned"
      },
      {
        href: "/admin/commercial/provisioning",
        label: "Provisioning",
        description:
          "COM-002 Slice D automatic provisioning — checkpoints, retries, compensation, audit.",
        status: "aligned"
      },
      {
        href: "/admin/commercial/subscriptions",
        label: "Subscriptions",
        description: "Assign and inspect organization SKUs.",
        status: "aligned"
      },
      {
        href: "/admin/commercial/lifecycle",
        label: "Lifecycle",
        description:
          "COM-002 Slice E subscription lifecycle — renewals, grace, failures, cancel, reactivate.",
        status: "aligned"
      },

      {
        href: "/admin/commercial/billing",
        label: "Billing",
        description: "Read-only commercial directory — subscriptions, MRR/ARR, purchases, Stripe links.",
        status: "aligned"
      },
      {
        href: "/admin/commercial/entitlements",
        label: "Entitlements",
        description: "SKU entitlement dictionary and overrides.",
        status: "aligned"
      }
    ]
  },
  {
    id: "platform_admin",
    title: "Platform Administration",
    items: [
      {
        href: "/admin/platform/organizations",
        label: "Organizations",
        description: "Customer organization directory.",
        status: "aligned"
      },
      {
        href: "/admin/platform/customers",
        label: "Customers",
        description: "Memberships, invitations, roles, and setup state.",
        status: "aligned"
      },
      {
        href: "/admin/platform/operators",
        label: "Operators",
        description: "Master Admin operator access.",
        status: "aligned"
      },
      {
        href: "/admin/platform/capability-catalog",
        label: "Capability Catalog",
        description: "Every module across every product.",
        status: "aligned"
      }
    ]
  },
  {
    id: "testing",
    title: "Testing",
    items: [
      {
        href: "/admin/testing/product-matrix",
        label: "Product Matrix",
        description: "Verify SKU → module → entitlement mapping.",
        status: "aligned"
      },
      {
        href: "/admin/testing/demo",
        label: "Live Demo",
        description: "COM-002 Slice B demo verification — products, roles, reset, conversion.",
        status: "aligned"
      },
      {
        href: "/admin/testing/impersonation",
        label: "Impersonation",
        description: "Audited support impersonation (planned controls).",
        status: "planned"
      }
    ]
  },
  {
    id: "workspaces",
    title: "Operational Workspaces",
    // Version 1.0: omit Capital Projects from operator-facing workspace lists.
    items: COMMERCIAL_MODULES.filter((module) => module.id !== "capital_projects").map((module) => ({
      href: `/admin/workspaces/${module.id}`,
      label: `${ownerPrefix(module.owner)} · ${module.label}`,
      description: module.plannedLabel ?? module.description,
      status: module.readiness
    }))
  }
] as const;

function ownerPrefix(owner: string): string {
  switch (owner) {
    case "property_manager":
      return "PM";
    case "facility_operations":
      return "Facility";
    case "shared_platform":
      return "Shared";
    case "master_admin":
      return "Admin";
    default:
      return "Platform";
  }
}

export function listCommercialSkuCodes(): readonly string[] {
  return PRODUCT_SKUS;
}
