import { describe, expect, it } from "vitest";
import {
  buildDailyOpsAssistantBriefing,
  buildDailyOpsGreeting,
  buildDailyOpsReadyAssistantCopy,
  buildMissionControlNextAction,
  MPA_ASSISTANT_KIND,
  MPA_ASSISTANT_LABEL,
  resolveDailyOpsBriefingAccess
} from "./journey";

describe("LAUNCH-001 J7 daily operations journey", () => {
  it("greets and briefs from existing attention signals", () => {
    expect(buildDailyOpsGreeting({ displayName: "Alex", hour: 9 })).toBe("Good morning, Alex.");
    const briefing = buildDailyOpsAssistantBriefing({
      propertyCount: 2,
      outstandingRent: 500,
      delinquencyCount: 1,
      openMaintenanceCount: 2,
      emergencyMaintenanceCount: 1,
      unassignedMaintenanceCount: 1,
      assignedMaintenanceCount: 1,
      pendingSignatureLeaseCount: 0,
      pendingActivationResidentCount: 1,
      vendorInvoicesAwaitingApproval: 1,
      vendorPaymentsDue: 0,
      recentActivityCount: 3,
      firstActionTitle: "Review emergency maintenance"
    });
    expect(briefing.immediateCount).toBeGreaterThan(0);
    expect(briefing.waitingOnMeCount).toBeGreaterThan(0);
    expect(briefing.waitingOnOthersCount).toBeGreaterThan(0);
    expect(briefing.summary).toContain("immediate attention");
    expect(briefing.firstTask).toContain("emergency");
  });

  it("progresses Mission Control from daily ops to owner portfolio", () => {
    const before = buildMissionControlNextAction({
      setupComplete: true,
      propertyCount: 1,
      teamReady: true,
      residentReady: true,
      leaseReady: true,
      rentReady: true,
      maintenanceReady: true,
      dailyOpsReady: false
    });
    expect(before.id).toBe("review_daily_operations");
    expect(before.href).toBe("/pm/mission-control");

    const after = buildMissionControlNextAction({
      setupComplete: true,
      propertyCount: 1,
      teamReady: true,
      residentReady: true,
      leaseReady: true,
      rentReady: true,
      maintenanceReady: true,
      dailyOpsReady: true
    });
    expect(after.id).toBe("review_owner_portfolio");
    expect(after.href).toBe("/portal/owner");
    expect(after.assistantRecommendation).toBe("Review your owner's portfolio.");
    expect(buildDailyOpsReadyAssistantCopy()).toContain(
      "I can run my property management business from this dashboard"
    );
  });

  it("does not grant finance or resident/lease briefing to technicians", () => {
    const access = resolveDailyOpsBriefingAccess({
      roles: ["maintenance_technician"],
      permissions: ["pm.properties:read", "pm.maintenance:read", "pm.maintenance:write"]
    });
    expect(access.includeFinance).toBe(false);
    expect(access.includeResidentLease).toBe(false);
  });

  it("grants finance briefing only when pm.finance:read is present", () => {
    expect(
      resolveDailyOpsBriefingAccess({
        roles: ["property_manager"],
        permissions: ["pm.properties:read"]
      }).includeFinance
    ).toBe(false);
    expect(
      resolveDailyOpsBriefingAccess({
        roles: ["property_manager"],
        permissions: ["pm.finance:read"]
      }).includeFinance
    ).toBe(true);
    expect(
      resolveDailyOpsBriefingAccess({
        roles: ["leasing_agent"],
        permissions: ["pm.finance:read"]
      })
    ).toEqual({ includeFinance: true, includeResidentLease: true });
  });

  it("labels the assistant as a rule-based briefing, not a chat", () => {
    expect(MPA_ASSISTANT_LABEL).toBe("M.P.A. Assistant");
    expect(MPA_ASSISTANT_KIND).toMatch(/rule-based/i);
    expect(MPA_ASSISTANT_KIND).not.toMatch(/chat|generative|openai/i);
  });
});
