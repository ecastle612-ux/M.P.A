import { describe, expect, it } from "vitest";
import { bandFromScore, computeHealthFromSignals } from "./health";
import type { HealthSignalInput } from "./health-types";
import { filterEntitledDiscoveries } from "./discovery";
import { sanitizeTimelineMetadata } from "./timeline";

function baseSignals(overrides: Partial<HealthSignalInput> = {}): HealthSignalInput {
  return {
    saasStatus: "active",
    commercialStatus: "active",
    orgAdminDaysSinceLogin: 2,
    implementationScore: 100,
    productionReady: true,
    workOrderCount: 3,
    aiConversationCount: 2,
    aiEntitled: true,
    maintenanceEntitled: true,
    openSupportCount: 0,
    notificationChannelsEnabled: true,
    orgAgeDays: 30,
    ...overrides
  };
}

describe("COM-001 Slice C health bands", () => {
  it("maps score to Healthy → Critical bands", () => {
    expect(bandFromScore(90)).toBe("healthy");
    expect(bandFromScore(75)).toBe("healthy");
    expect(bandFromScore(60)).toBe("needs_attention");
    expect(bandFromScore(40)).toBe("at_risk");
    expect(bandFromScore(10)).toBe("critical");
  });

  it("applies high-weight payment + login penalties", () => {
    const result = computeHealthFromSignals(
      baseSignals({
        saasStatus: "past_due",
        orgAdminDaysSinceLogin: 30
      })
    );
    expect(result.score).toBeLessThanOrEqual(40);
    expect(result.band === "at_risk" || result.band === "critical").toBe(true);
    expect(result.drivers.some((d) => d.factor === "payment_status")).toBe(true);
    expect(result.drivers.some((d) => d.factor === "login_frequency")).toBe(true);
  });

  it("is deterministic for identical signals", () => {
    const a = computeHealthFromSignals(baseSignals());
    const b = computeHealthFromSignals(baseSignals());
    expect(a).toEqual(b);
    expect(a.band).toBe("healthy");
  });
});

describe("COM-001 Slice C feature discovery entitlements", () => {
  it("never returns unpurchased feature keys", () => {
    const keys = filterEntitledDiscoveries({
      features: {
        financials: true,
        maintenance: false,
        ai_copilot: false,
        owner_portal: false
      }
    });
    expect(keys).toContain("payments_gap");
    expect(keys).not.toContain("ai_never_used");
    expect(keys).not.toContain("low_wo_adoption");
    expect(keys).not.toContain("owner_reports_unused");
  });
});

describe("COM-001 Slice C timeline secret scrubbing", () => {
  it("strips credential-like metadata keys", () => {
    const clean = sanitizeTimelineMetadata({
      discovery_key: "ai_never_used",
      temporary_password: "should-not-persist",
      token: "abc",
      ok: true
    });
    expect(clean["discovery_key"]).toBe("ai_never_used");
    expect(clean["ok"]).toBe(true);
    expect(clean["temporary_password"]).toBeUndefined();
    expect(clean["token"]).toBeUndefined();
  });
});
