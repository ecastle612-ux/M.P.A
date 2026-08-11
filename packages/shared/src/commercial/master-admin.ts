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
 * MA-6 primary surfaces: Overview · Organizations · Users · Subscriptions · Capacity ·
 * Checkout / Provisioning · Webhooks · Operations · Audit Log · Errors.
 * Existing Owner Ops routes remain (already shipping) — no unfinished MA-7+ placeholders.
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
        href: "/admin/platform/organizations",
        label: "Organizations",
        description: "Organization directory and diagnostic detail."
      },
      {
        href: "/admin/users",
        label: "Users",
        description: "Platform users, memberships, and roles (read-only)."
      },
      {
        href: "/admin/subscriptions",
        label: "Subscriptions",
        description: "Fleet commercial state, entitlements, and Stripe linkage (read-only)."
      },
      {
        href: "/admin/capacity",
        label: "Capacity",
        description: "Unit-volume capacity and reconciliation (read-only)."
      },
      {
        href: "/admin/checkout",
        label: "Checkout / Provisioning",
        description: "Acquisition pipeline: checkout, payment, provisioning (read-only)."
      },
      {
        href: "/admin/webhooks",
        label: "Webhooks",
        description: "Stripe + SignWell webhook health (read-only, no replay)."
      },
      {
        href: "/admin/operations",
        label: "Operations",
        description: "Platform-wide work orders, properties, vendors, and notification health."
      },
      {
        href: "/admin/audit",
        label: "Audit Log",
        description: "Who did what, where, when, with what result."
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
        href: "/admin/platform/customers",
        label: "Customers",
        description: "Legacy membership directory (also covered by Users)."
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
