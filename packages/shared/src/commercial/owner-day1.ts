/**
 * Owner Day-1 activation — presentation model only.
 * Extends Guided Setup / Mission Control / Launcher first-run guidance.
 * Does not change RBAC, entitlements, Stripe, or persistence.
 */

import type { ProductSku } from "./skus";

export type OwnerDay1ChecklistItem = {
  id: string;
  label: string;
  href: string;
  detail: string;
};

export type OwnerDay1Checklist = {
  productSku: ProductSku;
  title: string;
  intro: string;
  successLooksLike: string;
  items: OwnerDay1ChecklistItem[];
};

/** Organization Admin identity copy for claim / Guided Setup. */
export const ORGANIZATION_ADMIN_CLARITY = {
  headline: "You are the Organization Admin",
  summary:
    "You own this organization’s operating environment — not a resident, vendor, or day-to-day employee seat.",
  manages: [
    "Properties, buildings, and sites",
    "Team access and invitations",
    "Operational setup",
    "Workflows"
  ],
  notThese: ["A resident", "A vendor technician", "An employee-only user"]
} as const;

export function ownerDay1ChecklistForSku(productSku: ProductSku): OwnerDay1Checklist {
  switch (productSku) {
    case "mpa_facility_operations":
      return {
        productSku,
        title: "Day 1 — Facility Operations",
        intro:
          "Activate your facility operation: one building or site, your technicians, then the first work order through completion.",
        successLooksLike:
          "Success today: a building on file, a teammate invited, and one facility work order assigned or completed.",
        items: [
          {
            id: "fo_building",
            label: "Add first building or site",
            href: "/facility/assets",
            detail: "Create the place facility work will reference."
          },
          {
            id: "fo_invite",
            label: "Invite technicians",
            href: "/settings/team",
            detail: "Give Maintenance Technicians access to execute facility work."
          },
          {
            id: "fo_vendors",
            label: "Add facility vendors",
            href: "/facility/vendors",
            detail:
              "Add HVAC, plumbing, or contractor contacts so Operations can assign external work."
          },
          {
            id: "fo_work_order",
            label: "Create first work order",
            href: "/facility/operations",
            detail: "Open Operations and create corrective facility work."
          },
          {
            id: "fo_assign",
            label: "Assign work",
            href: "/facility/operations",
            detail:
              "Assign to a technician or a facility vendor from your Vendors directory."
          },
          {
            id: "fo_complete",
            label: "Complete first operational workflow",
            href: "/facility/operations",
            detail: "Start → progress → complete (or cancel) one facility work order."
          }
        ]
      };
    case "mpa_complete_platform":
      return {
        productSku,
        title: "Day 1 — Complete Platform",
        intro:
          "Manage property operations and facility operations from one organization. Start with a shared property/site record, then open each workspace.",
        successLooksLike:
          "Success today: one property/site, both workspaces reviewed, teammates invited, and one operational workflow started.",
        items: [
          {
            id: "cp_property",
            label: "Add first property or site",
            href: "/pm/properties?new=1",
            detail: "One record supports leasing and facility work."
          },
          {
            id: "cp_pm",
            label: "Review Property Operations",
            href: "/pm/mission-control",
            detail: "Open Mission Control for residents, leasing, and property maintenance."
          },
          {
            id: "cp_fo",
            label: "Review Facility Operations",
            href: "/facility/mission-control",
            detail: "Open Facility Mission Control for buildings and facility work orders."
          },
          {
            id: "cp_invite",
            label: "Invite team members",
            href: "/settings/team",
            detail: "Invite Organization Admins, managers, and technicians as needed."
          },
          {
            id: "cp_workflow",
            label: "Create first operational workflow",
            href: "/pm/mission-control",
            detail: "Start a property or facility workflow from the matching workspace."
          }
        ]
      };
    case "mpa_property_manager":
    default:
      return {
        productSku,
        title: "Day 1 — Property Manager",
        intro:
          "Activate your property operation: first property and units, then team, residents, and a first workflow.",
        successLooksLike:
          "Success today: a property with units, teammates invited, and a path to residents and maintenance.",
        items: [
          {
            id: "pm_property",
            label: "Add first property",
            href: "/pm/properties?new=1",
            detail: "Create and activate a property to unlock daily operations."
          },
          {
            id: "pm_units",
            label: "Manage units",
            href: "/pm/properties",
            detail:
              "Open a property to add, edit, or archive units, then continue to residents and leasing."
          },
          {
            id: "pm_invite",
            label: "Invite team members",
            href: "/settings/team",
            detail: "Invite Property Managers, leasing, and maintenance roles."
          },
          {
            id: "pm_residents",
            label: "Add residents",
            href: "/pm/residents",
            detail: "Resident records unlock leasing and maintenance communication."
          },
          {
            id: "pm_workflow",
            label: "Create first workflow",
            href: "/pm/maintenance",
            detail: "Open maintenance or leasing and run one end-to-end workflow."
          }
        ]
      };
  }
}

export type OwnerEmptyStateCopy = {
  title: string;
  description: string;
};

/** Critical empty-state copy: what / why / next. */
export function ownerEmptyStateCopy(
  area: "residents" | "maintenance" | "fo_operations" | "finance" | "fo_assets"
): OwnerEmptyStateCopy {
  switch (area) {
    case "residents":
      return {
        title: "No residents yet",
        description:
          "Resident records are who lives in your units. They unlock leasing context and maintenance communication. Add your first resident to continue."
      };
    case "maintenance":
      return {
        title: "No maintenance requests yet",
        description:
          "This queue is where property maintenance is created, assigned, and completed. Create a request yourself, or add residents so they can submit work."
      };
    case "fo_operations":
      return {
        title: "No facility work yet",
        description:
          "Facility Operations tracks corrective work against buildings and sites. Add a building in Assets if needed, then create your first work order here."
      };
    case "finance":
      return {
        title: "Financial records appear after leases",
        description:
          "Charges, payments, and collections show here once properties, units, and leases exist. Create a property and lease to begin resident billing."
      };
    case "fo_assets":
      return {
        title: "No assets yet",
        description:
          "Register equipment against a facility site. Add an asset to track location, lifecycle, and work history."
      };
    default:
      return { title: "Nothing here yet", description: "Add your first record to continue." };
  }
}
