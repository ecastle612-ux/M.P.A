import { describe, expect, it } from "vitest";
import { parseTenantMutationInput } from "./contracts";

describe("parseTenantMutationInput metadata behavior", () => {
  it("keeps metadata unchanged when metadata is omitted", () => {
    const mutation = parseTenantMutationInput({
      action: "update",
      firstName: "Jordan"
    });

    expect(mutation).not.toBeNull();
    expect(mutation?.action).toBe("update");
    if (mutation?.action !== "update") {
      throw new Error("Expected update mutation");
    }

    expect(mutation.updates.firstName).toBe("Jordan");
    expect("metadata" in mutation.updates).toBe(false);
  });

  it("updates metadata only when explicitly provided", () => {
    const mutation = parseTenantMutationInput({
      action: "update",
      metadata: { leasingReadiness: "high" }
    });

    expect(mutation).not.toBeNull();
    expect(mutation?.action).toBe("update");
    if (mutation?.action !== "update") {
      throw new Error("Expected update mutation");
    }

    expect(mutation.updates.metadata).toEqual({ leasingReadiness: "high" });
  });

  it("preserves explicit metadata clear semantics", () => {
    const mutation = parseTenantMutationInput({
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
