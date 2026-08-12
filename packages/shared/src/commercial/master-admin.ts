import { PRODUCT_SKUS } from "./skus";

export type MasterAdminNavItem = {
  href: string;
  label: string;
  description: string;
};

export type MasterAdminNavGroup = {
  id: string;
  title: string;
  items: MasterAdminNavItem[];
};

/**
 * Master Admin / Owner Operations Console navigation.
 *
 * MA-1: Overview + Errors are the Command Center primary surfaces.
 * Existing Owner Ops routes remain (already shipping) — do not add unfinished MA-2+ placeholders.
 */
export const MASTER_ADMIN_NAV: readonly MasterAdminNavGroup[] = [
  {
    id: "master-admin",
    title: "Master Admin",
    items: [
      {
        href: "/admin",
        label: "Overview",
        description: "Is M.P.A. healthy right now? Operational health signals."
      },
      {
        href: "/admin/errors",
        label: "Errors",
        description: "Critical production errors from the durable platform feed."
      }
    ]
  },
  {
    id: "operations",
    title: "Operations",
    items: [
      {
        href: "/admin/support",
        label: "Support Center",
        description: "Customer lookup, invitations, failures, and support workflows."
      },
      {
        href: "/admin/system",
        label: "System Health",
        description: "Production, database, Stripe, email, jobs, and incidents."
      }
    ]
  },
  {
    id: "customers",
    title: "Customers",
    items: [
      {
        href: "/admin/platform/organizations",
        label: "Organizations",
        description: "Organization directory and support profiles."
      },
      {
        href: "/admin/platform/customers",
        label: "Customers",
        description: "Users, memberships, invitations, and profiles."
      },
      {
        href: "/admin/platform/operators",
        label: "Operators",
        description: "Platform operator access list."
      },
      {
        href: "/admin/support/view-as",
        label: "View As",
        description: "Secure read-only impersonation for support diagnosis."
      }
    ]
  },
  {
    id: "commercial",
    title: "Commercial",
    items: [
      {
        href: "/admin/commercial/billing",
        label: "Billing",
        description: "Subscriptions, MRR/ARR, purchases, and Stripe links."
      },
      {
        href: "/admin/commercial/provisioning",
        label: "Provisioning",
        description: "Provisioning checkpoints, retries, and claim recovery."
      },
      {
        href: "/admin/commercial/lifecycle",
        label: "Lifecycle",
        description: "Renewals, grace, payment failures, cancel, reactivate."
      },
      {
        href: "/admin/commercial/subscriptions",
        label: "Subscriptions",
        description: "Inspect and assign organization product SKUs."
      },
      {
        href: "/admin/commercial/checkout",
        label: "Checkout",
        description: "SaaS checkout verification for payment troubleshooting."
      }
    ]
  }
] as const;

export function listCommercialSkuCodes(): readonly string[] {
  return PRODUCT_SKUS;
}
