import { describe, expect, it } from "vitest";
import {
  assertValidStageTransition,
  stageTransitionCreatesOrganization
} from "./opportunities";
import { STAGES_FORBIDDEN_FOR_ORG_CREATE, STAGE_DEFAULT_PROBABILITY } from "./types";
import { buildActivationPacket } from "./activation";
import type { CommercialOpportunity } from "./types";

describe("COM-001 Slice A pipeline rules", () => {
  it("never creates an organization from stage transition (CA-03 / SP-04)", () => {
    for (const stage of STAGES_FORBIDDEN_FOR_ORG_CREATE) {
      expect(stageTransitionCreatesOrganization(stage)).toBe(false);
    }
    expect(stageTransitionCreatesOrganization("subscription_purchased")).toBe(false);
    expect(stageTransitionCreatesOrganization("organization_created")).toBe(false);
  });

  it("requires lost reason on Lost", () => {
    expect(() =>
      assertValidStageTransition({ from: "negotiation", to: "lost", lostReason: "" })
    ).toThrow(/Lost Reason/i);
    expect(() =>
      assertValidStageTransition({
        from: "negotiation",
        to: "lost",
        lostReason: "No budget"
      })
    ).not.toThrow();
  });

  it("blocks backward moves after subscription purchased", () => {
    expect(() =>
      assertValidStageTransition({
        from: "subscription_purchased",
        to: "won"
      })
    ).toThrow(/backward/i);
  });

  it("sets default probabilities per stage", () => {
    expect(STAGE_DEFAULT_PROBABILITY.won).toBe(90);
    expect(STAGE_DEFAULT_PROBABILITY.subscription_purchased).toBe(100);
    expect(STAGE_DEFAULT_PROBABILITY.lost).toBe(0);
  });
});

describe("COM-001 activation packet", () => {
  const opportunity: CommercialOpportunity = {
    id: "opp-1",
    stage: "won",
    companyName: "Acme PM",
    contactEmail: "buyer@acme.test",
    contactName: "Ada",
    source: "inbound",
    salesOwnerId: "user-1",
    expectedClose: "2026-08-01",
    probability: 90,
    lostReason: null,
    acquisitionCostCents: 12000,
    referralSource: "partner",
    demoCompletedAt: "2026-07-01T00:00:00.000Z",
    planCode: "professional",
    organizationType: "property_manager",
    implementationPreference: null,
    organizationId: null,
    externalCrmOpportunityId: null,
    notes: null,
    createdBy: "user-1",
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z"
  };

  it("includes required COM handoff fields (CA-04)", () => {
    const packet = buildActivationPacket({
      opportunity,
      saasSubscriptionId: "sub_123",
      planCode: "professional",
      idempotencyKey: "saas:stripe:checkout:evt_1"
    });
    expect(packet.saasSubscriptionId).toBe("sub_123");
    expect(packet.planCode).toBe("professional");
    expect(packet.organizationType).toBe("property_manager");
    expect(packet.buyerContactEmail).toBe("buyer@acme.test");
    expect(packet.buyerCompanyName).toBe("Acme PM");
    expect(packet.implementationPreference).toBe("ai_guided");
    expect(packet.salesOwnerId).toBe("user-1");
    expect(packet.idempotencyKey).toBe("saas:stripe:checkout:evt_1");
    expect(packet.opportunityId).toBe("opp-1");
  });
});
