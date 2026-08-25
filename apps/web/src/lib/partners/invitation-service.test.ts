import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_COMMISSION_BPS, PARTNER_INVITATION_TTL_MS } from "@mpa/shared";
import { persistApplication } from "./service";
import { getMemoryPartnerStore, resetMemoryPartnerStore } from "./store";
import {
  acceptPartnerInvitation,
  inviteApprovedPartner,
  invitePartnerDirect,
  issuePartnerInvitation,
  lookupInvitationByRawToken,
  resendPartnerInvitation
} from "./invitation-service";
import { hashPartnerInvitationToken, issuePartnerInvitationToken } from "./invitation-tokens";

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

function deps() {
  const store = getMemoryPartnerStore();
  return {
    store,
    createdOrgs: [] as string[],
    memberships: [] as Array<{ organizationId: string; userId: string }>,
    emails: [] as string[],
    createPartnerOrganization: async ({ name }: { name: string }) => {
      const organizationId = `org_${name.replace(/\s+/g, "_").toLowerCase()}`;
      return { organizationId };
    },
    ensurePartnerMembership: async (input: { organizationId: string; userId: string }) => {
      void input;
    }
  };
}

describe("PARTNER-005 invitation service", () => {
  beforeEach(() => {
    resetMemoryPartnerStore();
  });

  it("invites after public approval and does not auto-approve applications", async () => {
    const store = resetMemoryPartnerStore();
    await persistApplication(application, { store });
    const partner = (await store.listPartners())[0]!;
    expect(partner.status).toBe("applied");
    const issued = await inviteApprovedPartner({ partnerId: partner.id, actorUserId: "op-1" }, deps());
    expect(issued.ok).toBe(true);
    expect((await store.getPartner(partner.id))?.status).toBe("applied");
  });

  it("supports direct invite without a public application and reuses email matches", async () => {
    const first = await invitePartnerDirect(
      {
        companyName: "NorthStar Property Services",
        contactName: "Alex Rivera",
        email: "Alex@Northstar.example",
        partnerType: "certified_service"
      },
      { actorUserId: "op-1" },
      deps()
    );
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(first.created).toBe(true);
    expect(first.partner.status).toBe("approved");
    expect(first.partner.commissionBps).toBe(DEFAULT_COMMISSION_BPS);

    const second = await invitePartnerDirect(
      {
        companyName: "Different Name LLC",
        contactName: "Alex Rivera",
        email: "alex@northstar.example",
        partnerType: "strategic"
      },
      { actorUserId: "op-1" },
      deps()
    );
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.created).toBe(false);
    expect(second.reused).toBe(true);
    expect(second.partner.id).toBe(first.partner.id);
    expect((await getMemoryPartnerStore().listPartners()).length).toBe(1);
  });

  it("reconciles an existing application by email instead of creating another partner", async () => {
    const store = resetMemoryPartnerStore();
    await persistApplication(application, { store });
    const result = await invitePartnerDirect(
      {
        companyName: "NorthStar Property Services",
        contactName: "Alex Rivera",
        email: "alex@northstar.example",
        partnerType: "certified_service"
      },
      { actorUserId: "op-1" },
      deps()
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.created).toBe(false);
    expect(result.partner.status).toBe("approved");
    expect((await store.listPartners()).length).toBe(1);
  });

  it("rejects expired, used, malformed, random, and cross-partner tokens", async () => {
    const issued = await invitePartnerDirect(
      {
        companyName: "NorthStar Property Services",
        contactName: "Alex Rivera",
        email: "alex@northstar.example",
        partnerType: "referral"
      },
      { actorUserId: "op-1" },
      deps()
    );
    expect(issued.ok).toBe(true);
    if (!issued.ok) return;

    const lookup = await lookupInvitationByRawToken("not-a-token", getMemoryPartnerStore());
    expect(lookup.invitation).toBeNull();

    const random = await acceptPartnerInvitation(
      { token: "aaaaaaaaaaaaaaaaaaaaaaaaaaaa", userId: "user-1", userEmail: "alex@northstar.example" },
      deps()
    );
    expect(random.ok).toBe(false);
    if (!random.ok) expect(random.code).toBe("unavailable");

    const malformed = await acceptPartnerInvitation(
      { token: "short", userId: "user-1", userEmail: "alex@northstar.example" },
      deps()
    );
    expect(malformed.ok).toBe(false);

    const other = issuePartnerInvitationToken();
    const stolen = await acceptPartnerInvitation(
      { token: other.token, userId: "user-1", userEmail: "alex@northstar.example" },
      deps()
    );
    expect(stolen.ok).toBe(false);

    const invitation = issued.invitation;
    await getMemoryPartnerStore().updateInvitation({
      ...invitation,
      expiresAt: new Date(Date.now() - 1000).toISOString()
    });
    const raw = "this-is-a-known-invalid-path";
    expect(hashPartnerInvitationToken(raw)).not.toBe(invitation.tokenHash);

    const expiredInvite = await invitePartnerDirect(
      {
        companyName: "Second Co",
        contactName: "Blake",
        email: "blake@second.example",
        partnerType: "referral"
      },
      { actorUserId: "op-1" },
      deps()
    );
    expect(expiredInvite.ok).toBe(true);
    if (!expiredInvite.ok) return;
    await getMemoryPartnerStore().updateInvitation({
      ...expiredInvite.invitation,
      expiresAt: new Date(Date.now() - 60_000).toISOString(),
      tokenHash: hashPartnerInvitationToken("expiredtokenexpiredtokenex")
    });
    const expired = await acceptPartnerInvitation(
      {
        token: "expiredtokenexpiredtokenex",
        userId: "user-2",
        userEmail: "blake@second.example"
      },
      deps()
    );
    expect(expired.ok).toBe(false);
    if (!expired.ok) {
      expect(expired.code).toBe("expired");
      expect(expired.error).toBe("This partner invitation has expired.");
    }
  });

  it("binds email, ignores client org override, and does not change commission snapshots", async () => {
    const created = await invitePartnerDirect(
      {
        companyName: "NorthStar Property Services",
        contactName: "Alex Rivera",
        email: "alex@northstar.example",
        partnerType: "certified_service"
      },
      { actorUserId: "op-1" },
      deps()
    );
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const pending = created.invitation;
    const rawToken = "accepttokenaccepttokenacce";
    await getMemoryPartnerStore().updateInvitation({
      ...pending,
      tokenHash: hashPartnerInvitationToken(rawToken)
    });

    const wrongEmail = await acceptPartnerInvitation(
      { token: rawToken, userId: "user-other", userEmail: "other@example.com" },
      deps()
    );
    expect(wrongEmail.ok).toBe(false);
    if (!wrongEmail.ok) expect(wrongEmail.code).toBe("email_mismatch");

    const override = await acceptPartnerInvitation(
      {
        token: rawToken,
        userId: "user-1",
        userEmail: "alex@northstar.example",
        clientPayload: { organizationId: "org-hijack", partnerId: "partner-b" }
      },
      deps()
    );
    expect(override.ok).toBe(false);

    const accepted = await acceptPartnerInvitation(
      { token: rawToken, userId: "user-1", userEmail: "alex@northstar.example" },
      deps()
    );
    expect(accepted.ok).toBe(true);
    if (!accepted.ok) return;
    expect(accepted.organizationId).not.toBe("org-hijack");
    expect(accepted.partner.commissionBps).toBe(DEFAULT_COMMISSION_BPS);
    expect(accepted.partner.status).toBe("active");

    const reused = await acceptPartnerInvitation(
      { token: rawToken, userId: "user-1", userEmail: "alex@northstar.example" },
      deps()
    );
    expect(reused.ok).toBe(true);
    if (reused.ok) expect(reused.alreadyAccepted).toBe(true);

    const otherUser = await acceptPartnerInvitation(
      { token: rawToken, userId: "user-2", userEmail: "alex@northstar.example" },
      deps()
    );
    expect(otherUser.ok).toBe(false);
  });

  it("resend revokes the prior pending token and preserves the partner", async () => {
    const created = await invitePartnerDirect(
      {
        companyName: "NorthStar Property Services",
        contactName: "Alex Rivera",
        email: "alex@northstar.example",
        partnerType: "referral"
      },
      { actorUserId: "op-1" },
      deps()
    );
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const firstToken = "firsttokenfirsttokenfirstto";
    await getMemoryPartnerStore().updateInvitation({
      ...created.invitation,
      tokenHash: hashPartnerInvitationToken(firstToken)
    });
    const resent = await resendPartnerInvitation({ partnerId: created.partner.id, actorUserId: "op-1" }, deps());
    expect(resent.ok).toBe(true);
    const previous = await getMemoryPartnerStore().getInvitation(created.invitation.id);
    expect(previous?.status).toBe("revoked");
    const stale = await acceptPartnerInvitation(
      { token: firstToken, userId: "user-1", userEmail: "alex@northstar.example" },
      deps()
    );
    expect(stale.ok).toBe(false);
    expect((await getMemoryPartnerStore().listPartners()).length).toBe(1);
  });

  it("uses a single invitation TTL constant", () => {
    const issued = issuePartnerInvitationToken();
    const remaining = Date.parse(issued.expiresAt) - Date.now();
    expect(remaining).toBeGreaterThan(PARTNER_INVITATION_TTL_MS - 5_000);
    expect(remaining).toBeLessThanOrEqual(PARTNER_INVITATION_TTL_MS);
    expect(issued.hash).toBe(hashPartnerInvitationToken(issued.token));
    expect(issued.token).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}/);
  });
});

describe("PARTNER-005 issue after approve", () => {
  beforeEach(() => {
    resetMemoryPartnerStore();
  });

  it("does not create a second partner when inviting an existing approved row", async () => {
    const store = resetMemoryPartnerStore();
    await persistApplication(application, { store });
    const partner = (await store.listPartners())[0]!;
    const first = await issuePartnerInvitation(
      { partnerId: partner.id, actorUserId: "op-1", source: "application_approval" },
      deps()
    );
    const second = await issuePartnerInvitation(
      { partnerId: partner.id, actorUserId: "op-1", source: "application_approval" },
      deps()
    );
    expect(first.ok && second.ok).toBe(true);
    if (first.ok && second.ok) {
      expect(second.reused).toBe(true);
      expect(second.invitation.id).toBe(first.invitation.id);
    }
    expect((await store.listPartners()).length).toBe(1);
  });
});
