/** COM-001 Slice C — feature discovery ([20]). */

export const DISCOVERY_KEYS = [
  "payments_gap",
  "ai_never_used",
  "no_technicians",
  "notifications_off",
  "owner_reports_unused",
  "low_wo_adoption"
] as const;

export type DiscoveryKey = (typeof DISCOVERY_KEYS)[number];

export const DISCOVERY_COOLDOWN_DAYS = 21;

export type DiscoveryStatus =
  | "open"
  | "impressed"
  | "accepted"
  | "dismissed"
  | "snoozed";

export type DiscoveryDefinition = {
  key: DiscoveryKey;
  title: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  /** AUTH-001 entitlement feature key required (see-what-you-bought). */
  requiredFeature: string | null;
  /** When true, shown even during Past Due / Suspended (billing CTA). */
  billingSafe: boolean;
};

export const DISCOVERY_CATALOG: Record<DiscoveryKey, DiscoveryDefinition> = {
  payments_gap: {
    key: "payments_gap",
    title: "Connect payments",
    body: "You haven't connected Stripe for payment workflows.",
    ctaLabel: "Open billing",
    ctaHref: "/settings/billing",
    requiredFeature: "financials",
    billingSafe: true
  },
  ai_never_used: {
    key: "ai_never_used",
    title: "Try AI assist",
    body: "You have never used AI on this workspace.",
    ctaLabel: "Open AI",
    ctaHref: "/ai-operations",
    requiredFeature: "ai_copilot",
    billingSafe: false
  },
  no_technicians: {
    key: "no_technicians",
    title: "Invite technicians",
    body: "Invite your maintenance technicians to close the loop on work orders.",
    ctaLabel: "Invite team",
    ctaHref: "/settings/team",
    requiredFeature: "maintenance",
    billingSafe: false
  },
  notifications_off: {
    key: "notifications_off",
    title: "Enable notifications",
    body: "Notification channels are off — enable them so your team stays informed.",
    ctaLabel: "Notification settings",
    ctaHref: "/settings/preferences",
    requiredFeature: null,
    billingSafe: false
  },
  owner_reports_unused: {
    key: "owner_reports_unused",
    title: "Try Owner Reports",
    body: "Owner portal reports are available on your plan but unused.",
    ctaLabel: "Open Owner Reports",
    ctaHref: "/portal/owner/reports",
    requiredFeature: "owner_portal",
    billingSafe: false
  },
  low_wo_adoption: {
    key: "low_wo_adoption",
    title: "Create a work order",
    body: "Maintenance is entitled but no work orders have been created yet.",
    ctaLabel: "Create work order",
    ctaHref: "/maintenance",
    requiredFeature: "maintenance",
    billingSafe: false
  }
};

export type DiscoveryCandidate = DiscoveryDefinition & {
  status: DiscoveryStatus;
  reason: string;
};

export type FeatureDiscoverySnapshot = {
  organizationId: string;
  primary: DiscoveryCandidate | null;
  open: DiscoveryCandidate[];
  suppressedBilling: boolean;
  evaluatedAt: string;
};
