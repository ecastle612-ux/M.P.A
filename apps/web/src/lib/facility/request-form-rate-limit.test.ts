import { describe, expect, it } from "vitest";
import {
  clearFacilityRequestRateLimitForTests,
  consumeFacilityRequestRateLimit
} from "./request-form-rate-limit";

describe("facility request rate limit", () => {
  it("allows a burst and then returns 429-equivalent false", () => {
    clearFacilityRequestRateLimitForTests();
    for (let i = 0; i < 12; i += 1) {
      expect(consumeFacilityRequestRateLimit("token:ip")).toBe(true);
    }
    expect(consumeFacilityRequestRateLimit("token:ip")).toBe(false);
    expect(consumeFacilityRequestRateLimit("other:ip")).toBe(true);
  });
});
