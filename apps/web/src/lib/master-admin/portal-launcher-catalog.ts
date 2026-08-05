/**
 * UX-016 Slice B — Master Admin Portal Launcher catalog (presentation only).
 * Deep-links + existing portal-test / impersonation entry points. No new routes.
 */

import type { MasterAdminPortal } from "./contracts";

export type PortalLauncherGroupId =
  | "operations"
  | "maintenance"
  | "leasing"
  | "residents"
  | "owners"
  | "accounting"
  | "executive"
  | "support"
  | "internal";

export type PortalLauncherCard = {
  id: string;
  title: string;
  description: string;
  /** Existing product / HQ route for Open Portal */
  openHref: string;
  /** Impersonation Center entry for View As */
  viewAsHref: string;
  /** When set, Launch in Test Mode calls existing portal-test API */
  testModePortal: MasterAdminPortal | null;
  /** Hint shown when Test Mode API is unavailable for this card */
  testModeFallbackLabel: string;
};

export type PortalLauncherGroup = {
  id: PortalLauncherGroupId;
  label: string;
  cards: PortalLauncherCard[];
};

const VIEW_AS = "/master-admin/impersonation";

export const PORTAL_LAUNCHER_GROUPS: PortalLauncherGroup[] = [
  {
    id: "operations",
    label: "Operations",
    cards: [
      {
        id: "organization-admin",
        title: "Organization Admin",
        description: "Org settings, team, billing, and portfolio setup.",
        openHref: "/settings",
        viewAsHref: VIEW_AS,
        testModePortal: null,
        testModeFallbackLabel: "Use View As to impersonate an Organization Admin"
      },
      {
        id: "property-manager",
        title: "Property Manager",
        description: "Operations Command Center and day-to-day portfolio work.",
        openHref: "/dashboard",
        viewAsHref: VIEW_AS,
        testModePortal: "manager",
        testModeFallbackLabel: "Launch Manager portal Test Mode"
      },
      {
        id: "regional-manager",
        title: "Regional Manager",
        description: "Multi-property operations view via the Operations workspace.",
        openHref: "/dashboard",
        viewAsHref: VIEW_AS,
        testModePortal: null,
        testModeFallbackLabel: "Use View As to impersonate a Regional Manager"
      }
    ]
  },
  {
    id: "maintenance",
    label: "Maintenance",
    cards: [
      {
        id: "maintenance-manager",
        title: "Maintenance Manager",
        description: "Work-order queues, vendor assignments, and SLA oversight.",
        openHref: "/maintenance",
        viewAsHref: VIEW_AS,
        testModePortal: null,
        testModeFallbackLabel: "Use View As to impersonate a Maintenance Manager"
      },
      {
        id: "maintenance-technician",
        title: "Maintenance Technician",
        description: "Field job list and assigned work orders.",
        openHref: "/maintenance",
        viewAsHref: VIEW_AS,
        testModePortal: null,
        testModeFallbackLabel: "Use View As to impersonate a Technician"
      },
      {
        id: "vendor",
        title: "Vendor",
        description: "Vendor Directory and assignment surfaces (no Vendor Portal).",
        openHref: "/vendors",
        viewAsHref: VIEW_AS,
        testModePortal: null,
        testModeFallbackLabel: "Use View As for vendor membership users"
      }
    ]
  },
  {
    id: "leasing",
    label: "Leasing",
    cards: [
      {
        id: "leasing-manager",
        title: "Leasing Manager",
        description: "Lease pipeline, renewals, and move-in coordination.",
        openHref: "/leases",
        viewAsHref: VIEW_AS,
        testModePortal: null,
        testModeFallbackLabel: "Use View As to impersonate a Leasing Manager"
      },
      {
        id: "leasing-agent",
        title: "Leasing Agent",
        description: "Applications, tours, and lease preparation.",
        openHref: "/leases",
        viewAsHref: VIEW_AS,
        testModePortal: null,
        testModeFallbackLabel: "Use View As to impersonate a Leasing Agent"
      },
      {
        id: "applicant",
        title: "Applicant",
        description: "Applicant and screening surfaces in leasing.",
        openHref: "/applicants",
        viewAsHref: VIEW_AS,
        testModePortal: null,
        testModeFallbackLabel: "Use View As when an applicant-linked user exists"
      }
    ]
  },
  {
    id: "residents",
    label: "Residents",
    cards: [
      {
        id: "resident",
        title: "Resident",
        description: "Resident portal — payments, maintenance, messages.",
        openHref: "/portal/tenant",
        viewAsHref: VIEW_AS,
        testModePortal: "resident",
        testModeFallbackLabel: "Launch Resident portal Test Mode"
      }
    ]
  },
  {
    id: "owners",
    label: "Owners",
    cards: [
      {
        id: "owner",
        title: "Owner",
        description: "Owner portal — portfolio, statements, approvals.",
        openHref: "/portal/owner",
        viewAsHref: VIEW_AS,
        testModePortal: "owner",
        testModeFallbackLabel: "Launch Owner portal Test Mode"
      }
    ]
  },
  {
    id: "accounting",
    label: "Accounting",
    cards: [
      {
        id: "accounting-manager",
        title: "Accounting Manager",
        description: "Financial operations overview.",
        openHref: "/financials",
        viewAsHref: VIEW_AS,
        testModePortal: null,
        testModeFallbackLabel: "Use View As to impersonate accounting staff"
      },
      {
        id: "accounts-payable",
        title: "Accounts Payable",
        description: "Payables and vendor payment surfaces.",
        openHref: "/financials",
        viewAsHref: VIEW_AS,
        testModePortal: null,
        testModeFallbackLabel: "Use View As to impersonate AP staff"
      },
      {
        id: "accounts-receivable",
        title: "Accounts Receivable",
        description: "Receivables, charges, and collections.",
        openHref: "/financials",
        viewAsHref: VIEW_AS,
        testModePortal: null,
        testModeFallbackLabel: "Use View As to impersonate AR staff"
      }
    ]
  },
  {
    id: "executive",
    label: "Executive",
    cards: [
      {
        id: "executive-dashboard",
        title: "Executive Dashboard",
        description: "Portfolio-level operations summary.",
        openHref: "/dashboard",
        viewAsHref: VIEW_AS,
        testModePortal: null,
        testModeFallbackLabel: "Use View As for executive operators"
      },
      {
        id: "portfolio-dashboard",
        title: "Portfolio Dashboard",
        description: "Properties and portfolio browse.",
        openHref: "/properties",
        viewAsHref: VIEW_AS,
        testModePortal: null,
        testModeFallbackLabel: "Use View As for portfolio operators"
      }
    ]
  },
  {
    id: "support",
    label: "Support",
    cards: [
      {
        id: "support-dashboard",
        title: "Support Dashboard",
        description: "Auth recovery and support tooling.",
        openHref: "/master-admin/recovery",
        viewAsHref: VIEW_AS,
        testModePortal: null,
        testModeFallbackLabel: "Open Impersonation Center for support View As"
      },
      {
        id: "customer-success",
        title: "Customer Success",
        description: "Commercial pipeline and activation health.",
        openHref: "/master-admin/commercial",
        viewAsHref: VIEW_AS,
        testModePortal: null,
        testModeFallbackLabel: "Open Impersonation Center for CS View As"
      },
      {
        id: "platform-operations",
        title: "Platform Operations",
        description: "Mission Control and platform operator home.",
        openHref: "/master-admin",
        viewAsHref: VIEW_AS,
        testModePortal: null,
        testModeFallbackLabel: "Master Admin operates from Mission Control"
      }
    ]
  },
  {
    id: "internal",
    label: "Internal",
    cards: [
      {
        id: "mission-control",
        title: "Mission Control",
        description: "Platform command center.",
        openHref: "/master-admin",
        viewAsHref: VIEW_AS,
        testModePortal: null,
        testModeFallbackLabel: "Already the Master Admin home"
      },
      {
        id: "platform-health",
        title: "Platform Health",
        description: "Table and data health checks.",
        openHref: "/master-admin/health",
        viewAsHref: VIEW_AS,
        testModePortal: null,
        testModeFallbackLabel: "Health is an HQ surface"
      },
      {
        id: "feature-flags",
        title: "Feature Flags",
        description: "Public flags and provider credential presence.",
        openHref: "/master-admin/flags",
        viewAsHref: VIEW_AS,
        testModePortal: null,
        testModeFallbackLabel: "Flags are an HQ surface"
      },
      {
        id: "integrations",
        title: "Integrations",
        description: "Provider connections and delivery posture.",
        openHref: "/settings/integrations",
        viewAsHref: VIEW_AS,
        testModePortal: null,
        testModeFallbackLabel: "Integrations are an HQ surface"
      }
      // MAC-002 — Audit Explorer removed until a real explorer ships (no unfinished capability).
    ]
  }
];

export function listPortalLauncherCards(): PortalLauncherCard[] {
  return PORTAL_LAUNCHER_GROUPS.flatMap((group) => group.cards);
}

export function countPortalLauncherCards(): number {
  return listPortalLauncherCards().length;
}
