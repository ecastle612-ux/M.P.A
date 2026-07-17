import { describe, expect, it } from "vitest";
import { parseApplicantMutationInput, parseCreateApplicantInput } from "./contracts";

describe("parseCreateApplicantInput", () => {
  it("accepts valid create payload", () => {
    const input = parseCreateApplicantInput({
      firstName: "Jordan",
      lastName: "Lee",
      email: "jordan@example.com",
      propertyId: "550e8400-e29b-41d4-a716-446655440000"
    });
    expect(input).not.toBeNull();
    expect(input?.firstName).toBe("Jordan");
    expect(input?.status).toBe("draft");
  });

  it("rejects create payload when unit is set without property", () => {
    expect(
      parseCreateApplicantInput({
        firstName: "Jordan",
        lastName: "Lee",
        email: "jordan@example.com",
        unitId: "550e8400-e29b-41d4-a716-446655440001"
      })
    ).toBeNull();
  });

  it("rejects invalid email", () => {
    expect(
      parseCreateApplicantInput({
        firstName: "Jordan",
        lastName: "Lee",
        email: "not-an-email"
      })
    ).toBeNull();
  });
});

describe("parseApplicantMutationInput", () => {
  it("parses lifecycle actions", () => {
    expect(parseApplicantMutationInput({ action: "submit" })).toEqual({ action: "submit" });
    expect(parseApplicantMutationInput({ action: "approve" })).toEqual({ action: "approve" });
    expect(parseApplicantMutationInput({ action: "convert_to_resident" })).toEqual({
      action: "convert_to_resident"
    });
  });

  it("parses decline with reason", () => {
    expect(parseApplicantMutationInput({ action: "decline", reason: "Insufficient income" })).toEqual({
      action: "decline",
      reason: "Insufficient income"
    });
  });

  it("parses add_note action", () => {
    expect(parseApplicantMutationInput({ action: "add_note", body: "Follow up on references" })).toEqual({
      action: "add_note",
      body: "Follow up on references"
    });
  });

  it("keeps metadata unchanged when metadata is omitted on update", () => {
    const mutation = parseApplicantMutationInput({ action: "update", firstName: "Alex" });
    expect(mutation?.action).toBe("update");
    if (mutation?.action === "update") {
      expect("metadata" in mutation.updates).toBe(false);
    }
  });
});
