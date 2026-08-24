import type { PartnerStatus, PartnerType } from "./config";
import { normalizePartnerSlug, validatePartnerSlug } from "./slug";

export const PARTNER_PORTAL_ELIGIBLE_TYPES: readonly PartnerType[] = [
  "certified_service",
  "strategic"
];

export const PARTNER_SERVICE_CATEGORIES = [
  "general_maintenance",
  "plumbing",
  "electrical",
  "hvac",
  "appliance",
  "cleaning",
  "turnover",
  "landscaping",
  "snow",
  "inspection",
  "handyman",
  "other"
] as const;
export type PartnerServiceCategory = (typeof PARTNER_SERVICE_CATEGORIES)[number];

export const PARTNER_SERVICE_CATEGORY_LABELS: Record<PartnerServiceCategory, string> = {
  general_maintenance: "General Maintenance",
  plumbing: "Plumbing",
  electrical: "Electrical",
  hvac: "HVAC",
  appliance: "Appliance",
  cleaning: "Cleaning",
  turnover: "Turnover / Make Ready",
  landscaping: "Landscaping",
  snow: "Snow / Ice",
  inspection: "Inspection",
  handyman: "Carpentry / Handyman",
  other: "Other"
};

export const PARTNER_REQUEST_URGENCIES = ["normal", "soon", "urgent"] as const;
export type PartnerRequestUrgency = (typeof PARTNER_REQUEST_URGENCIES)[number];

export const PARTNER_REQUEST_URGENCY_LABELS: Record<PartnerRequestUrgency, string> = {
  normal: "Normal",
  soon: "Soon",
  urgent: "Urgent"
};

export const PARTNER_REQUEST_STATUSES = [
  "submitted",
  "under_review",
  "accepted",
  "converted",
  "declined",
  "cancelled"
] as const;
export type PartnerRequestStatus = (typeof PARTNER_REQUEST_STATUSES)[number];

export const PARTNER_REQUEST_STATUS_LABELS: Record<PartnerRequestStatus, string> = {
  submitted: "New",
  under_review: "Under review",
  accepted: "Accepted",
  converted: "Converted",
  declined: "Declined",
  cancelled: "Cancelled"
};

export const PARTNER_EMERGENCY_DISCLAIMER =
  "For fire, gas leaks, medical emergencies, or immediate threats to life or safety, contact the appropriate emergency service rather than submitting this form.";

export const PARTNER_REQUEST_MAX_BYTES = 16 * 1024;
export const PARTNER_REQUEST_DESCRIPTION_MAX = 4000;

export function partnerTypeAllowsPortal(type: PartnerType): boolean {
  return PARTNER_PORTAL_ELIGIBLE_TYPES.includes(type);
}

export function partnerPortalIsLive(input: {
  status: PartnerStatus;
  partnerType: PartnerType;
  publicPortalEnabled: boolean;
  organizationId: string | null | undefined;
  publicSlug: string | null | undefined;
}): boolean {
  return (
    input.status === "active" &&
    partnerTypeAllowsPortal(input.partnerType) &&
    input.publicPortalEnabled &&
    Boolean(input.organizationId) &&
    Boolean(input.publicSlug)
  );
}

export function looksLikePartnerSlugParam(value: string): boolean {
  const slug = normalizePartnerSlug(value);
  return validatePartnerSlug(slug).ok;
}

export function partnerServiceRequestPath(slug: string): string {
  return `/request/${encodeURIComponent(slug)}`;
}

export function partnerServiceRequestAbsoluteUrl(origin: string, slug: string): string {
  return `${origin.replace(/\/$/, "")}${partnerServiceRequestPath(slug)}`;
}

export function isPartnerServiceCategory(value: unknown): value is PartnerServiceCategory {
  return typeof value === "string" && (PARTNER_SERVICE_CATEGORIES as readonly string[]).includes(value);
}

export function isPartnerRequestUrgency(value: unknown): value is PartnerRequestUrgency {
  return typeof value === "string" && (PARTNER_REQUEST_URGENCIES as readonly string[]).includes(value);
}

export function isPartnerRequestStatus(value: unknown): value is PartnerRequestStatus {
  return typeof value === "string" && (PARTNER_REQUEST_STATUSES as readonly string[]).includes(value);
}

const CATEGORY_HINTS: Array<{ match: RegExp; category: PartnerServiceCategory }> = [
  { match: /plumb/i, category: "plumbing" },
  { match: /electric/i, category: "electrical" },
  { match: /hvac|heat|air.?cond/i, category: "hvac" },
  { match: /appliance/i, category: "appliance" },
  { match: /clean/i, category: "cleaning" },
  { match: /turnover|make.?ready/i, category: "turnover" },
  { match: /landscape|lawn/i, category: "landscaping" },
  { match: /snow|ice/i, category: "snow" },
  { match: /inspect/i, category: "inspection" },
  { match: /carpenter|handyman|handy.?man/i, category: "handyman" },
  { match: /maintenance|repair/i, category: "general_maintenance" }
];

export function categoriesForPartnerServices(servicesOffered: string | null | undefined): PartnerServiceCategory[] {
  const text = servicesOffered?.trim() ?? "";
  if (!text) return [...PARTNER_SERVICE_CATEGORIES];
  const matched = CATEGORY_HINTS.filter((item) => item.match.test(text)).map((item) => item.category);
  const unique = Array.from(new Set(matched));
  if (unique.length === 0) return [...PARTNER_SERVICE_CATEGORIES];
  if (!unique.includes("other")) unique.push("other");
  return unique;
}

export function mapCategoryToWorkOrderCategory(category: PartnerServiceCategory): string {
  switch (category) {
    case "plumbing":
    case "electrical":
    case "hvac":
    case "appliance":
    case "inspection":
      return category;
    case "general_maintenance":
    case "cleaning":
    case "turnover":
    case "landscaping":
    case "snow":
    case "handyman":
    case "other":
      return "general";
    default:
      return "general";
  }
}

export function mapUrgencyToWorkOrderPriority(urgency: PartnerRequestUrgency): "normal" | "high" | "low" {
  if (urgency === "urgent") return "high";
  if (urgency === "soon") return "normal";
  return "normal";
}
