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
 * Owner Operations Console navigation.
 *
 * Rule: every item must (1) work today and (2) help the Owner operate the platform.
 * Do not list placeholders, future features, or catalog/demo theater.
 */
export const MASTER_ADMIN_NAV: readonly MasterAdminNavGroup[] = [
  {
    id: "operations",
    title: "Operations",
    items: [
      {
        href: "/admin",
        label: "Command Center",
        description: "Platform health, customer search, and live activity."
      },
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
