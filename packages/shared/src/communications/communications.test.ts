import { describe, expect, it } from "vitest";
import { isCommsAudienceType, isCommsChannel } from "./schemas";
import { hasCommunicationsCapability } from "./permissions";

describe("Communications remediation helpers", () => {
  it("supports resident, owner, and vendor audiences", () => {
    expect(isCommsAudienceType("resident")).toBe(true);
    expect(isCommsAudienceType("owner")).toBe(true);
    expect(isCommsAudienceType("vendor")).toBe(true);
    expect(isCommsChannel("in_app")).toBe(true);
    expect(isCommsChannel("both")).toBe(true);
  });

  it("evaluates communications capabilities", () => {
    expect(
      hasCommunicationsCapability(["platform.communications:write"], "platform.communications:write")
    ).toBe(true);
    expect(
      hasCommunicationsCapability(["platform.communications:read"], "platform.communications:write")
    ).toBe(false);
  });
});
