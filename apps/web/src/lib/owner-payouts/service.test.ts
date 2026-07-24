import { describe, expect, it } from "vitest";
import { assertSafeReturnPath } from "./service";

describe("assertSafeReturnPath", () => {
  it("allows owner portal financials", () => {
    expect(assertSafeReturnPath("/portal/owner/financials")).toBe("/portal/owner/financials");
  });

  it("allows settings payouts", () => {
    expect(assertSafeReturnPath("/settings/payouts")).toBe("/settings/payouts");
  });

  it("rejects arbitrary external-looking paths", () => {
    expect(() => assertSafeReturnPath("/admin/secret")).toThrow(/not allowed/i);
  });
});
