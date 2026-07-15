import { describe, expect, it } from "vitest";
import { parseCreateVendorInput, parseWorkOrderVendorMutationInput } from "./contracts";

describe("parseCreateVendorInput", () => {
  it("requires business name", () => {
    expect(parseCreateVendorInput({ email: "a@b.com" })).toBeNull();
  });

  it("accepts valid vendor payload", () => {
    const parsed = parseCreateVendorInput({
      businessName: "Harbor Plumbing Co",
      services: ["plumbing", "general_maintenance"],
      preferredVendor: true,
      rating: 4.5
    });
    expect(parsed?.businessName).toBe("Harbor Plumbing Co");
    expect(parsed?.services).toEqual(["plumbing", "general_maintenance"]);
    expect(parsed?.preferredVendor).toBe(true);
    expect(parsed?.rating).toBe(4.5);
  });
});

describe("parseWorkOrderVendorMutationInput", () => {
  it("parses assign vendor action", () => {
    const parsed = parseWorkOrderVendorMutationInput({
      action: "assign_vendor",
      vendorId: "550e8400-e29b-41d4-a716-446655440000"
    });
    expect(parsed?.action).toBe("assign_vendor");
  });

  it("parses vendor status update", () => {
    const parsed = parseWorkOrderVendorMutationInput({
      action: "update_vendor_status",
      assignmentStatus: "completed",
      completionNotes: "Replaced trap and tested."
    });
    expect(parsed?.action).toBe("update_vendor_status");
    if (parsed?.action === "update_vendor_status") {
      expect(parsed.assignmentStatus).toBe("completed");
    }
  });
});
