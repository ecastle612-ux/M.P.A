import { beforeEach, describe, expect, it } from "vitest";
import { persistApplication, mutatePartner } from "./service";
import { resetMemoryPartnerStore } from "./store";
import { resetMemoryPartnerRequestStore } from "./request-store";
import {
  getMemoryPropertyCatalog,
  resetMemoryPartnerPropertyPortalStore,
  resetMemoryPropertyCatalog
} from "./property-portal-store";
import {
  createAuthorizedPropertyPortal,
  listAuthorizedPropertyPortals,
  resolveLivePropertyPortal,
  updateAuthorizedPropertyPortal
} from "./property-portal-service";
import { mutatePartnerRequest, submitPartnerPropertyServiceRequest, submitPartnerServiceRequest } from "./request-service";

const application = {
  companyName: "NorthStar Property Services",
  contactName: "Alex Rivera",
  email: "alex@northstar.example",
  phone: "612-555-0100",
  website: null,
  city: "Minneapolis",
  state: "MN",
  serviceArea: "Twin Cities",
  companyServiceType: "Maintenance company",
  servicesOffered: "Make-ready, HVAC, plumbing",
  customersServed: null,
  mpaAccountEmail: null,
  interestedPartnerType: "certified_service" as const,
  notes: null
};

const mapleId = "11111111-1111-4111-8111-111111111111";
const oakId = "22222222-2222-4222-8222-222222222222";
const otherOrgPropertyId = "33333333-3333-4333-8333-333333333333";

async function seedPartner(orgId: string, companyName = application.companyName) {
  const store = resetMemoryPartnerStore();
  const requests = resetMemoryPartnerRequestStore();
  const propertyPortals = resetMemoryPartnerPropertyPortalStore();
  const properties = resetMemoryPropertyCatalog();
  await persistApplication({ ...application, companyName }, { store });
  const partner = (await store.listPartners()).find((row) => row.companyName === companyName)!;
  await mutatePartner(
    { partnerId: partner.id, action: "approve", actorUserId: "op-1", partnerType: "certified_service" },
    { store }
  );
  await mutatePartner({ partnerId: partner.id, action: "activate", actorUserId: "op-1" }, { store });
  await mutatePartner(
    {
      partnerId: partner.id,
      action: "update",
      actorUserId: "op-1",
      organizationId: orgId,
      publicPortalEnabled: true
    },
    { store }
  );
  properties.seed({
    id: mapleId,
    organizationId: orgId,
    name: "Maple Apartments",
    addressLine1: "100 Maple Ave",
    city: "Minneapolis",
    region: "MN",
    postalCode: "55401",
    status: "active"
  });
  properties.seed({
    id: oakId,
    organizationId: orgId,
    name: "Oakdale Office",
    addressLine1: "200 Oak St",
    city: "Minneapolis",
    region: "MN",
    postalCode: "55402",
    status: "active"
  });
  return {
    store,
    requests,
    propertyPortals,
    properties,
    partnerId: partner.id,
    slug: (await store.getPartner(partner.id))!.publicSlug!,
    orgId
  };
}

describe("PARTNER-004 property-specific portals", () => {
  beforeEach(() => {
    resetMemoryPartnerStore();
    resetMemoryPartnerRequestStore();
    resetMemoryPartnerPropertyPortalStore();
    resetMemoryPropertyCatalog();
  });

  it("resolves a live property URL and hides unknown, disabled, and suspended cases", async () => {
    const deps = await seedPartner("org-northstar");
    const created = await createAuthorizedPropertyPortal(
      {
        organizationId: "org-northstar",
        actorUserId: "user-1",
        payload: { propertyId: mapleId, publicSlug: "maple-apartments" }
      },
      deps
    );
    expect(created.ok).toBe(true);
    const live = await resolveLivePropertyPortal(deps.slug, "maple-apartments", deps);
    expect(live?.public.propertyName).toBe("Maple Apartments");
    expect(live?.public.title).toBe("Service Requests — NorthStar Property Services");

    expect(await resolveLivePropertyPortal(deps.slug, "missing-property", deps)).toBeNull();
    expect(await resolveLivePropertyPortal("unknown-partner", "maple-apartments", deps)).toBeNull();

    if (created.ok) {
      await updateAuthorizedPropertyPortal(
        {
          linkId: created.portal.id,
          organizationId: "org-northstar",
          actorUserId: "user-1",
          payload: { enabled: false }
        },
        deps
      );
    }
    expect(await resolveLivePropertyPortal(deps.slug, "maple-apartments", deps)).toBeNull();
  });

  it("rejects cross-org property UUIDs, client org override, and duplicate links", async () => {
    const deps = await seedPartner("org-northstar");
    getMemoryPropertyCatalog().seed({
      id: otherOrgPropertyId,
      organizationId: "org-other",
      name: "Other Property",
      addressLine1: null,
      city: null,
      region: null,
      postalCode: null,
      status: "active"
    });
    const cross = await createAuthorizedPropertyPortal(
      {
        organizationId: "org-northstar",
        actorUserId: "user-1",
        payload: { propertyId: otherOrgPropertyId }
      },
      deps
    );
    expect(cross).toMatchObject({ ok: false, code: "not_found" });
    const forged = await createAuthorizedPropertyPortal(
      {
        organizationId: "org-northstar",
        actorUserId: "user-1",
        payload: { propertyId: mapleId, organizationId: "org-other" }
      },
      deps
    );
    expect(forged.ok).toBe(false);
    const first = await createAuthorizedPropertyPortal(
      {
        organizationId: "org-northstar",
        actorUserId: "user-1",
        payload: { propertyId: mapleId }
      },
      deps
    );
    expect(first.ok).toBe(true);
    const again = await createAuthorizedPropertyPortal(
      {
        organizationId: "org-northstar",
        actorUserId: "user-1",
        payload: { propertyId: mapleId }
      },
      deps
    );
    expect(again).toMatchObject({ ok: false, code: "conflict" });
  });

  it("submits a property-specific request, ignores client property_id, and converts to the stored property", async () => {
    const deps = await seedPartner("org-northstar");
    const created = await createAuthorizedPropertyPortal(
      {
        organizationId: "org-northstar",
        actorUserId: "user-1",
        payload: { propertyId: mapleId, publicSlug: "maple-apartments" }
      },
      deps
    );
    expect(created.ok).toBe(true);
    const captured: string[] = [];
    const convertDeps = {
      ...deps,
      convertWorkOrder: async (input: { propertyId: string; surface: "facility" | "residential" }) => {
        captured.push(`${input.surface}:${input.propertyId}`);
        return { id: "wo-1", workSurface: input.surface };
      }
    };
    const forged = await submitPartnerPropertyServiceRequest(
      deps.slug,
      "maple-apartments",
      {
        requesterName: "Jamie Tenant",
        requesterEmail: "jamie@example.test",
        category: "plumbing",
        description: "Kitchen sink is leaking.",
        urgency: "soon",
        propertyId: oakId
      },
      convertDeps
    );
    expect(forged.ok).toBe(false);
    const submitted = await submitPartnerPropertyServiceRequest(
      deps.slug,
      "maple-apartments",
      {
        requesterName: "Jamie Tenant",
        requesterEmail: "jamie@example.test",
        unitLabel: "2B",
        category: "plumbing",
        description: "Kitchen sink is leaking.",
        urgency: "soon"
      },
      convertDeps
    );
    expect(submitted.ok).toBe(true);
    const [row] = await deps.requests.listRequests(deps.partnerId);
    expect(row?.intakeSource).toBe("property_portal");
    expect(row?.propertyId).toBe(mapleId);
    expect(row?.propertyAddress).toContain("100 Maple Ave");

    const converted = await mutatePartnerRequest(
      {
        requestId: row!.id,
        organizationId: "org-northstar",
        actorUserId: "user-1",
        action: "convert",
        propertyId: oakId,
        entitlements: ["pm.maintenance"]
      },
      convertDeps
    );
    expect(converted.ok).toBe(true);
    expect(captured).toEqual([`residential:${mapleId}`]);
  });

  it("converts FO property-portal requests to facility work orders and Complete prefers FO", async () => {
    const deps = await seedPartner("org-northstar");
    await createAuthorizedPropertyPortal(
      {
        organizationId: "org-northstar",
        actorUserId: "user-1",
        payload: { propertyId: mapleId, publicSlug: "maple-apartments" }
      },
      deps
    );
    const surfaces: string[] = [];
    const convertDeps = {
      ...deps,
      convertWorkOrder: async (input: { surface: "facility" | "residential" }) => {
        surfaces.push(input.surface);
        return { id: `wo-${input.surface}`, workSurface: input.surface };
      }
    };
    await submitPartnerPropertyServiceRequest(
      deps.slug,
      "maple-apartments",
      {
        requesterName: "Jamie Tenant",
        requesterEmail: "jamie@example.test",
        category: "hvac",
        description: "Rooftop unit alarm.",
        urgency: "soon"
      },
      convertDeps
    );
    const [row] = await deps.requests.listRequests(deps.partnerId);
    await mutatePartnerRequest(
      {
        requestId: row!.id,
        organizationId: "org-northstar",
        actorUserId: "fo-1",
        action: "convert",
        entitlements: ["facility.operations", "pm.maintenance"]
      },
      convertDeps
    );
    expect(surfaces).toEqual(["facility"]);
  });

  it("keeps the generic partner portal working beside property portals", async () => {
    const deps = await seedPartner("org-northstar");
    await createAuthorizedPropertyPortal(
      {
        organizationId: "org-northstar",
        actorUserId: "user-1",
        payload: { propertyId: mapleId, publicSlug: "maple-apartments" }
      },
      deps
    );
    const generic = await submitPartnerServiceRequest(
      deps.slug,
      {
        requesterName: "Jamie Tenant",
        requesterEmail: "jamie@example.test",
        propertyAddress: "100 Main St",
        category: "plumbing",
        description: "Kitchen sink is leaking.",
        urgency: "soon"
      },
      deps
    );
    expect(generic.ok).toBe(true);
    const [row] = await deps.requests.listRequests(deps.partnerId);
    expect(row?.intakeSource).toBe("generic_portal");
    expect(row?.propertyId).toBeNull();
  });

  it("lists only the receiving org properties and paginates search", async () => {
    const deps = await seedPartner("org-northstar");
    await createAuthorizedPropertyPortal(
      {
        organizationId: "org-northstar",
        actorUserId: "user-1",
        payload: { propertyId: mapleId, publicSlug: "maple-apartments" }
      },
      deps
    );
    await createAuthorizedPropertyPortal(
      {
        organizationId: "org-northstar",
        actorUserId: "user-1",
        payload: { propertyId: oakId, publicSlug: "oakdale-office" }
      },
      deps
    );
    const listed = await listAuthorizedPropertyPortals(
      { organizationId: "org-northstar", query: "maple", page: 1, pageSize: 25 },
      deps
    );
    expect(listed.ok).toBe(true);
    if (listed.ok) {
      expect(listed.items).toHaveLength(1);
      expect(listed.items[0]?.publicSlug).toBe("maple-apartments");
      expect(listed.items[0]?.qrPayload).toBe(
        "https://www.my-property-assistant.com/request/northstar-property-services/maple-apartments"
      );
    }
    const otherOrg = await listAuthorizedPropertyPortals({ organizationId: "org-other" }, deps);
    expect(otherOrg.ok).toBe(false);
  });

  it("does not let a slug change move a portal onto another organization property", async () => {
    const deps = await seedPartner("org-northstar");
    const created = await createAuthorizedPropertyPortal(
      {
        organizationId: "org-northstar",
        actorUserId: "user-1",
        payload: { propertyId: mapleId, publicSlug: "maple-apartments" }
      },
      deps
    );
    if (!created.ok) throw new Error("expected create");
    const updated = await updateAuthorizedPropertyPortal(
      {
        linkId: created.portal.id,
        organizationId: "org-northstar",
        actorUserId: "op-1",
        payload: { publicSlug: "oakdale-office", propertyId: otherOrgPropertyId }
      },
      deps
    );
    expect(updated.ok).toBe(false);
    const renamed = await updateAuthorizedPropertyPortal(
      {
        linkId: created.portal.id,
        organizationId: "org-northstar",
        actorUserId: "op-1",
        payload: { publicSlug: "maple-building" }
      },
      deps
    );
    expect(renamed.ok).toBe(true);
    if (renamed.ok) {
      expect(renamed.portal.propertyId).toBe(mapleId);
      expect(renamed.portal.organizationId).toBe("org-northstar");
    }
  });
});
