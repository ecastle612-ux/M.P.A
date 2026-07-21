import { describe, expect, it } from "vitest";
import { buildAiPageContextFromPathname, isBridgeOwnedPath } from "./ai-route-context";

describe("AI-001 route context", () => {
  it("maps dashboard and financials", () => {
    expect(buildAiPageContextFromPathname("/dashboard").entityType).toBe("dashboard");
    expect(buildAiPageContextFromPathname("/financials").entityType).toBe("financial");
    expect(buildAiPageContextFromPathname("/settings/appearance").entityType).toBe("settings");
  });

  it("marks entity detail paths as bridge-owned", () => {
    expect(isBridgeOwnedPath("/properties/abc")).toBe(true);
    expect(isBridgeOwnedPath("/properties")).toBe(false);
    expect(isBridgeOwnedPath("/tenants/xyz")).toBe(true);
    expect(isBridgeOwnedPath("/maintenance/wo-1")).toBe(true);
  });
});
