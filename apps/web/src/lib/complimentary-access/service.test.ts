import { beforeEach, describe, expect, it } from "vitest";
import { hashComplimentaryClaimToken } from "./tokens";
import { useMemoryComplimentaryGrantStore } from "./store";
import {
  claimComplimentaryAccess,
  expireDueComplimentaryGrants,
  findComplimentaryOrganizationForEmail,
  listComplimentaryGrantEvents,
  markComplimentaryConverted,
  mutateComplimentaryGrant,
  resendComplimentaryAccess,
  sendComplimentaryAccess
} from "./service";

const actor = "operator-1";

function deps() {
  const store = useMemoryComplimentaryGrantStore();
  const emails: Array<{ kind: string; to: string }> = [];
  const orgsCreated: string[] = [];
  const users: Array<{ id: string; email: string }> = [];
  return {
    store,
    emails,
    orgsCreated,
    users,
    deps: {
      store,
      sendWelcome: async (input: { grant: { recipientEmail: string } }) => {
        emails.push({ kind: "welcome", to: input.grant.recipientEmail });
        return { ok: true as const };
      },
      sendExpiry: async (input: { grant: { recipientEmail: string } }) => {
        emails.push({ kind: "expiry", to: input.grant.recipientEmail });
        return { ok: true as const };
      },
      findAuthUserByEmail: async (email: string) => users.find((user) => user.email === email) ?? null,
      createOrUpdateAuthUser: async ({
        email,
        existing
      }: {
        email: string;
        existing?: { id: string; email: string } | null;
      }) => existing ?? { id: `user_${email}`, email },
      createOrganization: async ({ name }: { name: string }) => {
        const organizationId = `org_${orgsCreated.length + 1}`;
        orgsCreated.push(organizationId);
        return { organizationId, organizationName: name };
      },
      assignSku: async () => ({ error: null })
    }
  };
}

describe("docs/185 complimentary grant service", () => {
  beforeEach(() => {
    useMemoryComplimentaryGrantStore();
  });

  it("sends access and records audit history", async () => {
    const ctx = deps();
    const result = await sendComplimentaryAccess(
      {
        email: "tester@example.com",
        grantType: "tester",
        productSku: "mpa_property_manager",
        durationId: "30d",
        limitMode: "product_normal"
      },
      actor,
      ctx.deps
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.grant.status).toBe("invited");
    expect(ctx.emails).toHaveLength(1);
    expect(listComplimentaryGrantEvents(result.grant.id, ctx.deps).map((event) => event.action)).toContain(
      "send_access"
    );
  });

  it("resends the same grant without creating a second organization", async () => {
    const ctx = deps();
    const first = await sendComplimentaryAccess(
      {
        email: "tester@example.com",
        grantType: "tester",
        productSku: "mpa_property_manager",
        durationId: "14d",
        limitMode: "unlimited"
      },
      actor,
      ctx.deps
    );
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const claimed = await claimComplimentaryAccess({ token: first.claimToken }, ctx.deps);
    expect(claimed.ok).toBe(true);
    const resent = await resendComplimentaryAccess(first.grant.id, actor, ctx.deps);
    expect(resent.ok).toBe(true);
    expect(ctx.orgsCreated).toHaveLength(1);
    const secondSend = await sendComplimentaryAccess(
      {
        email: "tester@example.com",
        grantType: "tester",
        productSku: "mpa_property_manager",
        durationId: "14d",
        limitMode: "unlimited"
      },
      actor,
      ctx.deps
    );
    expect(secondSend.ok).toBe(true);
    if (!secondSend.ok) return;
    expect(secondSend.resent).toBe(true);
    expect(secondSend.grant.id).toBe(first.grant.id);
    expect(ctx.orgsCreated).toHaveLength(1);
  });

  it("reuses an existing auth user on claim and cannot change SKU", async () => {
    const ctx = deps();
    ctx.users.push({ id: "existing-user", email: "tester@example.com" });
    const sent = await sendComplimentaryAccess(
      {
        email: "tester@example.com",
        grantType: "gift",
        productSku: "mpa_facility_operations",
        durationId: "none",
        limitMode: "product_normal"
      },
      actor,
      ctx.deps
    );
    expect(sent.ok).toBe(true);
    if (!sent.ok) return;
    const denied = await claimComplimentaryAccess(
      { token: sent.claimToken, requestedSku: "mpa_property_manager" },
      ctx.deps
    );
    expect(denied).toEqual({ ok: false, error: "claim_cannot_change_sku" });
    const claimed = await claimComplimentaryAccess({ token: sent.claimToken }, ctx.deps);
    expect(claimed.ok).toBe(true);
    if (!claimed.ok) return;
    expect(claimed.reusedUser).toBe(true);
    expect(claimed.userId).toBe("existing-user");
    expect(claimed.grant.productSku).toBe("mpa_facility_operations");
    expect(claimed.grant.status).toBe("active");
  });

  it("expires without deleting the organization and keeps conversion on the same org", async () => {
    const ctx = deps();
    const sent = await sendComplimentaryAccess(
      {
        email: "gift@example.com",
        grantType: "gift",
        productSku: "mpa_complete_platform",
        durationId: "7d",
        limitMode: "custom",
        customUnitLimit: 10
      },
      actor,
      ctx.deps
    );
    expect(sent.ok).toBe(true);
    if (!sent.ok) return;
    const claimed = await claimComplimentaryAccess({ token: sent.claimToken }, ctx.deps);
    expect(claimed.ok).toBe(true);
    if (!claimed.ok) return;
    ctx.store.save({
      ...claimed.grant,
      expiresAt: new Date(Date.now() - 60_000).toISOString()
    });
    const expired = expireDueComplimentaryGrants(ctx.deps);
    expect(expired.expired).toHaveLength(1);
    expect(expired.deletedOrganizations).toEqual([]);
    expect(ctx.orgsCreated).toEqual([claimed.organizationId]);
    const converted = await markComplimentaryConverted({
      email: "gift@example.com",
      organizationId: claimed.organizationId,
      paidSku: "mpa_property_manager",
      stripeSubscriptionId: "sub_live"
    }, ctx.deps);
    expect(converted?.organizationId).toBe(claimed.organizationId);
    expect(converted?.convertedAt).toBeTruthy();
    expect(findComplimentaryOrganizationForEmail("gift@example.com", ctx.deps)?.organizationId).toBe(
      claimed.organizationId
    );
  });

  it("supports Master Admin lifecycle actions", async () => {
    const ctx = deps();
    const sent = await sendComplimentaryAccess(
      {
        email: "ops@example.com",
        grantType: "tester",
        productSku: "mpa_property_manager",
        durationId: "30d",
        limitMode: "product_normal"
      },
      actor,
      ctx.deps
    );
    expect(sent.ok).toBe(true);
    if (!sent.ok) return;
    const gifted = mutateComplimentaryGrant(sent.grant.id, actor, { type: "convert_to_gift" }, ctx.deps);
    expect(gifted.ok && gifted.grant.grantType).toBe("gift");
    const noExpiry = mutateComplimentaryGrant(sent.grant.id, actor, { type: "remove_expiration" }, ctx.deps);
    expect(noExpiry.ok && noExpiry.grant.expiresAt).toBeNull();
    const limited = mutateComplimentaryGrant(
      sent.grant.id,
      actor,
      { type: "change_limit", limitMode: "custom", customUnitLimit: 12 },
      ctx.deps
    );
    expect(limited.ok && limited.grant.customUnitLimit).toBe(12);
    const revoked = mutateComplimentaryGrant(sent.grant.id, actor, { type: "revoke" }, ctx.deps);
    expect(revoked.ok && revoked.grant.status).toBe("revoked");
  });

  it("hashes claim tokens and rejects a mutated token", async () => {
    const ctx = deps();
    const sent = await sendComplimentaryAccess(
      {
        email: "hash@example.com",
        grantType: "tester",
        productSku: "mpa_property_manager",
        durationId: "30d",
        limitMode: "product_normal"
      },
      actor,
      ctx.deps
    );
    expect(sent.ok).toBe(true);
    if (!sent.ok) return;
    expect(sent.grant.claimTokenHash).toBe(hashComplimentaryClaimToken(sent.claimToken));
    const rejected = await claimComplimentaryAccess({ token: `${sent.claimToken}x` }, ctx.deps);
    expect(rejected.ok).toBe(false);
  });
});
