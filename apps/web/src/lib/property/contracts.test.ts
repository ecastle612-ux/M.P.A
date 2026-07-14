import { describe, expect, it } from "vitest";
import { parsePropertyMutationInput } from "./contracts";

describe("parsePropertyMutationInput metadata behavior", () => {
  it("keeps metadata unchanged when metadata is omitted", () => {
    const mutation = parsePropertyMutationInput({
      action: "update",
      name: "Updated Property Name"
    });

    expect(mutation).not.toBeNull();
    expect(mutation?.action).toBe("update");
    if (mutation?.action !== "update") {
      throw new Error("Expected update mutation");
    }

    expect(mutation.updates.name).toBe("Updated Property Name");
    expect("metadata" in mutation.updates).toBe(false);
  });

  it("updates metadata only when explicitly provided", () => {
    const mutation = parsePropertyMutationInput({
      action: "update",
      metadata: { portfolioTier: "gold", includesParking: true }
    });

    expect(mutation).not.toBeNull();
    expect(mutation?.action).toBe("update");
    if (mutation?.action !== "update") {
      throw new Error("Expected update mutation");
    }

    expect(mutation.updates.metadata).toEqual({
      portfolioTier: "gold",
      includesParking: true
    });
  });

  it("preserves explicit metadata clear semantics", () => {
    const mutation = parsePropertyMutationInput({
      action: "update",
      metadata: null
    });

    expect(mutation).not.toBeNull();
    expect(mutation?.action).toBe("update");
    if (mutation?.action !== "update") {
      throw new Error("Expected update mutation");
    }

    expect(mutation.updates.metadata).toEqual({});
  });
});
