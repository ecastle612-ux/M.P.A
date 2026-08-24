import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_COMMISSION_BPS } from "@mpa/shared";
import { resetMemoryPartnerStore } from "./store";
import {
  mutatePartner,
  persistApplication,
  recordPartnerAttribution,
  recordPartnerCommissionFromPaidInvoice,
  submitPartnerApplication,
  voidPartnerCommissionsForRefund
} from "./service";

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

describe("PARTNER-001 partner service", () => {
  beforeEach(() => {
    resetMemoryPartnerStore();
  });

  it("persists applications without client org ids and treats honeypot as success", async () => {
    const store = resetMemoryPartnerStore();
    const created = await persistApplication(application, { store });
    expect(created.ok).toBe(true);
    const rows = await store.listPartners();
    expect(rows).toHaveLength(1);
    expect(rows[0]?.status).toBe("applied");
    expect(rows[0]?.publicSlug).toBe("northstar-property-services");
    expect(rows[0]?.commissionBps).toBe(DEFAULT_COMMISSION_BPS);

    const spam = await submitPartnerApplication(
      { ...application, companyName: "Bot", company_fax: "filled" },
      { store }
    );
    expect(spam).toEqual({ ok: true, spam: true });
    expect((await store.listPartners()).length).toBe(1);
  });

  it("approves, activates, suspends, and enforces unique slugs", async () => {
    const store = resetMemoryPartnerStore();
    await persistApplication(application, { store });
    await persistApplication({ ...application, companyName: "NorthStar Property Services LLC" }, { store });
    const [first, second] = await store.listPartners();
    const approved = await mutatePartner(
      { partnerId: first!.id, action: "approve", actorUserId: "op-1" },
      { store }
    );
    expect(approved.ok).toBe(true);
    const activated = await mutatePartner(
      { partnerId: first!.id, action: "activate", actorUserId: "op-1" },
      { store }
    );
    expect(activated.ok).toBe(true);
    if (activated.ok) expect(activated.partner?.status).toBe("active");

    const clash = await mutatePartner(
      {
        partnerId: second!.id,
        action: "update",
        actorUserId: "op-1",
        publicSlug: "northstar-property-services"
      },
      { store }
    );
    expect(clash.ok).toBe(false);

    const suspended = await mutatePartner(
      { partnerId: first!.id, action: "suspend", actorUserId: "op-1" },
      { store }
    );
    expect(suspended.ok).toBe(true);
  });

  it("attributes first valid active partner and ignores invalid or suspended refs", async () => {
    const store = resetMemoryPartnerStore();
    await persistApplication(application, { store });
    const partner = (await store.listPartners())[0]!;
    await mutatePartner({ partnerId: partner.id, action: "approve", actorUserId: "op-1" }, { store });
    await mutatePartner({ partnerId: partner.id, action: "activate", actorUserId: "op-1" }, { store });

    const first = await recordPartnerAttribution(
      {
        organizationId: "org-1",
        slug: "northstar-property-services",
        source: "checkout_ref",
        customerEmail: "buyer@example.com"
      },
      { store }
    );
    expect(first.ok).toBe(true);

    const duplicate = await recordPartnerAttribution(
      {
        organizationId: "org-1",
        slug: "other-company",
        source: "checkout_ref"
      },
      { store }
    );
    expect(duplicate.ok).toBe(true);
    if (duplicate.ok) {
      expect(duplicate.created).toBe(false);
      expect(duplicate.referral.partnerId).toBe(partner.id);
    }

    await mutatePartner({ partnerId: partner.id, action: "suspend", actorUserId: "op-1" }, { store });
    const suspended = await recordPartnerAttribution(
      { organizationId: "org-2", slug: "northstar-property-services", source: "checkout_ref" },
      { store }
    );
    expect(suspended.ok).toBe(false);

    const invalid = await recordPartnerAttribution(
      { organizationId: "org-3", slug: "missing-partner", source: "checkout_ref" },
      { store }
    );
    expect(invalid.ok).toBe(false);
  });

  it("flags self-referral and keeps complimentary attribution without cash commission", async () => {
    const store = resetMemoryPartnerStore();
    await persistApplication({ ...application, email: "alex@northstar.example" }, { store });
    const partner = (await store.listPartners())[0]!;
    await mutatePartner({ partnerId: partner.id, action: "approve", actorUserId: "op-1" }, { store });
    await mutatePartner({ partnerId: partner.id, action: "activate", actorUserId: "op-1" }, { store });

    const attributed = await recordPartnerAttribution(
      {
        organizationId: "org-comp",
        slug: "northstar-property-services",
        source: "complimentary_claim",
        customerEmail: "alex@northstar.example"
      },
      { store }
    );
    expect(attributed.ok).toBe(true);
    if (attributed.ok) expect(attributed.flaggedReason).toBe("self_referral_email");

    const complimentary = await recordPartnerCommissionFromPaidInvoice(
      {
        organizationId: "org-comp",
        amountPaidCents: 0,
        stripeEventId: "evt_comp",
        complimentaryOnly: true
      },
      { store }
    );
    expect(complimentary).toMatchObject({ ok: true, skipped: "not_commissionable" });
    expect((await store.listCommissions()).length).toBe(0);
  });

  it("snapshots 20%, caps 12 months, voids refunds, and requires earned before PAID", async () => {
    const store = resetMemoryPartnerStore();
    await persistApplication(application, { store });
    const partner = (await store.listPartners())[0]!;
    await mutatePartner({ partnerId: partner.id, action: "approve", actorUserId: "op-1" }, { store });
    await mutatePartner(
      { partnerId: partner.id, action: "activate", actorUserId: "op-1", commissionBps: 2000 },
      { store }
    );
    await recordPartnerAttribution(
      { organizationId: "org-paid", slug: "northstar-property-services", source: "checkout_ref" },
      { store }
    );

    const first = await recordPartnerCommissionFromPaidInvoice(
      {
        organizationId: "org-paid",
        amountPaidCents: 10900,
        taxCents: 0,
        stripeEventId: "evt_1",
        stripeInvoiceId: "in_1"
      },
      { store }
    );
    expect(first.ok).toBe(true);
    if (first.ok) {
      expect(first.commission?.commissionCents).toBe(2180);
      expect(first.commission?.commissionBps).toBe(2000);
      expect(first.commission?.status).toBe("earned");
    }

    await mutatePartner(
      { partnerId: partner.id, action: "update", actorUserId: "op-1", commissionBps: 1000 },
      { store }
    );
    const second = await recordPartnerCommissionFromPaidInvoice(
      {
        organizationId: "org-paid",
        amountPaidCents: 10900,
        stripeEventId: "evt_2",
        stripeInvoiceId: "in_2"
      },
      { store }
    );
    expect(second.ok).toBe(true);
    if (second.ok) {
      expect(second.commission?.commissionBps).toBe(1000);
      expect(second.commission?.commissionCents).toBe(1090);
    }

    for (let index = 3; index <= 13; index += 1) {
      await recordPartnerCommissionFromPaidInvoice(
        {
          organizationId: "org-paid",
          amountPaidCents: 10900,
          stripeEventId: `evt_${index}`,
          stripeInvoiceId: `in_${index}`
        },
        { store }
      );
    }
    const rows = await store.listCommissions(partner.id);
    const counted = rows.filter((row) => row.organizationId === "org-paid" && row.status !== "void");
    expect(counted.length).toBe(12);

    const failed = await recordPartnerCommissionFromPaidInvoice(
      {
        organizationId: "org-paid",
        amountPaidCents: 0,
        stripeEventId: "evt_fail"
      },
      { store }
    );
    expect(failed).toMatchObject({ ok: true, skipped: "not_commissionable" });

    const paidId = first.ok ? first.commission?.id : null;
    expect(paidId).toBeTruthy();
    const paid = await mutatePartner(
      {
        partnerId: partner.id,
        action: "mark_paid",
        actorUserId: "op-1",
        commissionId: paidId as string
      },
      { store }
    );
    expect(paid.ok).toBe(true);

    const voided = await voidPartnerCommissionsForRefund(
      { stripeInvoiceId: "in_1", stripeEventId: "evt_refund" },
      { store }
    );
    expect(voided.updated).toBe(1);
    const after = (await store.listCommissions()).find((row) => row.stripeInvoiceId === "in_1");
    expect(after?.status).toBe("void");
    expect(after?.offsetRequired).toBe(true);

    const pendingPay = await mutatePartner(
      {
        partnerId: partner.id,
        action: "mark_paid",
        actorUserId: "op-1",
        ...(after?.id ? { commissionId: after.id } : {})
      },
      { store }
    );
    expect(pendingPay.ok).toBe(false);
  });

  it("notifies partner staff for attribution, earned commission, paid, and suspend", async () => {
    const store = resetMemoryPartnerStore();
    const kinds: string[] = [];
    const deps = {
      store,
      notifyPartnerEvent: async (input: { kind: string }) => {
        kinds.push(input.kind);
      }
    };
    await persistApplication(application, deps);
    const partner = (await store.listPartners())[0]!;
    await mutatePartner({ partnerId: partner.id, action: "approve", actorUserId: "op-1" }, deps);
    await mutatePartner({ partnerId: partner.id, action: "activate", actorUserId: "op-1" }, deps);
    await mutatePartner(
      { partnerId: partner.id, action: "update", actorUserId: "op-1", organizationId: "org-notify" },
      deps
    );
    await recordPartnerAttribution(
      { organizationId: "cust-1", slug: "northstar-property-services", source: "checkout_ref" },
      deps
    );
    const earned = await recordPartnerCommissionFromPaidInvoice(
      {
        organizationId: "cust-1",
        amountPaidCents: 10900,
        stripeEventId: "evt-notify",
        stripeInvoiceId: "in-notify"
      },
      deps
    );
    if (earned.ok && earned.commission) {
      await mutatePartner(
        {
          partnerId: partner.id,
          action: "mark_paid",
          actorUserId: "op-1",
          commissionId: earned.commission.id
        },
        deps
      );
    }
    await mutatePartner({ partnerId: partner.id, action: "suspend", actorUserId: "op-1" }, deps);
    expect(kinds).toEqual([
      "referral_attributed",
      "commission_earned",
      "commission_paid",
      "partner_suspended"
    ]);
  });
});
