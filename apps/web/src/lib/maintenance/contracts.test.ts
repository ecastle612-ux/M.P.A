import { describe, expect, it } from "vitest";
import { parseCreateWorkOrderInput, parseWorkOrderMutationInput } from "./contracts";

describe("parseCreateWorkOrderInput", () => {
  it("requires property and title", () => {
    expect(parseCreateWorkOrderInput({ title: "Leaky faucet" })).toBeNull();
    expect(parseCreateWorkOrderInput({ propertyId: "550e8400-e29b-41d4-a716-446655440000" })).toBeNull();
  });

  it("accepts a valid create payload", () => {
    const parsed = parseCreateWorkOrderInput({
      propertyId: "550e8400-e29b-41d4-a716-446655440000",
      title: "Leaky faucet",
      priority: "high",
      status: "submitted"
    });

    expect(parsed).not.toBeNull();
    expect(parsed?.title).toBe("Leaky faucet");
    expect(parsed?.priority).toBe("high");
  });
});

describe("parseWorkOrderMutationInput", () => {
  it("parses archive action", () => {
    expect(parseWorkOrderMutationInput({ action: "archive" })).toEqual({ action: "archive" });
  });

  it("parses update action with status", () => {
    const mutation = parseWorkOrderMutationInput({ action: "update", status: "completed" });
    expect(mutation?.action).toBe("update");
    if (mutation?.action === "update") {
      expect(mutation.updates.status).toBe("completed");
    }
  });
});
