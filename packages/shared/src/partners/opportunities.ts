import type { PartnerReadiness } from "./onboarding";
import type { PartnerStatus, PartnerType } from "./config";
import {
  PARTNER_SERVICE_CATEGORIES,
  PARTNER_SERVICE_CATEGORY_LABELS,
  type PartnerRequestUrgency,
  type PartnerServiceCategory
} from "./portal";

/** Single routing cap — do not hard-code in UI and backend separately. */
export const PARTNER_OPPORTUNITY_ROUTE_LIMIT = 5;

/** Opportunities expire after 72 hours. History is retained. */
export const PARTNER_OPPORTUNITY_TTL_MS = 72 * 60 * 60 * 1000;

export const PARTNER_OPPORTUNITY_STATUSES = [
  "open",
  "routed",
  "partner_interested",
  "partner_selected",
  "closed",
  "cancelled"
] as const;
export type PartnerOpportunityStatus = (typeof PARTNER_OPPORTUNITY_STATUSES)[number];

export const PARTNER_OPPORTUNITY_STATUS_LABELS: Record<PartnerOpportunityStatus, string> = {
  open: "Open",
  routed: "Routed",
  partner_interested: "Partner interested",
  partner_selected: "Partner selected",
  closed: "Closed",
  cancelled: "Cancelled"
};

export const PARTNER_OPPORTUNITY_ROUTE_RESPONSES = ["interested", "declined", "not_selected"] as const;
export type PartnerOpportunityRouteResponse = (typeof PARTNER_OPPORTUNITY_ROUTE_RESPONSES)[number];

export const PARTNER_OPPORTUNITY_DECLINE_REASONS = [
  "outside_service_area",
  "schedule_unavailable",
  "service_not_offered",
  "capacity",
  "other"
] as const;
export type PartnerOpportunityDeclineReason = (typeof PARTNER_OPPORTUNITY_DECLINE_REASONS)[number];

export const PARTNER_OPPORTUNITY_DECLINE_LABELS: Record<PartnerOpportunityDeclineReason, string> = {
  outside_service_area: "Outside service area",
  schedule_unavailable: "Schedule unavailable",
  service_not_offered: "Service not offered",
  capacity: "Capacity",
  other: "Other"
};

export const PARTNER_OPPORTUNITY_CLOSE_REASONS = ["manual", "expired", "no_response"] as const;
export type PartnerOpportunityCloseReason = (typeof PARTNER_OPPORTUNITY_CLOSE_REASONS)[number];

export const PARTNER_OPPORTUNITY_PROPERTY_TYPES = ["residential", "facility"] as const;
export type PartnerOpportunityPropertyType = (typeof PARTNER_OPPORTUNITY_PROPERTY_TYPES)[number];

export const PARTNER_OPPORTUNITY_NO_MATCH_COPY =
  "No M.P.A. Service Partners currently match this request.";

export const PARTNER_OPPORTUNITY_INTEREST_COPY =
  "I'm Interested records interest only. It does not assign the job, create a contract, create payment, or guarantee selection.";

export const PARTNER_OPPORTUNITY_SELECT_COPY =
  "Selecting a Partner identifies your preferred service provider. Confirm scope, pricing, scheduling and service terms directly with the Partner.";

export const PARTNER_OPPORTUNITY_NO_GUARANTEE_COPY =
  "M.P.A. does not guarantee work quality or pricing.";

export const PARTNER_OPPORTUNITY_DESCRIPTION_MAX = 4000;
export const PARTNER_OPPORTUNITY_TIMING_MAX = 200;

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
  { match: /carpenter|handyman|handy.?man|structural/i, category: "handyman" },
  { match: /maintenance|repair|preventive/i, category: "general_maintenance" }
];

export function isPartnerOpportunityStatus(value: unknown): value is PartnerOpportunityStatus {
  return typeof value === "string" && (PARTNER_OPPORTUNITY_STATUSES as readonly string[]).includes(value);
}

export function isPartnerOpportunityDeclineReason(value: unknown): value is PartnerOpportunityDeclineReason {
  return typeof value === "string" && (PARTNER_OPPORTUNITY_DECLINE_REASONS as readonly string[]).includes(value);
}

export function partnerTypeReceivesServiceOpportunities(type: PartnerType): boolean {
  return type === "certified_service" || type === "strategic";
}

export function partnerEligibleForOpportunityRouting(input: {
  status: PartnerStatus;
  partnerType: PartnerType;
  readiness: PartnerReadiness;
}): boolean {
  return (
    input.status === "active" &&
    partnerTypeReceivesServiceOpportunities(input.partnerType) &&
    input.readiness === "ready"
  );
}

export function mapWorkOrderCategoryToPartnerCategory(category: string): PartnerServiceCategory {
  switch (category) {
    case "plumbing":
    case "electrical":
    case "hvac":
    case "appliance":
    case "inspection":
      return category;
    case "general":
    case "preventive":
      return "general_maintenance";
    case "structural":
      return "handyman";
    case "building_system":
      return "hvac";
    default:
      return "other";
  }
}

export function mapWorkOrderPriorityToOpportunityUrgency(priority: string): PartnerRequestUrgency {
  if (priority === "emergency" || priority === "high") return "urgent";
  return "normal";
}

export function mapOpportunityUrgencyToWorkOrderPriority(
  urgency: PartnerRequestUrgency
): "normal" | "high" | "low" {
  if (urgency === "urgent") return "high";
  return "normal";
}

/**
 * Opportunity routing categories. Empty or unmatched service text matches nothing.
 * Does not fall back to every category the way portal display hints do.
 */
export function categoriesForOpportunityRouting(
  servicesOffered: string | null | undefined
): PartnerServiceCategory[] {
  const text = servicesOffered?.trim() ?? "";
  if (!text) return [];
  const matched: PartnerServiceCategory[] = [];
  for (const hint of CATEGORY_HINTS) {
    if (hint.match.test(text)) matched.push(hint.category);
  }
  const lower = text.toLowerCase();
  for (const category of PARTNER_SERVICE_CATEGORIES) {
    const label = PARTNER_SERVICE_CATEGORY_LABELS[category].toLowerCase();
    if (lower.includes(category.replaceAll("_", " ")) || lower.includes(label.toLowerCase())) {
      matched.push(category);
    }
  }
  return Array.from(new Set(matched));
}

export function partnerOffersOpportunityCategory(
  servicesOffered: string | null | undefined,
  category: PartnerServiceCategory
): boolean {
  return categoriesForOpportunityRouting(servicesOffered).includes(category);
}

function normalizeToken(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function areaIncludesToken(area: string, token: string): boolean {
  if (!token || token.length < 2) return false;
  if (area.includes(token)) return true;
  const parts = area.split(/[^a-z0-9]+/);
  return parts.includes(token);
}

/**
 * Structured location match only. No mileage or radius.
 * Matches city, region↔state, or city/region/ZIP tokens inside partner service_area.
 */
export function locationMatchesOpportunity(
  location: {
    city?: string | null;
    region?: string | null;
    postalCode?: string | null;
  },
  partner: {
    city?: string | null;
    state?: string | null;
    serviceArea?: string | null;
  }
): boolean {
  const city = normalizeToken(location.city);
  const region = normalizeToken(location.region);
  const postal = normalizeToken(location.postalCode);
  if (!city && !region && !postal) return false;

  const partnerCity = normalizeToken(partner.city);
  const partnerState = normalizeToken(partner.state);
  const serviceArea = normalizeToken(partner.serviceArea);

  if (city && partnerCity && city === partnerCity) return true;
  if (region && partnerState && region === partnerState) return true;
  if (city && areaIncludesToken(serviceArea, city)) return true;
  if (region && areaIncludesToken(serviceArea, region)) return true;
  if (postal && areaIncludesToken(serviceArea, postal)) return true;
  return false;
}

export function opportunityIsExpired(expiresAt: string, now = new Date()): boolean {
  return new Date(expiresAt).getTime() <= now.getTime();
}

export function opportunityAllowsPartnerResponse(input: {
  status: PartnerOpportunityStatus;
  expiresAt: string;
  partnerStatus: PartnerStatus;
  now?: Date;
}): boolean {
  if (input.partnerStatus === "suspended") return false;
  if (opportunityIsExpired(input.expiresAt, input.now)) return false;
  return input.status === "routed" || input.status === "partner_interested" || input.status === "open";
}

export function opportunityAllowsReroute(status: PartnerOpportunityStatus): boolean {
  return status === "open" || status === "routed" || status === "partner_interested";
}

export function opportunityAllowsSelection(status: PartnerOpportunityStatus): boolean {
  return status === "partner_interested" || status === "routed";
}

export function deriveOpportunityStatusFromRoutes(
  current: PartnerOpportunityStatus,
  routes: ReadonlyArray<{ response: PartnerOpportunityRouteResponse | null; selected?: boolean }>
): PartnerOpportunityStatus {
  if (
    current === "partner_selected" ||
    current === "closed" ||
    current === "cancelled" ||
    routes.some((route) => route.selected)
  ) {
    return current === "open" || current === "routed" || current === "partner_interested"
      ? "partner_selected"
      : current;
  }
  if (routes.some((route) => route.response === "interested")) return "partner_interested";
  if (routes.length > 0) return "routed";
  return current === "open" ? "open" : current;
}

export function selectPartnersForRouting<T extends { id: string; companyName: string }>(
  eligible: readonly T[],
  previouslyRoutedIds: readonly string[],
  limit = PARTNER_OPPORTUNITY_ROUTE_LIMIT
): T[] {
  const seen = new Set(previouslyRoutedIds);
  return [...eligible]
    .filter((partner) => !seen.has(partner.id))
    .sort((a, b) => a.companyName.localeCompare(b.companyName) || a.id.localeCompare(b.id))
    .slice(0, limit);
}

export function summarizePartnerOpportunityMetrics(
  routes: ReadonlyArray<{ response: PartnerOpportunityRouteResponse | null; selected?: boolean }>
): {
  received: number;
  interested: number;
  declined: number;
  selected: number;
  responseRate: number | null;
} {
  const received = routes.length;
  const interested = routes.filter((route) => route.response === "interested" || route.selected).length;
  const declined = routes.filter((route) => route.response === "declined").length;
  const selected = routes.filter((route) => route.selected).length;
  const responded = routes.filter((route) => route.response === "interested" || route.response === "declined").length;
  return {
    received,
    interested,
    declined,
    selected,
    responseRate: received > 0 ? Math.round((responded / received) * 1000) / 10 : null
  };
}

export function summarizePlatformOpportunityAnalytics(
  opportunities: ReadonlyArray<{
    status: PartnerOpportunityStatus;
    category: PartnerServiceCategory;
    city: string | null;
    region: string | null;
    closeReason: PartnerOpportunityCloseReason | null;
  }>,
  routes: ReadonlyArray<{ response: PartnerOpportunityRouteResponse | null; selected?: boolean }>,
  unmetCount: number
): {
  created: number;
  matchRate: number | null;
  noMatchRate: number | null;
  partnerResponseRate: number | null;
  partnerSelectionRate: number | null;
  categories: Record<string, number>;
  geographicDemand: Array<{ region: string; city: string; count: number }>;
} {
  const created = opportunities.length;
  const matched = opportunities.filter((row) => row.status !== "open" || Boolean(row.closeReason)).length;
  const routed = opportunities.filter((row) =>
    ["routed", "partner_interested", "partner_selected", "closed", "cancelled"].includes(row.status)
  ).length;
  const noMatch = unmetCount;
  const selected = opportunities.filter((row) => row.status === "partner_selected").length;
  const responded = routes.filter((row) => row.response === "interested" || row.response === "declined").length;
  const categories: Record<string, number> = {};
  const geo = new Map<string, number>();
  for (const row of opportunities) {
    categories[row.category] = (categories[row.category] ?? 0) + 1;
    const key = `${row.region ?? ""}|${row.city ?? ""}`;
    geo.set(key, (geo.get(key) ?? 0) + 1);
  }
  return {
    created,
    matchRate: created > 0 ? Math.round((routed / created) * 1000) / 10 : null,
    noMatchRate: created + noMatch > 0 ? Math.round((noMatch / (created + noMatch > 0 ? created : 1)) * 1000) / 10 : null,
    partnerResponseRate: routes.length > 0 ? Math.round((responded / routes.length) * 1000) / 10 : null,
    partnerSelectionRate: created > 0 ? Math.round((selected / created) * 1000) / 10 : null,
    categories,
    geographicDemand: [...geo.entries()].map(([key, count]) => {
      const [region, city] = key.split("|");
      return { region: region ?? "", city: city ?? "", count };
    })
  };
}

export type PartnerOpportunityCreateInput = {
  propertyId: string;
  unitLabel?: string | null;
  category: PartnerServiceCategory;
  description: string;
  urgency: PartnerRequestUrgency;
  preferredTiming?: string | null;
  workOrderId?: string | null;
  propertyType?: PartnerOpportunityPropertyType;
};

const CLIENT_OVERRIDE_KEYS = [
  "organization_id",
  "organizationId",
  "selected_partner_id",
  "selectedPartnerId",
  "routed_partner_ids",
  "routedPartnerIds",
  "requesting_user_id",
  "requestingUserId",
  "status",
  "expires_at",
  "expiresAt"
] as const;

export function parsePartnerOpportunityCreateInput(
  payload: unknown
): { ok: true; data: PartnerOpportunityCreateInput } | { ok: false; error: string } {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { ok: false, error: "Invalid opportunity payload." };
  }
  const record = payload as Record<string, unknown>;
  for (const key of CLIENT_OVERRIDE_KEYS) {
    if (key in record) {
      return { ok: false, error: "Those fields are server-authoritative." };
    }
  }
  const workOrderId =
    typeof record["workOrderId"] === "string" && record["workOrderId"].trim()
      ? record["workOrderId"].trim()
      : null;
  const propertyId = typeof record["propertyId"] === "string" ? record["propertyId"].trim() : "";
  if (!propertyId && !workOrderId) return { ok: false, error: "Property is required." };
  const category = record["category"];
  if (
    !workOrderId &&
    (typeof category !== "string" || !(PARTNER_SERVICE_CATEGORIES as readonly string[]).includes(category))
  ) {
    return { ok: false, error: "Service category is required." };
  }
  const description = typeof record["description"] === "string" ? record["description"].trim() : "";
  if (!workOrderId && description.length < 3) return { ok: false, error: "Description is required." };
  const urgency = record["urgency"] ?? "normal";
  if (urgency !== "normal" && urgency !== "soon" && urgency !== "urgent") {
    return { ok: false, error: "Urgency is invalid." };
  }
  const propertyType =
    record["propertyType"] === "facility" || record["propertyType"] === "residential"
      ? record["propertyType"]
      : undefined;
  const unitLabel =
    typeof record["unitLabel"] === "string" && record["unitLabel"].trim()
      ? record["unitLabel"].trim().slice(0, 80)
      : null;
  const preferredTiming =
    typeof record["preferredTiming"] === "string" && record["preferredTiming"].trim()
      ? record["preferredTiming"].trim().slice(0, PARTNER_OPPORTUNITY_TIMING_MAX)
      : null;
  return {
    ok: true,
    data: {
      propertyId: propertyId || "from-work-order",
      unitLabel,
      category:
        typeof category === "string" && (PARTNER_SERVICE_CATEGORIES as readonly string[]).includes(category)
          ? (category as PartnerServiceCategory)
          : "other",
      description: description.slice(0, PARTNER_OPPORTUNITY_DESCRIPTION_MAX),
      urgency,
      preferredTiming,
      workOrderId,
      propertyType
    }
  };
}

export function partnerFacingOpportunityPrivacy(input: {
  city: string | null;
  region: string | null;
  propertyType: PartnerOpportunityPropertyType;
  category: PartnerServiceCategory;
  urgency: PartnerRequestUrgency;
  description: string;
  preferredTiming: string | null;
}): {
  city: string | null;
  region: string | null;
  area: string;
  propertyType: PartnerOpportunityPropertyType;
  category: PartnerServiceCategory;
  categoryLabel: string;
  urgency: PartnerRequestUrgency;
  summary: string;
  preferredTiming: string | null;
} {
  const area = [input.city, input.region].filter(Boolean).join(", ");
  return {
    city: input.city,
    region: input.region,
    area,
    propertyType: input.propertyType,
    category: input.category,
    categoryLabel: PARTNER_SERVICE_CATEGORY_LABELS[input.category],
    urgency: input.urgency,
    summary: input.description.slice(0, PARTNER_OPPORTUNITY_DESCRIPTION_MAX),
    preferredTiming: input.preferredTiming
  };
}
