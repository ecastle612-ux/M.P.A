import {
  PARTNER_OPPORTUNITY_NO_MATCH_COPY,
  PARTNER_OPPORTUNITY_ROUTE_LIMIT,
  PARTNER_OPPORTUNITY_TTL_MS,
  PARTNER_SERVICE_CATEGORY_LABELS,
  derivePartnerOnboarding,
  deriveOpportunityStatusFromRoutes,
  isPartnerOpportunityDeclineReason,
  locationMatchesOpportunity,
  mapCategoryToWorkOrderCategory,
  mapOpportunityUrgencyToWorkOrderPriority,
  mapWorkOrderCategoryToPartnerCategory,
  mapWorkOrderPriorityToOpportunityUrgency,
  opportunityAllowsPartnerResponse,
  opportunityAllowsReroute,
  opportunityAllowsSelection,
  opportunityIsExpired,
  parsePartnerOpportunityCreateInput,
  partnerEligibleForOpportunityRouting,
  partnerFacingOpportunityPrivacy,
  partnerOffersOpportunityCategory,
  selectPartnersForRouting,
  summarizePartnerOpportunityMetrics,
  summarizePlatformOpportunityAnalytics,
  type PartnerOpportunityCreateInput,
  type PartnerServiceCategory
} from "@mpa/shared";
import type { CanonicalPropertyRecord } from "./property-portal-types";
import type { PartnerStore, PlatformPartner } from "./types";
import type {
  PartnerOpportunityRoute,
  PartnerOpportunityStore,
  PartnerServiceOpportunity
} from "./opportunity-types";

export type OpportunityWorkOrderRef = {
  id: string;
  organizationId: string;
  propertyId: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  workSurface: "residential" | "facility";
  facilityAssetLabel?: string | null;
};

export type OpportunityNotificationKind =
  | "opportunity_routed"
  | "opportunity_interested"
  | "opportunity_declined"
  | "opportunity_selected"
  | "opportunity_closed";

export type OpportunityServiceDeps = {
  store: PartnerStore;
  opportunities: PartnerOpportunityStore;
  getProperty: (id: string) => Promise<CanonicalPropertyRecord | null>;
  listProperties: (organizationId: string) => Promise<CanonicalPropertyRecord[]>;
  listPropertyPortalCount: (partnerId: string) => Promise<number>;
  getWorkOrder?: (organizationId: string, workOrderId: string) => Promise<OpportunityWorkOrderRef | null>;
  createWorkOrder?: (input: {
    organizationId: string;
    actorUserId: string;
    surface: "residential" | "facility";
    title: string;
    description: string;
    category: string;
    priority: "low" | "normal" | "high";
    propertyId: string;
    locationLabel?: string | null;
  }) => Promise<{ id: string; workSurface: "residential" | "facility" }>;
  notifyPartnerEvent?: (input: {
    organizationId: string;
    partnerName: string;
    kind: OpportunityNotificationKind;
    title: string;
    body: string;
    href: string;
  }) => Promise<void>;
  notifyCustomerEvent?: (input: {
    organizationId: string;
    kind: OpportunityNotificationKind;
    title: string;
    body: string;
    href: string;
  }) => Promise<void>;
};

function nowIso(now?: Date): string {
  return (now ?? new Date()).toISOString();
}

function newId(): string {
  return crypto.randomUUID();
}

async function writeEvent(
  deps: OpportunityServiceDeps,
  input: {
    opportunityId: string;
    partnerId?: string | null;
    action: string;
    actorUserId?: string | null;
    payload?: Record<string, unknown>;
    now?: Date;
  }
): Promise<void> {
  await deps.opportunities.insertEvent({
    id: newId(),
    opportunityId: input.opportunityId,
    partnerId: input.partnerId ?? null,
    action: input.action,
    actorUserId: input.actorUserId ?? null,
    payload: input.payload ?? {},
    createdAt: nowIso(input.now)
  });
}

async function notifyPartnerSafe(
  deps: OpportunityServiceDeps,
  partner: PlatformPartner,
  input: { kind: OpportunityNotificationKind; title: string; body: string; href: string }
): Promise<void> {
  if (!partner.organizationId || !deps.notifyPartnerEvent) return;
  try {
    await deps.notifyPartnerEvent({
      organizationId: partner.organizationId,
      partnerName: partner.companyName,
      ...input
    });
  } catch {
    // Notifications must never fail routing writes.
  }
}

async function notifyCustomerSafe(
  deps: OpportunityServiceDeps,
  organizationId: string,
  input: { kind: OpportunityNotificationKind; title: string; body: string; href: string }
): Promise<void> {
  if (!deps.notifyCustomerEvent) return;
  try {
    await deps.notifyCustomerEvent({ organizationId, ...input });
  } catch {
    // Notifications must never fail opportunity writes.
  }
}

export async function expireOpportunityIfNeeded(
  opportunity: PartnerServiceOpportunity,
  deps: OpportunityServiceDeps,
  now = new Date()
): Promise<PartnerServiceOpportunity> {
  if (
    (opportunity.status === "open" ||
      opportunity.status === "routed" ||
      opportunity.status === "partner_interested") &&
    opportunityIsExpired(opportunity.expiresAt, now)
  ) {
    const closed: PartnerServiceOpportunity = {
      ...opportunity,
      status: "closed",
      closeReason: "expired",
      updatedAt: nowIso(now)
    };
    const saved = await deps.opportunities.updateOpportunity(closed);
    await writeEvent(deps, {
      opportunityId: saved.id,
      action: "expired",
      now
    });
    return saved;
  }
  return opportunity;
}

async function readinessForPartner(
  partner: PlatformPartner,
  deps: OpportunityServiceDeps
): Promise<ReturnType<typeof derivePartnerOnboarding>> {
  const [propertyPortalCount, events] = await Promise.all([
    deps.listPropertyPortalCount(partner.id),
    deps.store.listEvents(partner.id)
  ]);
  return derivePartnerOnboarding({
    status: partner.status,
    partnerType: partner.partnerType,
    organizationId: partner.organizationId,
    publicSlug: partner.publicSlug,
    publicPortalEnabled: partner.publicPortalEnabled,
    portalDescription: partner.portalDescription,
    phone: partner.phone,
    email: partner.email,
    website: partner.website,
    serviceArea: partner.serviceArea,
    servicesOffered: partner.servicesOffered,
    logoMediaId: partner.logoMediaId,
    invitationStatus: null,
    invitationAcceptedAt: null,
    propertyPortalCount,
    eventActions: events.map((event) => event.action)
  });
}

export async function listEligiblePartnersForOpportunity(
  input: {
    category: PartnerServiceCategory;
    city: string | null;
    region: string | null;
    postalCode: string | null;
    excludePartnerIds?: readonly string[];
  },
  deps: OpportunityServiceDeps
): Promise<PlatformPartner[]> {
  const partners = await deps.store.listPartners();
  const eligible: PlatformPartner[] = [];
  for (const partner of partners) {
    if (input.excludePartnerIds?.includes(partner.id)) continue;
    const snapshot = await readinessForPartner(partner, deps);
    if (
      !partnerEligibleForOpportunityRouting({
        status: partner.status,
        partnerType: partner.partnerType,
        readiness: snapshot.readiness
      })
    ) {
      continue;
    }
    if (!partnerOffersOpportunityCategory(partner.servicesOffered, input.category)) continue;
    if (
      !locationMatchesOpportunity(
        { city: input.city, region: input.region, postalCode: input.postalCode },
        { city: partner.city, state: partner.state, serviceArea: partner.serviceArea }
      )
    ) {
      continue;
    }
    eligible.push(partner);
  }
  return eligible;
}

async function routeToEligible(
  opportunity: PartnerServiceOpportunity,
  deps: OpportunityServiceDeps,
  actorUserId: string,
  now = new Date()
): Promise<{ opportunity: PartnerServiceOpportunity; routed: PartnerOpportunityRoute[]; noMatch: boolean }> {
  const existing = await deps.opportunities.listRoutes(opportunity.id);
  const eligible = await listEligiblePartnersForOpportunity(
    {
      category: opportunity.category,
      city: opportunity.city,
      region: opportunity.region,
      postalCode: opportunity.postalCode,
      excludePartnerIds: existing.map((row) => row.partnerId)
    },
    deps
  );
  const chosen = selectPartnersForRouting(eligible, [], PARTNER_OPPORTUNITY_ROUTE_LIMIT);
  const routed: PartnerOpportunityRoute[] = [];
  for (const partner of chosen) {
    const route = await deps.opportunities.insertRoute({
      id: newId(),
      opportunityId: opportunity.id,
      partnerId: partner.id,
      routedAt: nowIso(now),
      viewedAt: null,
      response: null,
      responseAt: null,
      declineReason: null,
      selected: false,
      createdAt: nowIso(now),
      updatedAt: nowIso(now)
    });
    routed.push(route);
    await writeEvent(deps, {
      opportunityId: opportunity.id,
      partnerId: partner.id,
      action: "routed",
      actorUserId,
      now
    });
    const city = opportunity.city ?? opportunity.region ?? "your area";
    await notifyPartnerSafe(deps, partner, {
      kind: "opportunity_routed",
      title: `New service opportunity — ${PARTNER_SERVICE_CATEGORY_LABELS[opportunity.category]} in ${city}`,
      body: "A matching M.P.A. organization is looking for a service partner. Interest does not assign the job.",
      href: "/partner/opportunities"
    });
  }

  if (routed.length === 0 && existing.length === 0) {
    await deps.opportunities.insertUnmetDemand({
      id: newId(),
      serviceCategory: opportunity.category,
      city: opportunity.city,
      region: opportunity.region,
      createdAt: nowIso(now)
    });
    await writeEvent(deps, { opportunityId: opportunity.id, action: "no_match", actorUserId, now });
    return { opportunity, routed, noMatch: true };
  }

  if (routed.length > 0 && (opportunity.status === "open" || opportunity.status === "routed")) {
    const next = await deps.opportunities.updateOpportunity({
      ...opportunity,
      status: "routed",
      updatedAt: nowIso(now)
    });
    return { opportunity: next, routed, noMatch: false };
  }
  return { opportunity, routed, noMatch: false };
}

export async function createAndRouteOpportunity(
  input: {
    organizationId: string;
    actorUserId: string;
    payload: unknown;
    defaultPropertyType: "residential" | "facility";
    now?: Date;
  },
  deps: OpportunityServiceDeps
): Promise<{
  opportunity: PartnerServiceOpportunity;
  routedCount: number;
  noMatch: boolean;
  noMatchCopy: string | null;
}> {
  const parsed = parsePartnerOpportunityCreateInput(input.payload);
  if (!parsed.ok) throw new Error(parsed.error);

  const now = input.now ?? new Date();
  let data: PartnerOpportunityCreateInput = parsed.data;
  let workOrder: OpportunityWorkOrderRef | null = null;

  if (data.workOrderId) {
    if (!deps.getWorkOrder) throw new Error("Work order lookup is unavailable.");
    workOrder = await deps.getWorkOrder(input.organizationId, data.workOrderId);
    if (!workOrder || workOrder.organizationId !== input.organizationId) {
      throw new Error("Work order was not found.");
    }
    const open = await deps.opportunities.listOpenForWorkOrder(input.organizationId, workOrder.id);
    if (open.length > 0) {
      throw new Error("An open service opportunity already exists for this work order.");
    }
    data = {
      ...data,
      propertyId: workOrder.propertyId,
      category: mapWorkOrderCategoryToPartnerCategory(workOrder.category),
      description: workOrder.description || workOrder.title,
      urgency: mapWorkOrderPriorityToOpportunityUrgency(workOrder.priority),
      propertyType: workOrder.workSurface,
      unitLabel: data.unitLabel ?? workOrder.facilityAssetLabel ?? null
    };
  }

  const property = await deps.getProperty(data.propertyId);
  if (!property || property.organizationId !== input.organizationId) {
    throw new Error("Property was not found.");
  }

  const opportunity = await deps.opportunities.insertOpportunity({
    id: newId(),
    organizationId: input.organizationId,
    requestedByUserId: input.actorUserId,
    propertyId: property.id,
    unitLabel: data.unitLabel ?? null,
    workOrderId: workOrder?.id ?? data.workOrderId ?? null,
    propertyType: data.propertyType ?? input.defaultPropertyType,
    category: data.category,
    description: data.description,
    urgency: data.urgency,
    preferredTiming: data.preferredTiming ?? null,
    city: property.city,
    region: property.region,
    postalCode: property.postalCode,
    status: "open",
    selectedPartnerId: null,
    selectedBy: null,
    selectedAt: null,
    closeReason: null,
    expiresAt: new Date(now.getTime() + PARTNER_OPPORTUNITY_TTL_MS).toISOString(),
    createdAt: nowIso(now),
    updatedAt: nowIso(now)
  });
  await writeEvent(deps, {
    opportunityId: opportunity.id,
    action: "created",
    actorUserId: input.actorUserId,
    payload: { workOrderId: opportunity.workOrderId },
    now
  });

  const routed = await routeToEligible(opportunity, deps, input.actorUserId, now);
  return {
    opportunity: routed.opportunity,
    routedCount: routed.routed.length,
    noMatch: routed.noMatch,
    noMatchCopy: routed.noMatch ? PARTNER_OPPORTUNITY_NO_MATCH_COPY : null
  };
}

export async function listOrganizationOpportunities(
  organizationId: string,
  deps: OpportunityServiceDeps,
  now = new Date()
) {
  const rows = await deps.opportunities.listOpportunities(organizationId);
  const out = [];
  for (const row of rows) {
    const opportunity = await expireOpportunityIfNeeded(row, deps, now);
    const routes = await deps.opportunities.listRoutes(opportunity.id);
    const partners = await Promise.all(routes.map((route) => deps.store.getPartner(route.partnerId)));
    out.push({
      opportunity,
      routes: routes.map((route, index) => ({
        route,
        partner: publicPartnerCard(partners[index] ?? null)
      }))
    });
  }
  return out;
}

export function publicPartnerCard(partner: PlatformPartner | null) {
  if (!partner) return null;
  return {
    id: partner.id,
    companyName: partner.companyName,
    servicesOffered: partner.servicesOffered,
    serviceArea: partner.serviceArea,
    website: partner.website,
    phone: partner.phone,
    email: partner.email,
    logoMediaId: partner.logoMediaId,
    partnerType: partner.partnerType,
    status: partner.status,
    publicPortalEnabled: partner.publicPortalEnabled
  };
}

export async function getOrganizationOpportunity(
  organizationId: string,
  opportunityId: string,
  deps: OpportunityServiceDeps,
  now = new Date()
) {
  const found = await deps.opportunities.getOpportunity(opportunityId);
  if (!found || found.organizationId !== organizationId) return null;
  const opportunity = await expireOpportunityIfNeeded(found, deps, now);
  const routes = await deps.opportunities.listRoutes(opportunity.id);
  const partners = await Promise.all(routes.map((route) => deps.store.getPartner(route.partnerId)));
  return {
    opportunity,
    routes: routes.map((route, index) => ({
      route,
      partner: publicPartnerCard(partners[index] ?? null)
    })),
    events: await deps.opportunities.listEvents(opportunity.id)
  };
}

export async function closeOrCancelOpportunity(
  input: {
    organizationId: string;
    opportunityId: string;
    actorUserId: string;
    action: "close" | "cancel";
    now?: Date;
  },
  deps: OpportunityServiceDeps
): Promise<PartnerServiceOpportunity> {
  const found = await deps.opportunities.getOpportunity(input.opportunityId);
  if (!found || found.organizationId !== input.organizationId) {
    throw new Error("Opportunity was not found.");
  }
  const now = input.now ?? new Date();
  const opportunity = await expireOpportunityIfNeeded(found, deps, now);
  if (opportunity.status === "partner_selected" || opportunity.status === "closed" || opportunity.status === "cancelled") {
    throw new Error("This opportunity can no longer be changed.");
  }
  const next: PartnerServiceOpportunity = {
    ...opportunity,
    status: input.action === "cancel" ? "cancelled" : "closed",
    closeReason: input.action === "cancel" ? null : "manual",
    updatedAt: nowIso(now)
  };
  const saved = await deps.opportunities.updateOpportunity(next);
  await writeEvent(deps, {
    opportunityId: saved.id,
    action: input.action === "cancel" ? "cancelled" : "closed",
    actorUserId: input.actorUserId,
    now
  });
  await notifyCustomerSafe(deps, saved.organizationId, {
    kind: "opportunity_closed",
    title: input.action === "cancel" ? "Service opportunity cancelled" : "Service opportunity closed",
    body: "The service opportunity is no longer accepting partner responses.",
    href: saved.propertyType === "facility" ? "/facility/service-network" : "/pm/service-network"
  });
  return saved;
}

export async function rerouteOpportunity(
  input: { organizationId: string; opportunityId: string; actorUserId: string; now?: Date },
  deps: OpportunityServiceDeps
) {
  const found = await deps.opportunities.getOpportunity(input.opportunityId);
  if (!found || found.organizationId !== input.organizationId) {
    throw new Error("Opportunity was not found.");
  }
  const now = input.now ?? new Date();
  const opportunity = await expireOpportunityIfNeeded(found, deps, now);
  if (!opportunityAllowsReroute(opportunity.status) || opportunityIsExpired(opportunity.expiresAt, now)) {
    throw new Error("This opportunity can no longer be routed.");
  }
  const routed = await routeToEligible(opportunity, deps, input.actorUserId, now);
  return {
    opportunity: routed.opportunity,
    routedCount: routed.routed.length,
    noMatch: routed.noMatch,
    noMatchCopy: routed.noMatch || routed.routed.length === 0 ? PARTNER_OPPORTUNITY_NO_MATCH_COPY : null
  };
}

export async function selectInterestedPartner(
  input: {
    organizationId: string;
    opportunityId: string;
    actorUserId: string;
    partnerId: string;
    now?: Date;
  },
  deps: OpportunityServiceDeps
) {
  const found = await deps.opportunities.getOpportunity(input.opportunityId);
  if (!found || found.organizationId !== input.organizationId) {
    throw new Error("Opportunity was not found.");
  }
  const now = input.now ?? new Date();
  const opportunity = await expireOpportunityIfNeeded(found, deps, now);
  if (!opportunityAllowsSelection(opportunity.status) || opportunityIsExpired(opportunity.expiresAt, now)) {
    throw new Error("This opportunity is not available for selection.");
  }
  const routes = await deps.opportunities.listRoutes(opportunity.id);
  const chosen = routes.find((route) => route.partnerId === input.partnerId);
  if (!chosen || chosen.response !== "interested") {
    throw new Error("Select an interested Partner.");
  }
  for (const route of routes) {
    const selected = route.id === chosen.id;
    await deps.opportunities.updateRoute({
      ...route,
      selected,
      response: selected ? "interested" : route.response === "declined" ? "declined" : "not_selected",
      responseAt: route.responseAt ?? (selected ? nowIso(now) : route.responseAt),
      updatedAt: nowIso(now)
    });
  }
  const saved = await deps.opportunities.updateOpportunity({
    ...opportunity,
    status: "partner_selected",
    selectedPartnerId: chosen.partnerId,
    selectedBy: input.actorUserId,
    selectedAt: nowIso(now),
    updatedAt: nowIso(now)
  });
  await writeEvent(deps, {
    opportunityId: saved.id,
    partnerId: chosen.partnerId,
    action: "partner_selected",
    actorUserId: input.actorUserId,
    now
  });
  await notifyCustomerSafe(deps, saved.organizationId, {
    kind: "opportunity_selected",
    title: "Service partner selected",
    body: PARTNER_SERVICE_CATEGORY_LABELS[saved.category] + " — confirm scope and terms directly with the Partner.",
    href: saved.propertyType === "facility" ? "/facility/service-network" : "/pm/service-network"
  });
  return saved;
}

export async function createWorkOrderFromOpportunity(
  input: { organizationId: string; opportunityId: string; actorUserId: string; now?: Date },
  deps: OpportunityServiceDeps
) {
  const found = await deps.opportunities.getOpportunity(input.opportunityId);
  if (!found || found.organizationId !== input.organizationId) {
    throw new Error("Opportunity was not found.");
  }
  if (found.workOrderId) {
    return { workOrderId: found.workOrderId, created: false };
  }
  if (found.status !== "partner_selected") {
    throw new Error("Create a work order after selecting a Partner.");
  }
  if (!deps.createWorkOrder) throw new Error("Work-order conversion is unavailable.");
  const partner = found.selectedPartnerId ? await deps.store.getPartner(found.selectedPartnerId) : null;
  const created = await deps.createWorkOrder({
    organizationId: input.organizationId,
    actorUserId: input.actorUserId,
    surface: found.propertyType,
    title: `${PARTNER_SERVICE_CATEGORY_LABELS[found.category]} service`,
    description: partner
      ? `${found.description}\n\nPreferred service partner: ${partner.companyName}. Confirm scope, pricing, scheduling and service terms directly with the Partner.`
      : found.description,
    category: mapCategoryToWorkOrderCategory(found.category),
    priority: mapOpportunityUrgencyToWorkOrderPriority(found.urgency),
    propertyId: found.propertyId,
    locationLabel: found.unitLabel
  });
  const now = input.now ?? new Date();
  await deps.opportunities.updateOpportunity({
    ...found,
    workOrderId: created.id,
    updatedAt: nowIso(now)
  });
  await writeEvent(deps, {
    opportunityId: found.id,
    action: "work_order_created",
    actorUserId: input.actorUserId,
    payload: { workOrderId: created.id },
    now
  });
  return { workOrderId: created.id, created: true, workSurface: created.workSurface };
}

export async function listPartnerOpportunities(
  partnerId: string,
  deps: OpportunityServiceDeps,
  now = new Date()
) {
  const routes = await deps.opportunities.listRoutesForPartner(partnerId);
  const partner = await deps.store.getPartner(partnerId);
  const items = [];
  for (const route of routes) {
    const found = await deps.opportunities.getOpportunity(route.opportunityId);
    if (!found) continue;
    const opportunity = await expireOpportunityIfNeeded(found, deps, now);
    items.push({
      route,
      privacy: partnerFacingOpportunityPrivacy(opportunity),
      status: opportunity.status,
      routedAt: route.routedAt,
      response: route.response,
      selected: route.selected,
      partnerStatus: partner?.status ?? "applied"
    });
  }
  return {
    items,
    metrics: summarizePartnerOpportunityMetrics(routes)
  };
}

export async function getPartnerOpportunity(
  partnerId: string,
  opportunityId: string,
  deps: OpportunityServiceDeps,
  now = new Date()
) {
  const routes = await deps.opportunities.listRoutesForPartner(partnerId);
  const route = routes.find((row) => row.opportunityId === opportunityId);
  if (!route) return null;
  const found = await deps.opportunities.getOpportunity(opportunityId);
  if (!found) return null;
  const opportunity = await expireOpportunityIfNeeded(found, deps, now);
  if (!route.viewedAt) {
    await deps.opportunities.updateRoute({ ...route, viewedAt: nowIso(now), updatedAt: nowIso(now) });
  }
  const partner = await deps.store.getPartner(partnerId);
  return {
    route: { ...route, viewedAt: route.viewedAt ?? nowIso(now) },
    privacy: partnerFacingOpportunityPrivacy(opportunity),
    status: opportunity.status,
    expiresAt: opportunity.expiresAt,
    allowsResponse: opportunityAllowsPartnerResponse({
      status: opportunity.status,
      expiresAt: opportunity.expiresAt,
      partnerStatus: partner?.status ?? "applied",
      now
    }),
    interestCopy:
      "I'm Interested records interest only. It does not assign the job, create a contract, create payment, or guarantee selection."
  };
}

export async function respondToOpportunity(
  input: {
    partnerId: string;
    opportunityId: string;
    actorUserId: string;
    response: "interested" | "declined";
    declineReason?: string | null;
    now?: Date;
  },
  deps: OpportunityServiceDeps
) {
  const partner = await deps.store.getPartner(input.partnerId);
  if (!partner) throw new Error("Partner was not found.");
  const routes = await deps.opportunities.listRoutesForPartner(input.partnerId);
  const route = routes.find((row) => row.opportunityId === input.opportunityId);
  if (!route) throw new Error("Opportunity was not found.");
  const found = await deps.opportunities.getOpportunity(input.opportunityId);
  if (!found) throw new Error("Opportunity was not found.");
  const now = input.now ?? new Date();
  const opportunity = await expireOpportunityIfNeeded(found, deps, now);
  if (
    !opportunityAllowsPartnerResponse({
      status: opportunity.status,
      expiresAt: opportunity.expiresAt,
      partnerStatus: partner.status,
      now
    })
  ) {
    throw new Error("This opportunity is no longer accepting responses.");
  }
  if (route.response) throw new Error("A response was already recorded.");
  const declineReason =
    input.response === "declined" && isPartnerOpportunityDeclineReason(input.declineReason)
      ? input.declineReason
      : input.response === "declined"
        ? "other"
        : null;
  const updated = await deps.opportunities.updateRoute({
    ...route,
    response: input.response,
    responseAt: nowIso(now),
    declineReason,
    viewedAt: route.viewedAt ?? nowIso(now),
    updatedAt: nowIso(now)
  });
  const allRoutes = await deps.opportunities.listRoutes(opportunity.id);
  const nextStatus = deriveOpportunityStatusFromRoutes(opportunity.status, allRoutes);
  const saved = await deps.opportunities.updateOpportunity({
    ...opportunity,
    status: nextStatus,
    updatedAt: nowIso(now)
  });
  await writeEvent(deps, {
    opportunityId: saved.id,
    partnerId: partner.id,
    action: input.response === "interested" ? "interested" : "declined",
    actorUserId: input.actorUserId,
    payload: declineReason ? { declineReason } : {},
    now
  });
  await notifyCustomerSafe(deps, saved.organizationId, {
    kind: input.response === "interested" ? "opportunity_interested" : "opportunity_declined",
    title:
      input.response === "interested"
        ? `Partner interested — ${PARTNER_SERVICE_CATEGORY_LABELS[saved.category]}`
        : `Partner declined — ${PARTNER_SERVICE_CATEGORY_LABELS[saved.category]}`,
    body:
      input.response === "interested"
        ? `${partner.companyName} expressed interest. Selection does not create a contract or payment.`
        : `${partner.companyName} declined this opportunity.`,
    href: saved.propertyType === "facility" ? "/facility/service-network" : "/pm/service-network"
  });
  return { opportunity: saved, route: updated };
}

export async function listAdminOpportunityOversight(deps: OpportunityServiceDeps, now = new Date()) {
  const opportunities = await deps.opportunities.listOpportunities();
  const unmet = await deps.opportunities.listUnmetDemand();
  const allRoutes = [];
  const rows = [];
  for (const row of opportunities) {
    const opportunity = await expireOpportunityIfNeeded(row, deps, now);
    const routes = await deps.opportunities.listRoutes(opportunity.id);
    allRoutes.push(...routes);
    rows.push({
      id: opportunity.id,
      organizationId: opportunity.organizationId,
      status: opportunity.status,
      category: opportunity.category,
      city: opportunity.city,
      region: opportunity.region,
      closeReason: opportunity.closeReason,
      createdAt: opportunity.createdAt,
      expiresAt: opportunity.expiresAt,
      selectedPartnerId: opportunity.selectedPartnerId,
      routedCount: routes.length,
      interestedCount: routes.filter((route) => route.response === "interested").length,
      declinedCount: routes.filter((route) => route.response === "declined").length
    });
  }
  return {
    opportunities: rows,
    unmetDemand: unmet.map((row) => ({
      serviceCategory: row.serviceCategory,
      city: row.city,
      region: row.region,
      createdAt: row.createdAt
    })),
    analytics: summarizePlatformOpportunityAnalytics(
      opportunities.map((row) => ({
        status: row.status,
        category: row.category,
        city: row.city,
        region: row.region,
        closeReason: row.closeReason
      })),
      allRoutes,
      unmet.length
    )
  };
}
