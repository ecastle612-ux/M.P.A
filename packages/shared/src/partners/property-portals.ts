export const PARTNER_PROPERTY_INTAKE_SOURCES = ["generic_portal", "property_portal"] as const;
export type PartnerPropertyIntakeSource = (typeof PARTNER_PROPERTY_INTAKE_SOURCES)[number];

export const PARTNER_PROPERTY_PORTAL_TYPES = ["residential", "facility", "complete"] as const;
export type PartnerPropertyPortalType = (typeof PARTNER_PROPERTY_PORTAL_TYPES)[number];

export const PARTNER_PROPERTY_RESERVED_SLUGS = [
  "admin",
  "api",
  "create",
  "media",
  "new",
  "preview",
  "print",
  "qr",
  "settings",
  "status",
  "submit",
] as const;

export const PARTNER_PROPERTY_PORTAL_PAGE_SIZE = 25;
export const PARTNER_PROPERTY_PORTAL_MAX_PAGE_SIZE = 100;

export function normalizePartnerPropertySlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 80);
}

export function partnerPropertySlugIsReserved(slug: string): boolean {
  return (PARTNER_PROPERTY_RESERVED_SLUGS as readonly string[]).includes(slug);
}

export function partnerPropertySlugLooksLikeUuid(slug: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(slug);
}

export function validatePartnerPropertySlug(value: string):
  | { ok: true; slug: string }
  | { ok: false; error: string } {
  const slug = normalizePartnerPropertySlug(value);
  if (slug.length < 3) {
    return { ok: false, error: "Property slug must be at least 3 characters." };
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return { ok: false, error: "Property slug may use lowercase letters, numbers, and hyphens only." };
  }
  if (partnerPropertySlugIsReserved(slug)) {
    return { ok: false, error: "That property slug is reserved." };
  }
  if (partnerPropertySlugLooksLikeUuid(slug)) {
    return { ok: false, error: "Property slug cannot be a UUID." };
  }
  return { ok: true, slug };
}

export function partnerPropertyServiceRequestPath(partnerSlug: string, propertySlug: string): string {
  const partner = normalizePartnerPropertySlug(partnerSlug);
  const property = normalizePartnerPropertySlug(propertySlug);
  return `/request/${partner}/${property}`;
}

export function partnerPropertyServiceRequestUrl(
  origin: string,
  partnerSlug: string,
  propertySlug: string,
): string {
  return `${origin.replace(/\/$/, "")}${partnerPropertyServiceRequestPath(partnerSlug, propertySlug)}`;
}

export function partnerPropertyCanonicalOrigin(): string {
  return "https://www.my-property-assistant.com";
}

export function partnerPropertyCanonicalUrl(partnerSlug: string, propertySlug: string): string {
  return partnerPropertyServiceRequestUrl(partnerPropertyCanonicalOrigin(), partnerSlug, propertySlug);
}

export function partnerPropertyIntakeSourceLabel(source: string | null | undefined): string {
  return source === "property_portal" ? "Property QR / Property Portal" : "Partner portal";
}

export function partnerPropertyTypeFromProducts(products: readonly string[]): PartnerPropertyPortalType {
  const hasPm = products.includes("property_manager") || products.includes("pm.maintenance");
  const hasFo = products.includes("facility_operations") || products.includes("facility.operations");
  if (hasPm && hasFo) return "complete";
  if (hasFo) return "facility";
  return "residential";
}

export function partnerPropertyTypeFromSku(sku: string | null | undefined): PartnerPropertyPortalType {
  if (sku === "mpa_complete_platform") return "complete";
  if (sku === "mpa_facility_operations") return "facility";
  return "residential";
}

export function partnerPropertyUnitHint(type: PartnerPropertyPortalType): string {
  if (type === "facility") return "Suite, room, floor, or area";
  if (type === "complete") return "Unit, suite, room, floor, or area";
  return "Unit number or building/area";
}

export function formatCanonicalPropertyAddress(input: {
  addressLine1?: string | null;
  city?: string | null;
  region?: string | null;
  postalCode?: string | null;
}): string {
  return [input.addressLine1, input.city, input.region, input.postalCode].filter(Boolean).join(", ");
}

export function parsePartnerPropertyPortalCreateInput(payload: unknown):
  | {
      ok: true;
      data: {
        propertyId: string;
        publicSlug: string | null;
        publicDisplayName: string | null;
        publicInstructions: string | null;
      };
    }
  | { ok: false; error: string } {
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
    "userId" in body
  ) {
    return { ok: false, error: "Invalid request." };
  }
  const propertyId = typeof body["propertyId"] === "string" ? body["propertyId"].trim() : "";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(propertyId)) {
    return { ok: false, error: "Select a property from your authorized list." };
  }
  const slugRaw = typeof body["publicSlug"] === "string" ? body["publicSlug"] : "";
  let publicSlug: string | null = null;
  if (slugRaw.trim()) {
    const checked = validatePartnerPropertySlug(slugRaw);
    if (!checked.ok) return checked;
    publicSlug = checked.slug;
  }
  const publicDisplayName =
    typeof body["publicDisplayName"] === "string" && body["publicDisplayName"].trim()
      ? body["publicDisplayName"].trim().slice(0, 120)
      : null;
  const publicInstructions =
    typeof body["publicInstructions"] === "string" && body["publicInstructions"].trim()
      ? body["publicInstructions"].trim().slice(0, 500)
      : null;
  return { ok: true, data: { propertyId, publicSlug, publicDisplayName, publicInstructions } };
}

export function parsePartnerPropertyPortalUpdateInput(payload: unknown):
  | {
      ok: true;
      data: {
        enabled?: boolean;
        publicSlug?: string;
        publicDisplayName?: string | null;
        publicInstructions?: string | null;
      };
    }
  | { ok: false; error: string } {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { ok: false, error: "Invalid request." };
  }
  const body = payload as Record<string, unknown>;
  if (
    "organization_id" in body ||
    "organizationId" in body ||
    "partner_id" in body ||
    "partnerId" in body ||
    "property_id" in body ||
    "propertyId" in body ||
    "user_id" in body ||
    "userId" in body
  ) {
    return { ok: false, error: "Invalid request." };
  }
  const data: {
    enabled?: boolean;
    publicSlug?: string;
    publicDisplayName?: string | null;
    publicInstructions?: string | null;
  } = {};
  if ("enabled" in body) {
    if (typeof body["enabled"] !== "boolean") {
      return { ok: false, error: "Portal status is invalid." };
    }
    data.enabled = body["enabled"];
  }
  if ("publicSlug" in body) {
    if (typeof body["publicSlug"] !== "string") {
      return { ok: false, error: "Property slug is invalid." };
    }
    const checked = validatePartnerPropertySlug(body["publicSlug"]);
    if (!checked.ok) return checked;
    data.publicSlug = checked.slug;
  }
  if ("publicDisplayName" in body) {
    if (body["publicDisplayName"] !== null && typeof body["publicDisplayName"] !== "string") {
      return { ok: false, error: "Display name must be text." };
    }
    const value = typeof body["publicDisplayName"] === "string" ? body["publicDisplayName"].trim() : "";
    data.publicDisplayName = value ? value.slice(0, 120) : null;
  }
  if ("publicInstructions" in body) {
    if (body["publicInstructions"] !== null && typeof body["publicInstructions"] !== "string") {
      return { ok: false, error: "Instructions must be text." };
    }
    const value = typeof body["publicInstructions"] === "string" ? body["publicInstructions"].trim() : "";
    data.publicInstructions = value ? value.slice(0, 500) : null;
  }
  if (Object.keys(data).length === 0) {
    return { ok: false, error: "No allowed property-portal fields were provided." };
  }
  return { ok: true, data };
}

export function partnerPropertyTypeLabel(type: PartnerPropertyPortalType): string {
  if (type === "complete") return "Complete";
  if (type === "facility") return "Facility";
  return "Residential";
}

export function partnerPropertySearchMatches(
  query: string,
  fields: { name: string; slug: string; address?: string | null },
): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return [fields.name, fields.slug, fields.address ?? ""]
    .join(" ")
    .toLowerCase()
    .includes(needle);
}

export function paginatePartnerPropertyPortals<T>(
  rows: readonly T[],
  input: { page?: number; pageSize?: number },
): { items: T[]; page: number; pageSize: number; total: number; totalPages: number } {
  const pageSize = Math.min(
    PARTNER_PROPERTY_PORTAL_MAX_PAGE_SIZE,
    Math.max(1, input.pageSize ?? PARTNER_PROPERTY_PORTAL_PAGE_SIZE),
  );
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(totalPages, Math.max(1, input.page ?? 1));
  const start = (page - 1) * pageSize;
  return {
    items: rows.slice(start, start + pageSize),
    page,
    pageSize,
    total,
    totalPages,
  };
}
