import { beforeEach, describe, expect, it } from "vitest";
import { persistApplication, mutatePartner, recordPartnerAttribution, recordPartnerCommissionFromPaidInvoice, updatePartnerPublicProfile, bindPartnerLogo } from "./service";
import { resetMemoryPartnerStore } from "./store";
import { resetMemoryPartnerRequestStore } from "./request-store";
import { submitPartnerServiceRequest } from "./request-service";
import {
  listPartnerEarningsLedger,
  listPartnerReferralCustomers,
  loadPartnerCommandCenter,
  resolveBoundPartner
} from "./command-center-service";

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

async function seedActivePartner(input: {
  companyName: string;
  organizationId: string;
  commissionBps?: number;
}) {
  const store = resetMemoryPartnerStore();
  const requests = resetMemoryPartnerRequestStore();
  await persistApplication({ ...application, companyName: input.companyName }, { store });
  const partner = (await store.listPartners())[0]!;
  await mutatePartner({ partnerId: partner.id, action: "approve", actorUserId: "op-1" }, { store });
  await mutatePartner({ partnerId: partner.id, action: "activate", actorUserId: "op-1" }, { store });
  await mutatePartner(
    {
      partnerId: partner.id,
      action: "update",
      actorUserId: "op-1",
      organizationId: input.organizationId,
      publicPortalEnabled: true,
      ...(input.commissionBps !== undefined ? { commissionBps: input.commissionBps } : {})
    },
    { store }
  );
  return { store, requests, partner: (await store.getPartner(partner.id))! };
}

describe("PARTNER-003 command center service", () => {
  beforeEach(() => {
    resetMemoryPartnerStore();
    resetMemoryPartnerRequestStore();
  });

  it("scopes the dashboard to the receiving organization and ignores random UUIDs", async () => {
    const partnerA = await seedActivePartner({
      companyName: "Alpha Services",
      organizationId: "org-a"
    });
    const store = partnerA.store;
    await persistApplication({ ...application, companyName: "Bravo Services" }, { store });
    const partnerB = (await store.listPartners()).find((row) => row.companyName === "Bravo Services")!;
    await mutatePartner({ partnerId: partnerB.id, action: "approve", actorUserId: "op-1" }, { store });
    await mutatePartner({ partnerId: partnerB.id, action: "activate", actorUserId: "op-1" }, { store });
    await mutatePartner(
      {
        partnerId: partnerB.id,
        action: "update",
        actorUserId: "op-1",
        organizationId: "org-b",
        publicPortalEnabled: true
      },
      { store }
    );

    await recordPartnerAttribution(
      { organizationId: "customer-a", slug: partnerA.partner.publicSlug!, source: "checkout_ref" },
      { store }
    );
    await recordPartnerCommissionFromPaidInvoice(
      {
        organizationId: "customer-a",
        amountPaidCents: 10900,
        stripeEventId: "evt-a",
        stripeInvoiceId: "in-a"
      },
      { store }
    );
    await recordPartnerAttribution(
      { organizationId: "customer-b", slug: "bravo-services", source: "checkout_ref" },
      { store }
    );
    await recordPartnerCommissionFromPaidInvoice(
      {
        organizationId: "customer-b",
        amountPaidCents: 20900,
        stripeEventId: "evt-b",
        stripeInvoiceId: "in-b"
      },
      { store }
    );

    const deps = { store, requests: partnerA.requests };
    const dashA = await loadPartnerCommandCenter("org-a", deps);
    const dashB = await loadPartnerCommandCenter("org-b", deps);
    expect(dashA.partner?.companyName).toBe("Alpha Services");
    expect(dashB.partner?.companyName).toBe("Bravo Services");
    expect(dashA.referrals.totalAttributedOrganizations).toBe(1);
    expect(dashB.referrals.totalAttributedOrganizations).toBe(1);
    expect(dashA.earnings.earnedCents).not.toBe(dashB.earnings.earnedCents);
    expect(await resolveBoundPartner("00000000-0000-4000-8000-000000000000", store)).toBeNull();
    expect(await resolveBoundPartner("org-unrelated", store)).toBeNull();
    const unbound = await loadPartnerCommandCenter("org-unrelated", deps);
    expect(unbound.bound).toBe(false);
  });

  it("shows actual commission snapshots, ledger statuses, and the 12-month cap", async () => {
    const { store, requests, partner } = await seedActivePartner({
      companyName: "Custom Rate Co",
      organizationId: "org-custom",
      commissionBps: 1500
    });
    await recordPartnerAttribution(
      { organizationId: "customer-1", slug: partner.publicSlug!, source: "checkout_ref" },
      { store }
    );
    const first = await recordPartnerCommissionFromPaidInvoice(
      {
        organizationId: "customer-1",
        amountPaidCents: 10000,
        stripeEventId: "evt-1",
        stripeInvoiceId: "in-1"
      },
      { store }
    );
    expect(first.ok && first.commission?.commissionBps).toBe(1500);
    if (first.ok && first.commission) {
      await mutatePartner(
        {
          partnerId: partner.id,
          action: "mark_paid",
          actorUserId: "op-1",
          commissionId: first.commission.id
        },
        { store }
      );
    }
    await recordPartnerCommissionFromPaidInvoice(
      {
        organizationId: "customer-1",
        amountPaidCents: 10000,
        stripeEventId: "evt-pending",
        stripeInvoiceId: "in-pending"
      },
      { store }
    );
    const pending = (await store.listCommissions(partner.id)).find((row) => row.status === "earned");
    if (pending) {
      await store.updateCommission({ ...pending, status: "pending", updatedAt: new Date().toISOString() });
    }
    await recordPartnerAttribution(
      { organizationId: "customer-void", slug: partner.publicSlug!, source: "checkout_ref" },
      { store }
    );
    const voided = await recordPartnerCommissionFromPaidInvoice(
      {
        organizationId: "customer-void",
        amountPaidCents: 5000,
        stripeEventId: "evt-void",
        stripeInvoiceId: "in-void"
      },
      { store }
    );
    if (voided.ok && voided.commission) {
      await store.updateCommission({
        ...voided.commission,
        status: "void",
        updatedAt: new Date().toISOString()
      });
    }

    const deps = {
      store,
      requests,
      lookupOrganizationNames: async () => ({
        "customer-1": "Harbor Property Group",
        "customer-void": "Voided Org"
      })
    };
    const dashboard = await loadPartnerCommandCenter("org-custom", deps);
    expect(dashboard.partner?.rate.percent).toBe(15);
    expect(dashboard.partner?.rate.founding).toBe(false);
    expect(dashboard.earnings.paidCount).toBe(1);
    expect(dashboard.earnings.pendingCount).toBe(1);
    expect(dashboard.earnings.voidCount).toBe(1);

    const ledger = await listPartnerEarningsLedger("org-custom", deps);
    expect(ledger.ok).toBe(true);
    if (ledger.ok) {
      expect(ledger.rows.some((row) => row.commissionPercent === 15 && row.status === "paid")).toBe(true);
      expect(ledger.rows.some((row) => row.organizationName === "Harbor Property Group")).toBe(true);
    }

    for (let index = 0; index < 12; index += 1) {
      await recordPartnerCommissionFromPaidInvoice(
        {
          organizationId: "customer-1",
          amountPaidCents: 10000,
          stripeEventId: `evt-cap-${index}`,
          stripeInvoiceId: `in-cap-${index}`
        },
        { store }
      );
    }
    const capped = await loadPartnerCommandCenter("org-custom", deps);
    expect(capped.referrals.qualifyingPaidMonths).toBeGreaterThanOrEqual(12);
    expect(capped.referrals.activeQualifyingReferrals).toBe(1);
  });

  it("allows safe profile edits and blocks sensitive fields", async () => {
    const { store, partner } = await seedActivePartner({
      companyName: "Profile Co",
      organizationId: "org-profile"
    });
    const allowed = await updatePartnerPublicProfile(
      {
        organizationId: "org-profile",
        actorUserId: "user-1",
        payload: { portalDescription: "On-site HVAC", phone: "612-555-0199" }
      },
      { store }
    );
    expect(allowed.ok).toBe(true);
    const forbidden = await updatePartnerPublicProfile(
      {
        organizationId: "org-profile",
        actorUserId: "user-1",
        payload: { commissionBps: 4000, status: "active" }
      },
      { store }
    );
    expect(forbidden.ok).toBe(false);
    const otherOrg = await updatePartnerPublicProfile(
      {
        organizationId: "org-other",
        actorUserId: "user-1",
        payload: { portalDescription: "stolen" }
      },
      { store }
    );
    expect(otherOrg.ok).toBe(false);
    const logo = await bindPartnerLogo(
      { organizationId: "org-profile", actorUserId: "user-1", mediaId: "media-logo-1" },
      { store }
    );
    expect(logo.ok).toBe(true);
    expect((await store.getPartner(partner.id))?.logoMediaId).toBe("media-logo-1");
    expect((await store.getPartner(partner.id))?.commissionBps).toBe(2000);
  });

  it("includes recent service requests from the existing request system", async () => {
    const { store, requests, partner } = await seedActivePartner({
      companyName: "Queue Co",
      organizationId: "org-queue"
    });
    await submitPartnerServiceRequest(
      partner.publicSlug!,
      {
        requesterName: "Jamie Tenant",
        requesterEmail: "jamie@example.test",
        propertyAddress: "100 Main St",
        category: "plumbing",
        description: "Kitchen sink is leaking.",
        urgency: "soon"
      },
      { store, requests }
    );
    const dashboard = await loadPartnerCommandCenter("org-queue", { store, requests });
    expect(dashboard.requests.newCount).toBe(1);
    expect(dashboard.requests.recent[0]?.requesterName).toBe("Jamie Tenant");
    const referrals = await listPartnerReferralCustomers("org-queue", { store, requests });
    expect(referrals.ok).toBe(true);
  });
});
