import { createHash, randomBytes } from "node:crypto";
import {
  categoriesForPartnerServices,
  mapCategoryToWorkOrderCategory,
  mapUrgencyToWorkOrderPriority,
  parsePartnerServiceRequestInput,
  partnerPortalIsLive,
  type PartnerRequestStatus
} from "@mpa/shared";
import type { PartnerServiceDeps } from "./service";
import { defaultPartnerDeps } from "./service";
import { getMemoryPartnerRequestStore } from "./request-store";
import type { PartnerRequestStore, PartnerServiceRequest } from "./request-types";
import type { PartnerPropertyPortalStore, PropertyCatalog } from "./property-portal-types";
import { getMemoryPartnerPropertyPortalStore, getMemoryPropertyCatalog } from "./property-portal-store";
import { formatCanonicalPropertyAddress, normalizePartnerPropertySlug } from "@mpa/shared";

export type ConvertWorkOrderFn = (input: {
  organizationId: string;
  actorUserId: string;
  surface: "facility" | "residential";
  propertyId: string;
  title: string;
  description: string;
  category: string;
  priority: "low" | "normal" | "high";
  locationLabel: string | null;
  unitLabel: string | null;
}) => Promise<{ id: string; workSurface: "facility" | "residential" }>;

export type PartnerRequestServiceDeps = PartnerServiceDeps & {
  requests: PartnerRequestStore;
  propertyPortals?: PartnerPropertyPortalStore;
  properties?: PropertyCatalog;
  convertWorkOrder?: ConvertWorkOrderFn;
  rebindMedia?: (input: {
    organizationId: string;
    mediaIds: string[];
    requestId: string;
    workOrderId: string;
  }) => Promise<void>;
  notifyNewRequest?: (input: {
    organizationId: string;
    partnerName: string;
    publicRef: string;
    propertyName?: string | null;
  }) => Promise<void>;
  attachMedia?: (input: {
    organizationId: string;
    requestId: string;
    mediaIds: string[];
  }) => Promise<number>;
};

export function defaultPartnerRequestDeps(): PartnerRequestServiceDeps {
  return {
    ...defaultPartnerDeps(),
    requests: getMemoryPartnerRequestStore(),
    propertyPortals: getMemoryPartnerPropertyPortalStore(),
    properties: getMemoryPropertyCatalog()
  };
}

function nowIso(): string {
  return new Date().toISOString();
}

function newId(): string {
  return crypto.randomUUID();
}

export function hashPartnerStatusToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function generatePartnerStatusToken(): string {
  return randomBytes(24).toString("base64url");
}

export function publicPartnerUnavailable() {
  return { error: "This request link is not available." };
}

export async function resolveLivePartnerPortal(
  slug: string,
  deps: PartnerRequestServiceDeps = defaultPartnerRequestDeps()
) {
  const partner = await deps.store.getPartnerBySlug(slug);
  if (!partner || !partnerPortalIsLive(partner)) {
    return null;
  }
  return {
    partner,
    public: {
      companyName: partner.companyName,
      serviceArea: partner.serviceArea,
      contactPhone: partner.phone,
      contactEmail: partner.email,
      description: partner.portalDescription ?? partner.notes,
      slug: partner.publicSlug!,
      categories: categoriesForPartnerServices(partner.servicesOffered),
      title: `Service Requests — ${partner.companyName}`,
      poweredBy: "Powered by M.P.A.",
      hasLogo: Boolean(partner.logoMediaId),
      logoUrl: partner.logoMediaId && partner.publicSlug
        ? `/api/public/partners/${encodeURIComponent(partner.publicSlug)}/logo`
        : null
    }
  };
}

export async function submitPartnerServiceRequest(
  slug: string,
  payload: unknown,
  deps: PartnerRequestServiceDeps = defaultPartnerRequestDeps()
): Promise<
  | { ok: true; spam?: boolean; publicRef?: string; statusToken?: string }
  | { ok: false; error: string; unavailable?: boolean }
> {
  const parsed = parsePartnerServiceRequestInput(payload);
  if (!parsed.ok) {
    if (parsed.error === "spam") return { ok: true, spam: true };
    return parsed;
  }
  const live = await resolveLivePartnerPortal(slug, deps);
  if (!live) {
    return { ok: false, error: "This request link is not available.", unavailable: true };
  }
  const statusToken = generatePartnerStatusToken();
  const row: PartnerServiceRequest = {
    id: newId(),
    partnerId: live.partner.id,
    organizationId: live.partner.organizationId!,
    publicRef: await deps.requests.nextPublicRef(),
    statusTokenHash: hashPartnerStatusToken(statusToken),
    slugSnapshot: live.partner.publicSlug!,
    propertySlug: parsed.data.propertySlug,
    propertyPortalId: null,
    propertyId: null,
    intakeSource: "generic_portal",
    status: "submitted",
    requesterName: parsed.data.requesterName,
    requesterEmail: parsed.data.requesterEmail,
    requesterPhone: parsed.data.requesterPhone,
    propertyAddress: parsed.data.propertyAddress,
    unitLabel: parsed.data.unitLabel,
    category: parsed.data.category,
    description: parsed.data.description,
    urgency: parsed.data.urgency,
    convertedWorkOrderId: null,
    convertedWorkSurface: null,
    convertedBy: null,
    convertedAt: null,
    declinedReason: null,
    createdAt: nowIso(),
    updatedAt: nowIso()
  };
  await deps.requests.insertRequest(row);
  const mediaIds = extractMediaIds(payload);
  let mediaCount = 0;
  if (mediaIds.length && deps.attachMedia) {
    mediaCount = await deps.attachMedia({
      organizationId: row.organizationId,
      requestId: row.id,
      mediaIds
    });
  }
  await deps.requests.insertEvent({
    id: newId(),
    requestId: row.id,
    partnerId: row.partnerId,
    action: "submitted",
    actorUserId: null,
    payload: { publicRef: row.publicRef, slug: row.slugSnapshot, mediaCount },
    createdAt: nowIso()
  });
  if (deps.notifyNewRequest) {
    await deps.notifyNewRequest({
      organizationId: row.organizationId,
      partnerName: live.partner.companyName,
      publicRef: row.publicRef
    });
  }
  return { ok: true, publicRef: row.publicRef, statusToken };
}

export async function submitPartnerPropertyServiceRequest(
  partnerSlug: string,
  propertySlug: string,
  payload: unknown,
  deps: PartnerRequestServiceDeps = defaultPartnerRequestDeps()
): Promise<
  | { ok: true; spam?: boolean; publicRef?: string; statusToken?: string }
  | { ok: false; error: string; unavailable?: boolean }
> {
  const parsed = parsePartnerServiceRequestInput(payload, { requirePropertyAddress: false });
  if (!parsed.ok) {
    if (parsed.error === "spam") return { ok: true, spam: true };
    return parsed;
  }
  const live = await resolveLivePartnerPortal(partnerSlug, deps);
  if (!live || !deps.propertyPortals || !deps.properties) {
    return { ok: false, error: "This request link is not available.", unavailable: true };
  }
  const slug = normalizePartnerPropertySlug(propertySlug);
  const portal = await deps.propertyPortals.getPortalByPartnerAndSlug(live.partner.id, slug);
  if (!portal || !portal.enabled || portal.organizationId !== live.partner.organizationId) {
    return { ok: false, error: "This request link is not available.", unavailable: true };
  }
  const property = await deps.properties.getProperty(portal.propertyId);
  if (!property || property.organizationId !== live.partner.organizationId) {
    return { ok: false, error: "This request link is not available.", unavailable: true };
  }
  const publicName = portal.publicDisplayName?.trim() || property.name;
  const address = formatCanonicalPropertyAddress(property) || publicName;
  const statusToken = generatePartnerStatusToken();
  const row: PartnerServiceRequest = {
    id: newId(),
    partnerId: live.partner.id,
    organizationId: live.partner.organizationId!,
    publicRef: await deps.requests.nextPublicRef(),
    statusTokenHash: hashPartnerStatusToken(statusToken),
    slugSnapshot: live.partner.publicSlug!,
    propertySlug: portal.publicSlug,
    propertyPortalId: portal.id,
    propertyId: property.id,
    intakeSource: "property_portal",
    status: "submitted",
    requesterName: parsed.data.requesterName,
    requesterEmail: parsed.data.requesterEmail,
    requesterPhone: parsed.data.requesterPhone,
    propertyAddress: address,
    unitLabel: parsed.data.unitLabel,
    category: parsed.data.category,
    description: parsed.data.description,
    urgency: parsed.data.urgency,
    convertedWorkOrderId: null,
    convertedWorkSurface: null,
    convertedBy: null,
    convertedAt: null,
    declinedReason: null,
    createdAt: nowIso(),
    updatedAt: nowIso()
  };
  await deps.requests.insertRequest(row);
  const mediaIds = extractMediaIds(payload);
  let mediaCount = 0;
  if (mediaIds.length && deps.attachMedia) {
    mediaCount = await deps.attachMedia({
      organizationId: row.organizationId,
      requestId: row.id,
      mediaIds
    });
  }
  await deps.requests.insertEvent({
    id: newId(),
    requestId: row.id,
    partnerId: row.partnerId,
    action: "submitted",
    actorUserId: null,
    payload: {
      publicRef: row.publicRef,
      slug: row.slugSnapshot,
      propertySlug: row.propertySlug,
      intakeSource: row.intakeSource,
      mediaCount
    },
    createdAt: nowIso()
  });
  if (deps.notifyNewRequest) {
    await deps.notifyNewRequest({
      organizationId: row.organizationId,
      partnerName: live.partner.companyName,
      publicRef: row.publicRef,
      propertyName: publicName
    });
  }
  return { ok: true, publicRef: row.publicRef, statusToken };
}

function extractMediaIds(payload: unknown): string[] {
  if (!payload || typeof payload !== "object") return [];
  const raw = (payload as Record<string, unknown>)["mediaIds"];
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((id): id is string => typeof id === "string" && /^[0-9a-f-]{36}$/i.test(id))
    .slice(0, 8);
}

export async function loadPartnerRequestPublicStatus(
  statusToken: string,
  deps: PartnerRequestServiceDeps = defaultPartnerRequestDeps()
) {
  const row = await deps.requests.getRequestByStatusHash(hashPartnerStatusToken(statusToken));
  if (!row) return null;
  const coarse =
    row.status === "converted"
      ? { status: "in_progress", statusLabel: "In progress" }
      : row.status === "declined" || row.status === "cancelled"
        ? { status: "closed", statusLabel: "Closed" }
        : { status: "received", statusLabel: "Received" };
  return {
    requestNumber: row.publicRef,
    submittedAt: row.createdAt,
    title: "Service request",
    category: row.category.replaceAll("_", " "),
    location: [row.propertyAddress, row.unitLabel].filter(Boolean).join(" · "),
    ...coarse
  };
}

export async function listPartnerRequestsForOrganization(
  organizationId: string,
  deps: PartnerRequestServiceDeps = defaultPartnerRequestDeps()
) {
  const partners = (await deps.store.listPartners()).filter(
    (row) => row.organizationId === organizationId
  );
  const requests: PartnerServiceRequest[] = [];
  for (const partner of partners) {
    requests.push(...(await deps.requests.listRequests(partner.id)));
  }
  return { partners, requests: requests.sort((a, b) => b.createdAt.localeCompare(a.createdAt)) };
}

export async function getPartnerRequestAuthorized(
  requestId: string,
  organizationId: string,
  deps: PartnerRequestServiceDeps = defaultPartnerRequestDeps()
): Promise<PartnerServiceRequest | null> {
  const row = await deps.requests.getRequest(requestId);
  if (!row || row.organizationId !== organizationId) return null;
  return row;
}

export async function mutatePartnerRequest(
  input: {
    requestId: string;
    organizationId: string;
    actorUserId: string;
    action: "review" | "accept" | "decline" | "convert";
    declinedReason?: string;
    propertyId?: string;
    entitlements?: readonly string[];
  },
  deps: PartnerRequestServiceDeps = defaultPartnerRequestDeps()
): Promise<
  | { ok: true; request: PartnerServiceRequest }
  | { ok: false; error: string; code?: "not_found" | "conflict" | "forbidden" }
> {
  const row = await getPartnerRequestAuthorized(input.requestId, input.organizationId, deps);
  if (!row) {
    return { ok: false, error: "Request not found.", code: "not_found" };
  }

  if (input.action === "convert" && row.status === "converted" && row.convertedWorkOrderId) {
    return { ok: true, request: row };
  }

  const next: PartnerServiceRequest = { ...row, updatedAt: nowIso() };

  if (input.action === "review") {
    if (row.status !== "submitted") {
      return { ok: false, error: "Only new requests can move to review.", code: "conflict" };
    }
    next.status = "under_review";
  } else if (input.action === "accept") {
    if (row.status !== "submitted" && row.status !== "under_review") {
      return { ok: false, error: "Only new or reviewed requests can be accepted.", code: "conflict" };
    }
    next.status = "accepted";
  } else if (input.action === "decline") {
    if (row.status === "converted") {
      return { ok: false, error: "Converted requests cannot be declined.", code: "conflict" };
    }
    next.status = "declined";
    next.declinedReason = input.declinedReason?.trim() || "Declined";
  } else if (input.action === "convert") {
    if (row.status === "declined" || row.status === "cancelled") {
      return { ok: false, error: "Declined requests cannot be converted.", code: "conflict" };
    }
    const propertyId =
      row.intakeSource === "property_portal" && row.propertyId ? row.propertyId : input.propertyId;
    if (!propertyId) {
      return { ok: false, error: "Select a property before converting." };
    }
    if (deps.properties) {
      const property = await deps.properties.getProperty(propertyId);
      if (property && property.organizationId !== row.organizationId) {
        return { ok: false, error: "Select a property before converting." };
      }
      if (row.intakeSource === "property_portal" && !property) {
        return { ok: false, error: "Select a property before converting." };
      }
    }
    const entitlements = input.entitlements ?? [];
    const surface = entitlements.includes("facility.operations")
      ? "facility"
      : entitlements.includes("pm.maintenance")
        ? "residential"
        : null;
    if (!surface) {
      return {
        ok: false,
        error: "This workspace cannot convert service requests to a work order.",
        code: "forbidden"
      };
    }
    if (!deps.convertWorkOrder) {
      return { ok: false, error: "Work-order conversion is unavailable.", code: "forbidden" };
    }
    const workOrder = await deps.convertWorkOrder({
      organizationId: row.organizationId,
      actorUserId: input.actorUserId,
      surface,
      propertyId,
      title: `${row.category.replaceAll("_", " ")} — ${row.propertyAddress}`.slice(0, 160),
      description: [
        row.description,
        `Requester: ${row.requesterName}`,
        row.requesterEmail ? `Email: ${row.requesterEmail}` : null,
        row.requesterPhone ? `Phone: ${row.requesterPhone}` : null,
        `Address: ${row.propertyAddress}`,
        row.unitLabel ? `Unit: ${row.unitLabel}` : null,
        `Public ref: ${row.publicRef}`
      ]
        .filter(Boolean)
        .join("\n"),
      category: mapCategoryToWorkOrderCategory(row.category),
      priority: mapUrgencyToWorkOrderPriority(row.urgency),
      locationLabel: row.propertyAddress,
      unitLabel: row.unitLabel
    });
    next.status = "converted";
    next.convertedWorkOrderId = workOrder.id;
    next.convertedWorkSurface = workOrder.workSurface;
    next.convertedBy = input.actorUserId;
    next.convertedAt = nowIso();
    if (deps.rebindMedia) {
      await deps.rebindMedia({
        organizationId: row.organizationId,
        mediaIds: [],
        requestId: row.id,
        workOrderId: workOrder.id
      });
    }
  }

  await deps.requests.updateRequest(next);
  await deps.requests.insertEvent({
    id: newId(),
    requestId: next.id,
    partnerId: next.partnerId,
    action: input.action,
    actorUserId: input.actorUserId,
    payload: {
      from: row.status,
      to: next.status,
      workOrderId: next.convertedWorkOrderId
    },
    createdAt: nowIso()
  });
  return { ok: true, request: next };
}

export function assertPartnerTypeCanEnablePortal(type: string): boolean {
  return type === "certified_service" || type === "strategic";
}

export function requestQueueStatus(status: PartnerRequestStatus): "new" | "accepted" | "converted" | "declined" {
  if (status === "submitted" || status === "under_review") return "new";
  if (status === "accepted") return "accepted";
  if (status === "converted") return "converted";
  return "declined";
}
