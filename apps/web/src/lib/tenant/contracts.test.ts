import { describe, expect, it } from "vitest";
import { parseCreateTenantInput, parseTenantMutationInput } from "./contracts";

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

describe("tenant date and assignment validation", () => {
  it("rejects create payload when move-out date is before move-in date", () => {
    const parsed = parseCreateTenantInput({
      firstName: "Jordan",
      lastName: "Rivera",
      email: "jordan.rivera@example.com",
      moveInDate: "2026-08-10",
      moveOutDate: "2026-08-01"
    });

    expect(parsed).toBeNull();
  });

  it("rejects create payload when unit is set without property", () => {
    const parsed = parseCreateTenantInput({
      firstName: "Jordan",
      lastName: "Rivera",
      email: "jordan.rivera@example.com",
      unitId: "550e8400-e29b-41d4-a716-446655440000"
    });

    expect(parsed).toBeNull();
  });
});
