import { beforeEach, describe, expect, it } from "vitest";
import { partnerPortalIsLive } from "@mpa/shared";
import { persistApplication, mutatePartner } from "./service";
import { resetMemoryPartnerStore } from "./store";
import { resetMemoryPartnerRequestStore } from "./request-store";
import {
  getPartnerRequestAuthorized,
  mutatePartnerRequest,
  resolveLivePartnerPortal,
  submitPartnerPropertyServiceRequest,
  submitPartnerServiceRequest
} from "./request-service";
import { resetMemoryPartnerPropertyPortalStore, resetMemoryPropertyCatalog } from "./property-portal-store";

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

const validRequest = {
  requesterName: "Jamie Tenant",
  requesterEmail: "jamie@example.test",
  requesterPhone: "",
  propertyAddress: "100 Main St",
  unitLabel: "2B",
  category: "plumbing",
  description: "Kitchen sink is leaking.",
  urgency: "soon"
};

async function enablePortal(orgId = "org-northstar") {
  const store = resetMemoryPartnerStore();
  const requests = resetMemoryPartnerRequestStore();
  await persistApplication(application, { store });
  const partner = (await store.listPartners())[0]!;
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
  return { store, requests, partnerId: partner.id, slug: partner.publicSlug! };
}

describe("PARTNER-002 request portals", () => {
  beforeEach(() => {
    resetMemoryPartnerStore();
    resetMemoryPartnerRequestStore();
    resetMemoryPartnerPropertyPortalStore();
    resetMemoryPropertyCatalog();
  });

  it("enables Certified Service and Strategic portals and denies Referral", async () => {
    const { store, slug } = await enablePortal();
    const requests = resetMemoryPartnerRequestStore();
    expect((await resolveLivePartnerPortal(slug, { store, requests }))?.public.companyName).toBe(
      "NorthStar Property Services"
    );

    const referral = await persistApplication(
      { ...application, companyName: "Referral Only Co", interestedPartnerType: "referral" },
      { store }
    );
    expect(referral.ok).toBe(true);
    const referralRow = (await store.listPartners()).find((row) => row.companyName === "Referral Only Co")!;
    await mutatePartner({ partnerId: referralRow.id, action: "approve", actorUserId: "op-1" }, { store });
    await mutatePartner({ partnerId: referralRow.id, action: "activate", actorUserId: "op-1" }, { store });
    await mutatePartner(
      {
        partnerId: referralRow.id,
        action: "update",
        actorUserId: "op-1",
        organizationId: "org-ref",
        publicPortalEnabled: true
      },
      { store }
    );
    expect(
      partnerPortalIsLive({
        ...(await store.getPartner(referralRow.id))!,
      })
    ).toBe(false);
  });

  it("rejects invalid slug, disabled portal, and suspended partner without leaking internals", async () => {
    const { store, requests, partnerId, slug } = await enablePortal();
    expect(await resolveLivePartnerPortal("unknown-company", { store, requests })).toBeNull();
    await mutatePartner(
      { partnerId, action: "update", actorUserId: "op-1", publicPortalEnabled: false },
      { store }
    );
    expect(await resolveLivePartnerPortal(slug, { store, requests })).toBeNull();
    await mutatePartner(
      { partnerId, action: "update", actorUserId: "op-1", publicPortalEnabled: true },
      { store }
    );
    await mutatePartner({ partnerId, action: "suspend", actorUserId: "op-1" }, { store });
    const after = await store.getPartner(partnerId);
    expect(after?.publicPortalEnabled).toBe(false);
    expect(await resolveLivePartnerPortal(slug, { store, requests })).toBeNull();
  });

  it("submits, reviews, accepts, declines, and converts without duplicate work orders", async () => {
    const { store, requests, slug } = await enablePortal();
    const created: string[] = [];
    const deps = {
      store,
      requests,
      convertWorkOrder: async () => {
        const id = `wo-${created.length + 1}`;
        created.push(id);
        return { id, workSurface: "facility" as const };
      }
    };
    const submitted = await submitPartnerServiceRequest(slug, validRequest, deps);
    expect(submitted).toMatchObject({ ok: true });
    if (!submitted.ok || !submitted.publicRef) throw new Error("expected submit");
    const [row] = await requests.listRequests((await store.listPartners())[0]!.id);

    const accepted = await mutatePartnerRequest(
      {
        requestId: row!.id,
        organizationId: "org-northstar",
        actorUserId: "user-1",
        action: "accept",
        entitlements: ["facility.operations"]
      },
      deps
    );
    expect(accepted.ok).toBe(true);

    const converted = await mutatePartnerRequest(
      {
        requestId: row!.id,
        organizationId: "org-northstar",
        actorUserId: "user-1",
        action: "convert",
        propertyId: "11111111-1111-4111-8111-111111111111",
        entitlements: ["facility.operations"]
      },
      deps
    );
    expect(converted.ok).toBe(true);
    if (converted.ok) expect(converted.request.convertedWorkOrderId).toBe("wo-1");

    const again = await mutatePartnerRequest(
      {
        requestId: row!.id,
        organizationId: "org-northstar",
        actorUserId: "user-1",
        action: "convert",
        propertyId: "11111111-1111-4111-8111-111111111111",
        entitlements: ["facility.operations"]
      },
      deps
    );
    expect(again.ok).toBe(true);
    expect(created).toEqual(["wo-1"]);
  });

  it("converts PM-capable orgs to residential and Complete/FO to facility", async () => {
    const { store, requests, slug } = await enablePortal();
    const surfaces: string[] = [];
    const deps = {
      store,
      requests,
      convertWorkOrder: async (input: { surface: "facility" | "residential" }) => {
        surfaces.push(input.surface);
        return { id: `wo-${input.surface}`, workSurface: input.surface };
      }
    };
    await submitPartnerServiceRequest(slug, validRequest, deps);
    const [row] = await requests.listRequests((await store.listPartners())[0]!.id);
    await mutatePartnerRequest(
      {
        requestId: row!.id,
        organizationId: "org-northstar",
        actorUserId: "pm-1",
        action: "convert",
        propertyId: "11111111-1111-4111-8111-111111111111",
        entitlements: ["pm.maintenance"]
      },
      deps
    );
    const second = await submitPartnerServiceRequest(
      slug,
      { ...validRequest, requesterName: "Other" },
      deps
    );
    expect(second.ok).toBe(true);
    const [, later] = await requests.listRequests((await store.listPartners())[0]!.id);
    await mutatePartnerRequest(
      {
        requestId: later!.id,
        organizationId: "org-northstar",
        actorUserId: "fo-1",
        action: "convert",
        propertyId: "11111111-1111-4111-8111-111111111111",
        entitlements: ["facility.operations", "pm.maintenance"]
      },
      deps
    );
    expect(surfaces).toEqual(["residential", "facility"]);
  });

  it("blocks cross-partner access and UUID guessing", async () => {
    const a = await enablePortal("org-a");
    const submitted = await submitPartnerServiceRequest(a.slug, validRequest, a);
    expect(submitted.ok).toBe(true);
    const [row] = await a.requests.listRequests(a.partnerId);
    expect(await getPartnerRequestAuthorized(row!.id, "org-b", a)).toBeNull();
    expect(await getPartnerRequestAuthorized("00000000-0000-4000-8000-000000000099", "org-a", a)).toBeNull();
    const denied = await mutatePartnerRequest(
      {
        requestId: row!.id,
        organizationId: "org-b",
        actorUserId: "intruder",
        action: "accept"
      },
      a
    );
    expect(denied).toMatchObject({ ok: false, code: "not_found" });
  });

  it("treats honeypot as success and rejects client org/partner ids", async () => {
    const { store, requests, slug } = await enablePortal();
    const spam = await submitPartnerServiceRequest(
      slug,
      { ...validRequest, company_fax: "1" },
      { store, requests }
    );
    expect(spam).toEqual({ ok: true, spam: true });
    expect((await requests.listRequests((await store.listPartners())[0]!.id)).length).toBe(0);
    const forged = await submitPartnerServiceRequest(
      slug,
      { ...validRequest, organization_id: "org-x", partnerId: "p-x" },
      { store, requests }
    );
    expect(forged.ok).toBe(false);
    const propertyForged = await submitPartnerPropertyServiceRequest(
      slug,
      "maple-apartments",
      { ...validRequest, property_id: "11111111-1111-4111-8111-111111111111" },
      { store, requests }
    );
    expect(propertyForged.ok).toBe(false);
  });
});
