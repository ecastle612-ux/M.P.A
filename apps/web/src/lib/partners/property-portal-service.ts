import {
  formatCanonicalPropertyAddress,
  normalizePartnerPropertySlug,
  PARTNER_ONBOARDING_EVENTS,
  paginatePartnerPropertyPortals,
  parsePartnerPropertyPortalCreateInput,
  parsePartnerPropertyPortalUpdateInput,
  partnerPropertyCanonicalUrl,
  partnerPropertyIntakeSourceLabel,
  partnerPropertySearchMatches,
  partnerPropertyServiceRequestPath,
  partnerPropertyTypeFromSku,
  partnerPropertyTypeLabel,
  requestOperationalMetrics,
  validatePartnerPropertySlug,
  type PartnerPropertyPortalType
} from "@mpa/shared";
import type { PartnerRequestServiceDeps } from "./request-service";
import { defaultPartnerRequestDeps, resolveLivePartnerPortal } from "./request-service";
import type { PartnerRequestSummary } from "./property-portal-types";
import type { PartnerPropertyPortal, PartnerPropertyPortalListItem } from "./property-portal-types";
import {
  getMemoryPartnerPropertyPortalStore,
  getMemoryPropertyCatalog
} from "./property-portal-store";
import type { PartnerServiceRequest } from "./request-types";

function nowIso(): string {
  return new Date().toISOString();
}

function newId(): string {
  return crypto.randomUUID();
}

function publicName(portal: PartnerPropertyPortal, propertyName: string): string {
  return portal.publicDisplayName?.trim() || propertyName;
}

function metricsFromRows(rows: Array<{ status: string; createdAt: string }>, now = new Date()) {
  const base = requestOperationalMetrics(rows, now);
  return {
    total: rows.length,
    thisMonth: base.thisMonthCount,
    accepted: base.acceptedCount,
    converted: base.convertedCount,
    declined: base.declinedCount,
    conversionRate: base.conversionRate
  };
}

export function defaultPropertyPortalExtras() {
  return {
    propertyPortals: getMemoryPartnerPropertyPortalStore(),
    properties: getMemoryPropertyCatalog()
  };
}

export async function resolveLivePropertyPortal(
  partnerSlug: string,
  propertySlug: string,
  deps: PartnerRequestServiceDeps = defaultPartnerRequestDeps()
) {
  const live = await resolveLivePartnerPortal(partnerSlug, deps);
  if (!live || !deps.propertyPortals || !deps.properties) {
    return null;
  }
  const slug = normalizePartnerPropertySlug(propertySlug);
  const portal = await deps.propertyPortals.getPortalByPartnerAndSlug(live.partner.id, slug);
  if (!portal || !portal.enabled) {
    return null;
  }
  if (portal.organizationId !== live.partner.organizationId) {
    return null;
  }
  const property = await deps.properties.getProperty(portal.propertyId);
  if (!property || property.organizationId !== live.partner.organizationId) {
    return null;
  }
  const type = partnerPropertyTypeFromSku(null);
  const name = publicName(portal, property.name);
  const address = formatCanonicalPropertyAddress(property);
  return {
    partner: live.partner,
    portal,
    property,
    public: {
      ...live.public,
      propertyName: name,
      propertySlug: portal.publicSlug,
      propertyInstructions: portal.publicInstructions,
      propertyAddress: address || name,
      title: `Service Requests — ${live.partner.companyName}`,
      unitHint: type
    }
  };
}

export async function listAuthorizedPropertyPortals(
  input: {
    organizationId: string;
    partnerId?: string;
    query?: string;
    page?: number;
    pageSize?: number;
    sku?: string | null;
    entitlements?: readonly string[];
  },
  deps: PartnerRequestServiceDeps = defaultPartnerRequestDeps()
): Promise<
  | {
      ok: true;
      partnerId: string;
      items: PartnerPropertyPortalListItem[];
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    }
  | { ok: false; error: string; code?: "not_found" }
> {
  if (!deps.propertyPortals || !deps.properties) {
    return { ok: false, error: "Property portals are unavailable." };
  }
  const partner = input.partnerId
    ? await deps.store.getPartner(input.partnerId)
    : await deps.store.getPartnerByOrganization(input.organizationId);
  if (!partner || partner.organizationId !== input.organizationId) {
    return { ok: false, error: "Partner not found.", code: "not_found" };
  }
  const type = typeFromContext(input.sku, input.entitlements);
  const portals = await deps.propertyPortals.listPortals(partner.id);
  const properties = await deps.properties.listProperties(input.organizationId);
  const propertyMap = new Map(properties.map((row) => [row.id, row]));
  const summaries = await listSummaries(partner.id, deps);
  const items: PartnerPropertyPortalListItem[] = [];
  for (const portal of portals) {
    const property = propertyMap.get(portal.propertyId) ?? (await deps.properties.getProperty(portal.propertyId));
    if (!property || property.organizationId !== input.organizationId) {
      continue;
    }
    const name = publicName(portal, property.name);
    const address = formatCanonicalPropertyAddress(property);
    if (
      !partnerPropertySearchMatches(input.query ?? "", {
        name,
        slug: portal.publicSlug,
        address
      })
    ) {
      continue;
    }
    const related = summaries.filter((row) => row.propertyPortalId === portal.id);
    const metrics = metricsFromRows(related);
    const path = partnerPropertyServiceRequestPath(partner.publicSlug ?? "", portal.publicSlug);
    items.push({
      ...portal,
      publicName: name,
      address,
      type,
      typeLabel: partnerPropertyTypeLabel(type),
      portalUrl: partnerPropertyCanonicalUrl(partner.publicSlug ?? "", portal.publicSlug),
      displayUrl: `my-property-assistant.com${path}`,
      qrPayload: partnerPropertyCanonicalUrl(partner.publicSlug ?? "", portal.publicSlug),
      requestCount: metrics.total,
      metrics
    });
  }
  const page = paginatePartnerPropertyPortals(items, {
    ...(input.page !== undefined ? { page: input.page } : {}),
    ...(input.pageSize !== undefined ? { pageSize: input.pageSize } : {})
  });
  return { ok: true, partnerId: partner.id, ...page };
}

export async function createAuthorizedPropertyPortal(
  input: {
    organizationId: string;
    actorUserId: string;
    payload: unknown;
  },
  deps: PartnerRequestServiceDeps = defaultPartnerRequestDeps()
): Promise<{ ok: true; portal: PartnerPropertyPortal } | { ok: false; error: string; code?: "not_found" | "conflict" }> {
  if (!deps.propertyPortals || !deps.properties) {
    return { ok: false, error: "Property portals are unavailable." };
  }
  const parsed = parsePartnerPropertyPortalCreateInput(input.payload);
  if (!parsed.ok) return parsed;
  const partner = await deps.store.getPartnerByOrganization(input.organizationId);
  if (!partner || partner.organizationId !== input.organizationId) {
    return { ok: false, error: "Partner not found.", code: "not_found" };
  }
  const property = await deps.properties.getProperty(parsed.data.propertyId);
  if (!property || property.organizationId !== input.organizationId) {
    return { ok: false, error: "Select a property from your authorized list.", code: "not_found" };
  }
  const existing = await deps.propertyPortals.getPortalByPartnerAndProperty(partner.id, property.id);
  if (existing) {
    return { ok: false, error: "That property already has a service portal.", code: "conflict" };
  }
  const slugSource = parsed.data.publicSlug ?? normalizePartnerPropertySlug(property.name);
  const slug = validatePartnerPropertySlug(slugSource);
  if (!slug.ok) return slug;
  const slugTaken = await deps.propertyPortals.getPortalByPartnerAndSlug(partner.id, slug.slug);
  if (slugTaken) {
    return { ok: false, error: "That property slug is already in use for this partner.", code: "conflict" };
  }
  const now = nowIso();
  const row: PartnerPropertyPortal = {
    id: newId(),
    partnerId: partner.id,
    organizationId: input.organizationId,
    propertyId: property.id,
    publicSlug: slug.slug,
    enabled: true,
    publicDisplayName: parsed.data.publicDisplayName,
    publicInstructions: parsed.data.publicInstructions,
    createdAt: now,
    updatedAt: now
  };
  await deps.propertyPortals.insertPortal(row);
  await deps.store.insertEvent({
    id: newId(),
    partnerId: partner.id,
    action: PARTNER_ONBOARDING_EVENTS.property_added,
    actorUserId: input.actorUserId,
    payload: { portalId: row.id },
    createdAt: now
  });
  return { ok: true, portal: row };
}

export async function updateAuthorizedPropertyPortal(
  input: {
    linkId: string;
    organizationId: string;
    actorUserId: string;
    payload: unknown;
    allowCrossOrg?: boolean;
  },
  deps: PartnerRequestServiceDeps = defaultPartnerRequestDeps()
): Promise<{ ok: true; portal: PartnerPropertyPortal } | { ok: false; error: string; code?: "not_found" | "conflict" }> {
  if (!deps.propertyPortals) {
    return { ok: false, error: "Property portals are unavailable." };
  }
  const parsed = parsePartnerPropertyPortalUpdateInput(input.payload);
  if (!parsed.ok) return parsed;
  const current = await deps.propertyPortals.getPortal(input.linkId);
  if (!current || (!input.allowCrossOrg && current.organizationId !== input.organizationId)) {
    return { ok: false, error: "Property portal not found.", code: "not_found" };
  }
  if (parsed.data.publicSlug && parsed.data.publicSlug !== current.publicSlug) {
    const taken = await deps.propertyPortals.getPortalByPartnerAndSlug(current.partnerId, parsed.data.publicSlug);
    if (taken && taken.id !== current.id) {
      return { ok: false, error: "That property slug is already in use for this partner.", code: "conflict" };
    }
  }
  const next: PartnerPropertyPortal = {
    ...current,
    enabled: parsed.data.enabled ?? current.enabled,
    publicSlug: parsed.data.publicSlug ?? current.publicSlug,
    publicDisplayName:
      parsed.data.publicDisplayName !== undefined ? parsed.data.publicDisplayName : current.publicDisplayName,
    publicInstructions:
      parsed.data.publicInstructions !== undefined ? parsed.data.publicInstructions : current.publicInstructions,
    updatedAt: nowIso()
  };
  await deps.propertyPortals.updatePortal(next);
  return { ok: true, portal: next };
}

export async function getAuthorizedPropertyPortal(
  input: { linkId: string; organizationId: string; sku?: string | null; entitlements?: readonly string[] },
  deps: PartnerRequestServiceDeps = defaultPartnerRequestDeps()
): Promise<PartnerPropertyPortalListItem | null> {
  if (!deps.propertyPortals || !deps.properties) return null;
  const portal = await deps.propertyPortals.getPortal(input.linkId);
  if (!portal || portal.organizationId !== input.organizationId) return null;
  const partner = await deps.store.getPartner(portal.partnerId);
  if (!partner || partner.organizationId !== input.organizationId) return null;
  const property = await deps.properties.getProperty(portal.propertyId);
  if (!property || property.organizationId !== input.organizationId) return null;
  const type = typeFromContext(input.sku, input.entitlements);
  const name = publicName(portal, property.name);
  const address = formatCanonicalPropertyAddress(property);
  const summaries = await listSummaries(partner.id, deps);
  const metrics = metricsFromRows(summaries.filter((row) => row.propertyPortalId === portal.id));
  const path = partnerPropertyServiceRequestPath(partner.publicSlug ?? "", portal.publicSlug);
  return {
    ...portal,
    publicName: name,
    address,
    type,
    typeLabel: partnerPropertyTypeLabel(type),
    portalUrl: partnerPropertyCanonicalUrl(partner.publicSlug ?? "", portal.publicSlug),
    displayUrl: `my-property-assistant.com${path}`,
    qrPayload: partnerPropertyCanonicalUrl(partner.publicSlug ?? "", portal.publicSlug),
    requestCount: metrics.total,
    metrics
  };
}

export function propertyPortalSourceLabel(source: string | null | undefined): string {
  return partnerPropertyIntakeSourceLabel(source);
}

function typeFromContext(sku?: string | null, entitlements?: readonly string[]): PartnerPropertyPortalType {
  if (sku) return partnerPropertyTypeFromSku(sku);
  return partnerPropertyTypeFromSku(
    entitlements?.includes("facility.operations") && entitlements.includes("pm.maintenance")
      ? "mpa_complete_platform"
      : entitlements?.includes("facility.operations")
        ? "mpa_facility_operations"
        : "mpa_property_manager"
  );
}

async function listSummaries(
  partnerId: string,
  deps: PartnerRequestServiceDeps
): Promise<PartnerRequestSummary[]> {
  if (deps.requests.listRequestSummaries) {
    return deps.requests.listRequestSummaries(partnerId);
  }
  const rows = await deps.requests.listRequests(partnerId);
  return rows.map((row: PartnerServiceRequest) => ({
    partnerId: row.partnerId,
    propertyPortalId: row.propertyPortalId,
    status: row.status,
    createdAt: row.createdAt
  }));
}
