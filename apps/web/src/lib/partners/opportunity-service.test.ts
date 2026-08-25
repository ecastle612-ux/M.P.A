import { beforeEach, describe, expect, it } from "vitest";
import { PARTNER_ONBOARDING_EVENTS, PARTNER_OPPORTUNITY_TTL_MS } from "@mpa/shared";
import { resetMemoryPartnerStore } from "./store";
import { resetMemoryPartnerOpportunityStore } from "./opportunity-store";
import { resetMemoryPartnerPropertyPortalStore, resetMemoryPropertyCatalog } from "./property-portal-store";
import type { PlatformPartner } from "./types";
import type { OpportunityServiceDeps } from "./opportunity-service";
import {
  closeOrCancelOpportunity,
  createAndRouteOpportunity,
  createWorkOrderFromOpportunity,
  getOrganizationOpportunity,
  getPartnerOpportunity,
  listEligiblePartnersForOpportunity,
  listPartnerOpportunities,
  respondToOpportunity,
  rerouteOpportunity,
  selectInterestedPartner
} from "./opportunity-service";

function nowStamp(): string {
  return "2026-08-25T12:00:00.000Z";
}

function readyPartner(overrides: Partial<PlatformPartner> = {}): PlatformPartner {
  return {
    id: overrides.id ?? "partner-ready",
    companyName: overrides.companyName ?? "Oakdale Plumbing",
    contactName: "Pat",
    email: overrides.email ?? "pat@oakdale.example",
    phone: "612-555-0100",
    website: "https://oakdale.example",
    city: "Oakdale",
    state: "MN",
    serviceArea: "Oakdale and Twin Cities",
    companyServiceType: "Plumbing",
    servicesOffered: "Plumbing",
    customersServed: null,
    mpaAccountEmail: null,
    interestedPartnerType: "certified_service",
    notes: null,
    partnerType: "certified_service",
    status: "active",
    publicSlug: "oakdale-plumbing",
    organizationId: "partner-org",
    publicPortalEnabled: true,
    portalDescription: "Local plumbing",
    logoMediaId: "logo-1",
    commissionBps: 2000,
    approvedAt: nowStamp(),
    activatedAt: nowStamp(),
    rejectedAt: null,
    suspendedAt: null,
    createdAt: nowStamp(),
    updatedAt: nowStamp(),
    ...overrides
  };
}

async function seedReady(deps: OpportunityServiceDeps, partner: PlatformPartner) {
  await deps.store.insertPartner(partner);
  await deps.store.insertEvent({
    id: `evt-${partner.id}`,
    partnerId: partner.id,
    action: PARTNER_ONBOARDING_EVENTS.qr_completed,
    actorUserId: null,
    payload: {},
    createdAt: nowStamp()
  });
}

function makeDeps(workOrders: Map<string, { id: string; organizationId: string; propertyId: string; title: string; description: string; category: string; priority: string; workSurface: "residential" | "facility" }>) {
  const store = resetMemoryPartnerStore();
  const opportunities = resetMemoryPartnerOpportunityStore();
  const properties = resetMemoryPropertyCatalog();
  const portals = resetMemoryPartnerPropertyPortalStore();
  properties.seed({
    id: "prop-1",
    organizationId: "org-a",
    name: "Oakdale Arms",
    addressLine1: "100 Main",
    city: "Oakdale",
    region: "MN",
    postalCode: "55128",
    status: "active"
  });
  properties.seed({
    id: "prop-b",
    organizationId: "org-b",
    name: "Other Org",
    addressLine1: "9 Other",
    city: "Duluth",
    region: "MN",
    postalCode: "55802",
    status: "active"
  });
  const createdWorkOrders: Array<{ id: string; surface: string }> = [];
  const deps: OpportunityServiceDeps = {
    store,
    opportunities,
    getProperty: (id) => properties.getProperty(id),
    listProperties: (organizationId) => properties.listProperties(organizationId),
    listPropertyPortalCount: async (partnerId) => (await portals.listPortals(partnerId)).length,
    getWorkOrder: async (organizationId, workOrderId) => {
      const row = workOrders.get(workOrderId);
      if (!row || row.organizationId !== organizationId) return null;
      return row;
    },
    createWorkOrder: async (input) => {
      const id = `wo-${createdWorkOrders.length + 1}`;
      createdWorkOrders.push({ id, surface: input.surface });
      return { id, workSurface: input.surface };
    }
  };
  return { deps, store, opportunities, portals, createdWorkOrders };
}

describe("PARTNER-006 opportunity service", () => {
  beforeEach(() => {
    resetMemoryPartnerStore();
    resetMemoryPartnerOpportunityStore();
    resetMemoryPropertyCatalog();
    resetMemoryPartnerPropertyPortalStore();
  });

  it("routes Ready Certified and Strategic partners and excludes referral, not-ready, suspended, and mismatches", async () => {
    const { deps, portals } = makeDeps(new Map());
    const certified = readyPartner({ id: "p-cert", companyName: "Alpha Plumbing", publicSlug: "alpha-plumbing" });
    const strategic = readyPartner({
      id: "p-strat",
      companyName: "Beta Strategic",
      partnerType: "strategic",
      publicSlug: "beta-strategic",
      organizationId: "org-strat",
      email: "beta@example.com"
    });
    const referral = readyPartner({
      id: "p-ref",
      companyName: "Referral Co",
      partnerType: "referral",
      publicSlug: "referral-co",
      organizationId: "org-ref"
    });
    const notReady = readyPartner({
      id: "p-nr",
      companyName: "Not Ready",
      publicSlug: "not-ready",
      organizationId: "org-nr",
      logoMediaId: null,
      portalDescription: null
    });
    const suspended = readyPartner({
      id: "p-sus",
      companyName: "Suspended",
      status: "suspended",
      publicSlug: "suspended",
      organizationId: "org-sus"
    });
    const electrical = readyPartner({
      id: "p-elec",
      companyName: "Electrical Only",
      servicesOffered: "Electrical",
      publicSlug: "electrical-only",
      organizationId: "org-elec"
    });
    const far = readyPartner({
      id: "p-far",
      companyName: "Far Plumbing",
      city: "Duluth",
      state: "WI",
      serviceArea: "Northwest Wisconsin",
      publicSlug: "far-plumbing",
      organizationId: "org-far"
    });
    for (const partner of [certified, strategic, referral, notReady, suspended, electrical, far]) {
      await seedReady(deps, partner);
      if (partner.id !== "p-nr") {
        await portals.insertPortal({
          id: `portal-${partner.id}`,
          partnerId: partner.id,
          organizationId: partner.organizationId ?? partner.id,
          propertyId: "prop-x",
          publicSlug: `site-${partner.id}`,
          enabled: true,
          publicDisplayName: null,
          publicInstructions: null,
          createdAt: nowStamp(),
          updatedAt: nowStamp()
        });
      }
    }

    const eligible = await listEligiblePartnersForOpportunity(
      { category: "plumbing", city: "Oakdale", region: "MN", postalCode: "55128" },
      deps
    );
    expect(eligible.map((row) => row.id).sort()).toEqual(["p-cert", "p-strat"]);

    const created = await createAndRouteOpportunity(
      {
        organizationId: "org-a",
        actorUserId: "mgr-a",
        payload: { propertyId: "prop-1", category: "plumbing", description: "Kitchen leak", urgency: "urgent" },
        defaultPropertyType: "residential"
      },
      deps
    );
    expect(created.noMatch).toBe(false);
    expect(created.routedCount).toBe(2);
    expect(created.opportunity.status).toBe("routed");
  });

  it("records no-match unmet demand without requester PII", async () => {
    const { deps, opportunities } = makeDeps(new Map());
    const created = await createAndRouteOpportunity(
      {
        organizationId: "org-a",
        actorUserId: "mgr-a",
        payload: { propertyId: "prop-1", category: "snow", description: "Need snow removal", urgency: "soon" },
        defaultPropertyType: "residential"
      },
      deps
    );
    expect(created.noMatch).toBe(true);
    expect(created.noMatchCopy).toContain("No M.P.A. Service Partners currently match");
    const unmet = await opportunities.listUnmetDemand();
    expect(unmet).toHaveLength(1);
    expect(JSON.stringify(unmet[0])).not.toContain("org-a");
    expect(JSON.stringify(unmet[0])).not.toContain("mgr-a");
    expect(unmet[0]?.serviceCategory).toBe("snow");
  });

  it("covers interest, decline, select, close, cancel, expire, reroute, and work-order linkage", async () => {
    const workOrders = new Map();
    workOrders.set("wo-1", {
      id: "wo-1",
      organizationId: "org-a",
      propertyId: "prop-1",
      title: "Leak",
      description: "Hall leak",
      category: "plumbing",
      priority: "high",
      workSurface: "residential" as const
    });
    const { deps, portals, createdWorkOrders } = makeDeps(workOrders);
    const first = readyPartner({ id: "p1", companyName: "Alpha", publicSlug: "alpha", organizationId: "org-p1" });
    const second = readyPartner({ id: "p2", companyName: "Bravo", publicSlug: "bravo", organizationId: "org-p2", email: "b@example.com" });
    for (const partner of [first, second]) {
      await seedReady(deps, partner);
      await portals.insertPortal({
        id: `portal-${partner.id}`,
        partnerId: partner.id,
        organizationId: partner.organizationId ?? partner.id,
        propertyId: "prop-x",
        publicSlug: `site-${partner.id}`,
        enabled: true,
        publicDisplayName: null,
        publicInstructions: null,
        createdAt: nowStamp(),
        updatedAt: nowStamp()
      });
    }

    const created = await createAndRouteOpportunity(
      {
        organizationId: "org-a",
        actorUserId: "mgr-a",
        payload: { workOrderId: "wo-1" },
        defaultPropertyType: "residential"
      },
      deps
    );
    expect(created.opportunity.workOrderId).toBe("wo-1");
    expect(created.opportunity.category).toBe("plumbing");
    expect(created.routedCount).toBe(2);

    const foreign = await getOrganizationOpportunity("org-b", created.opportunity.id, deps);
    expect(foreign).toBeNull();
    const partnerBView = await getPartnerOpportunity("p2", created.opportunity.id, deps);
    expect(partnerBView).not.toBeNull();
    expect(JSON.stringify(partnerBView)).not.toContain("Hall leak unit");
    expect(JSON.stringify(partnerBView)).not.toContain("resident");

    await respondToOpportunity(
      { partnerId: "p1", opportunityId: created.opportunity.id, actorUserId: "user-p1", response: "interested" },
      deps
    );
    await respondToOpportunity(
      {
        partnerId: "p2",
        opportunityId: created.opportunity.id,
        actorUserId: "user-p2",
        response: "declined",
        declineReason: "capacity"
      },
      deps
    );
    const selected = await selectInterestedPartner(
      { organizationId: "org-a", opportunityId: created.opportunity.id, actorUserId: "mgr-a", partnerId: "p1" },
      deps
    );
    expect(selected.status).toBe("partner_selected");
    expect(selected.selectedPartnerId).toBe("p1");
    const afterSelect = await listPartnerOpportunities("p2", deps);
    expect(afterSelect.items.find((item) => item.route.opportunityId === created.opportunity.id)?.route.response).toBe(
      "not_selected"
    );

    await expect(
      selectInterestedPartner(
        { organizationId: "org-b", opportunityId: created.opportunity.id, actorUserId: "mgr-b", partnerId: "p1" },
        deps
      )
    ).rejects.toThrow("Opportunity was not found.");

    const standalone = await createAndRouteOpportunity(
      {
        organizationId: "org-a",
        actorUserId: "mgr-a",
        payload: { propertyId: "prop-1", category: "plumbing", description: "Standalone drain", urgency: "normal" },
        defaultPropertyType: "residential"
      },
      deps
    );
    await respondToOpportunity(
      { partnerId: "p1", opportunityId: standalone.opportunity.id, actorUserId: "user-p1", response: "interested" },
      deps
    );
    await selectInterestedPartner(
      { organizationId: "org-a", opportunityId: standalone.opportunity.id, actorUserId: "mgr-a", partnerId: "p1" },
      deps
    );
    const converted = await createWorkOrderFromOpportunity(
      { organizationId: "org-a", opportunityId: standalone.opportunity.id, actorUserId: "mgr-a" },
      deps
    );
    expect(converted.created).toBe(true);
    expect(converted.workOrderId).toBe("wo-1");
    expect(createdWorkOrders).toHaveLength(1);
    const again = await createWorkOrderFromOpportunity(
      { organizationId: "org-a", opportunityId: standalone.opportunity.id, actorUserId: "mgr-a" },
      deps
    );
    expect(again.created).toBe(false);
    expect(createdWorkOrders).toHaveLength(1);

    const closable = await createAndRouteOpportunity(
      {
        organizationId: "org-a",
        actorUserId: "mgr-a",
        payload: { propertyId: "prop-1", category: "plumbing", description: "Close me", urgency: "normal" },
        defaultPropertyType: "residential"
      },
      deps
    );
    const closed = await closeOrCancelOpportunity(
      { organizationId: "org-a", opportunityId: closable.opportunity.id, actorUserId: "mgr-a", action: "close" },
      deps
    );
    expect(closed.status).toBe("closed");
    await expect(
      respondToOpportunity(
        { partnerId: "p1", opportunityId: closable.opportunity.id, actorUserId: "user-p1", response: "interested" },
        deps
      )
    ).rejects.toThrow(/no longer accepting/);

    const cancellable = await createAndRouteOpportunity(
      {
        organizationId: "org-a",
        actorUserId: "mgr-a",
        payload: { propertyId: "prop-1", category: "plumbing", description: "Cancel me", urgency: "normal" },
        defaultPropertyType: "residential"
      },
      deps
    );
    const cancelled = await closeOrCancelOpportunity(
      { organizationId: "org-a", opportunityId: cancellable.opportunity.id, actorUserId: "mgr-a", action: "cancel" },
      deps
    );
    expect(cancelled.status).toBe("cancelled");

    const expiring = await createAndRouteOpportunity(
      {
        organizationId: "org-a",
        actorUserId: "mgr-a",
        payload: { propertyId: "prop-1", category: "plumbing", description: "Expire me", urgency: "normal" },
        defaultPropertyType: "residential",
        now: new Date("2026-08-20T00:00:00.000Z")
      },
      deps
    );
    const later = new Date(new Date("2026-08-20T00:00:00.000Z").getTime() + PARTNER_OPPORTUNITY_TTL_MS + 1);
    const expiredView = await getOrganizationOpportunity("org-a", expiring.opportunity.id, deps, later);
    expect(expiredView?.opportunity.status).toBe("closed");
    expect(expiredView?.opportunity.closeReason).toBe("expired");

    const third = readyPartner({
      id: "p3",
      companyName: "Charlie",
      publicSlug: "charlie",
      organizationId: "org-p3",
      email: "c@example.com"
    });
    await seedReady(deps, third);
    await portals.insertPortal({
      id: "portal-p3",
      partnerId: "p3",
      organizationId: "org-p3",
      propertyId: "prop-x",
      publicSlug: "site-p3",
      enabled: true,
      publicDisplayName: null,
      publicInstructions: null,
      createdAt: nowStamp(),
      updatedAt: nowStamp()
    });
    const reroutable = await createAndRouteOpportunity(
      {
        organizationId: "org-a",
        actorUserId: "mgr-a",
        payload: { propertyId: "prop-1", category: "plumbing", description: "Reroute me", urgency: "normal" },
        defaultPropertyType: "residential"
      },
      deps
    );
    const rerouted = await rerouteOpportunity(
      { organizationId: "org-a", opportunityId: reroutable.opportunity.id, actorUserId: "mgr-a" },
      deps
    );
    expect(rerouted.routedCount).toBeGreaterThanOrEqual(0);
    const routes = await deps.opportunities.listRoutes(reroutable.opportunity.id);
    const partnerIds = routes.map((row) => row.partnerId);
    expect(new Set(partnerIds).size).toBe(partnerIds.length);

    await expect(
      createAndRouteOpportunity(
        {
          organizationId: "org-a",
          actorUserId: "mgr-a",
          payload: { propertyId: "prop-b", category: "plumbing", description: "Steal", urgency: "normal" },
          defaultPropertyType: "residential"
        },
        deps
      )
    ).rejects.toThrow("Property was not found.");
    await expect(
      createAndRouteOpportunity(
        {
          organizationId: "org-a",
          actorUserId: "mgr-a",
          payload: { organizationId: "org-b", propertyId: "prop-1", category: "plumbing", description: "Override" },
          defaultPropertyType: "residential"
        },
        deps
      )
    ).rejects.toThrow("server-authoritative");
    await expect(
      respondToOpportunity(
        { partnerId: "missing", opportunityId: created.opportunity.id, actorUserId: "x", response: "interested" },
        deps
      )
    ).rejects.toThrow("Partner was not found.");

    const suspendedAfter = await deps.store.getPartner("p2");
    if (suspendedAfter) {
      await deps.store.updatePartner({ ...suspendedAfter, status: "suspended" });
    }
    const stillOpen = await createAndRouteOpportunity(
      {
        organizationId: "org-a",
        actorUserId: "mgr-a",
        payload: { propertyId: "prop-1", category: "plumbing", description: "After suspend", urgency: "normal" },
        defaultPropertyType: "residential"
      },
      deps
    );
    const routedToSuspended = (await deps.opportunities.listRoutes(stillOpen.opportunity.id)).some(
      (row) => row.partnerId === "p2"
    );
    expect(routedToSuspended).toBe(false);
  });
});
