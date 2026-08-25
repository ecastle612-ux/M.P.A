import {
  PARTNER_REQUEST_DESCRIPTION_MAX,
  isPartnerRequestUrgency,
  isPartnerServiceCategory,
  type PartnerRequestUrgency,
  type PartnerServiceCategory
} from "./portal";

export type PartnerServiceRequestInput = {
  requesterName: string;
  requesterEmail: string | null;
  requesterPhone: string | null;
  propertyAddress: string;
  unitLabel: string | null;
  category: PartnerServiceCategory;
  description: string;
  urgency: PartnerRequestUrgency;
  propertySlug: string | null;
};

function trim(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function optionalTrim(value: unknown, max: number): string | null {
  const next = trim(value, max);
  return next ? next : null;
}

export function parsePartnerServiceRequestInput(
  payload: unknown,
  options: { requirePropertyAddress?: boolean } = {}
): { ok: true; data: PartnerServiceRequestInput } | { ok: false; error: string } {
  if (!payload || typeof payload !== "object") {
    return { ok: false, error: "Invalid request." };
  }
  const body = payload as Record<string, unknown>;
  if (
    "organization_id" in body ||
    "organizationId" in body ||
    "partner_id" in body ||
    "partnerId" in body ||
    "user_id" in body ||
    "userId" in body ||
    "property_id" in body ||
    "propertyId" in body
  ) {
    return { ok: false, error: "Invalid request." };
  }
  if (typeof body["company_fax"] === "string" && body["company_fax"].trim()) {
    return { ok: false, error: "spam" };
  }
  const requesterName = trim(body["requesterName"] ?? body["name"], 120);
  const requesterEmail = optionalTrim(body["requesterEmail"] ?? body["email"], 254)?.toLowerCase() ?? null;
  const requesterPhone = optionalTrim(body["requesterPhone"] ?? body["phone"], 40);
  const propertyAddress = trim(body["propertyAddress"] ?? body["address"], 240);
  const unitLabel = optionalTrim(body["unitLabel"] ?? body["unit"], 80);
  const description = trim(body["description"], PARTNER_REQUEST_DESCRIPTION_MAX);
  const category = body["category"];
  const urgency = body["urgency"] ?? "normal";
  const propertySlug = optionalTrim(body["propertySlug"], 48);

  if (!requesterName) {
    return { ok: false, error: "Enter your name." };
  }
  if (!requesterEmail && !requesterPhone) {
    return { ok: false, error: "Enter an email or phone number so the partner can reach you." };
  }
  if (requesterEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(requesterEmail)) {
    return { ok: false, error: "Enter a valid email address." };
  }
  if (!propertyAddress && options.requirePropertyAddress !== false) {
    return { ok: false, error: "Enter the property or address." };
  }
  if (!isPartnerServiceCategory(category)) {
    return { ok: false, error: "Select a service category." };
  }
  if (!description || description.length < 3) {
    return { ok: false, error: "Describe the work that is needed." };
  }
  if (!isPartnerRequestUrgency(urgency)) {
    return { ok: false, error: "Select an urgency." };
  }
  return {
    ok: true,
    data: {
      requesterName,
      requesterEmail,
      requesterPhone,
      propertyAddress,
      unitLabel,
      category,
      description,
      urgency,
      propertySlug
    }
  };
}

export const PARTNER_PORTAL_ANALYTICS_EVENTS = {
  portal_viewed: "partner.portal_viewed",
  request_submitted: "partner.request_submitted",
  request_converted: "partner.request_converted"
} as const;
