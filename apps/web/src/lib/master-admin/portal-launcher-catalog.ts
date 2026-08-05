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
        description:
          "Open: Operations Command Center. Test Mode: simulated manager demo. Role fidelity: View As.",
        openHref: "/dashboard",
        viewAsHref: VIEW_AS,
        testModePortal: "manager",
        testModeFallbackLabel: "Launch Manager portal Test Mode"
      },
      {
        id: "regional-manager",
        title: "Regional Manager",
        description:
          "Open: shared Operations Command Center. Role fidelity requires View As (no distinct regional canvas yet).",
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
        description:
          "Open: shared Maintenance queue. Role fidelity (manager vs tech) requires View As.",
        openHref: "/maintenance",
        viewAsHref: VIEW_AS,
        testModePortal: null,
        testModeFallbackLabel: "Use View As to impersonate a Maintenance Manager"
      },
      {
        id: "maintenance-technician",
        title: "Maintenance Technician",
        description:
          "Open: shared Maintenance queue. Role fidelity requires View As for technician membership.",
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
        description:
          "Open: shared Leases surface. Role fidelity requires View As for leasing managers.",
        openHref: "/leases",
        viewAsHref: VIEW_AS,
        testModePortal: null,
        testModeFallbackLabel: "Use View As to impersonate a Leasing Manager"
      },
      {
        id: "leasing-agent",
        title: "Leasing Agent",
        description:
          "Open: shared Leases surface. Role fidelity requires View As for leasing agents.",
        openHref: "/leases",
        viewAsHref: VIEW_AS,
        testModePortal: null,
        testModeFallbackLabel: "Use View As to impersonate a Leasing Agent"
      },
      {
        id: "applicant",
        title: "Applicant",
        description: "Open: Applicants / screening surface. Role fidelity: View As when linked.",
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
        description:
          "Open: shared Financials workspace. Role fidelity requires View As for accounting staff.",
        openHref: "/financials",
        viewAsHref: VIEW_AS,
        testModePortal: null,
        testModeFallbackLabel: "Use View As to impersonate accounting staff"
      },
      {
        id: "accounts-payable",
        title: "Accounts Payable",
        description:
          "Open: shared Financials workspace. AP-specific fidelity requires View As.",
        openHref: "/financials",
        viewAsHref: VIEW_AS,
        testModePortal: null,
        testModeFallbackLabel: "Use View As to impersonate AP staff"
      },
      {
        id: "accounts-receivable",
        title: "Accounts Receivable",
        description:
          "Open: shared Financials workspace. AR-specific fidelity requires View As.",
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
        description:
          "Open: shared Operations Command Center. Executive-specific canvas not separate yet — use View As.",
        openHref: "/dashboard",
        viewAsHref: VIEW_AS,
        testModePortal: null,
        testModeFallbackLabel: "Use View As for executive operators"
      },
      {
        id: "portfolio-dashboard",
        title: "Portfolio Dashboard",
        description: "Open: Properties portfolio browse.",
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
        description: "Open: Auth recovery and support tooling.",
        openHref: "/master-admin/recovery",
        viewAsHref: VIEW_AS,
        testModePortal: null,
        testModeFallbackLabel: "Open Impersonation Center for support View As"
      },
      {
        id: "customer-success",
        title: "Customer Success",
        description: "Open: Commercial pipeline and activation health.",
        openHref: "/master-admin/commercial",
        viewAsHref: VIEW_AS,
        testModePortal: null,
        testModeFallbackLabel: "Open Impersonation Center for CS View As"
      }
      // MAC-002 — removed Platform Operations alias (duplicate of Mission Control).
    ]
  },
  {
    id: "internal",
    label: "Internal",
    cards: [
      {
        id: "mission-control",
        title: "Mission Control",
        description: "Platform command center — permanent HQ home.",
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
