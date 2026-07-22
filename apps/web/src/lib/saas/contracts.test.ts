import { describe, expect, it } from "vitest";
import { isOpenSubscriptionStatus } from "./contracts";

describe("saas contracts", () => {
  it("treats active/trialing/past_due as open", () => {
    expect(isOpenSubscriptionStatus("active")).toBe(true);
    expect(isOpenSubscriptionStatus("trialing")).toBe(true);
    expect(isOpenSubscriptionStatus("past_due")).toBe(true);
    expect(isOpenSubscriptionStatus("canceled")).toBe(false);
    expect(isOpenSubscriptionStatus("incomplete_expired")).toBe(false);
  });
});
