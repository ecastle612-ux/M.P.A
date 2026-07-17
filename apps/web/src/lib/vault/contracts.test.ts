import { describe, expect, it } from "vitest";
import { parseCreateVaultDocumentInput, parseUpdateVaultDocumentInput } from "./contracts";

describe("parseCreateVaultDocumentInput", () => {
  it("accepts valid document payload", () => {
    const input = parseCreateVaultDocumentInput({
      entityType: "applicant",
      entityId: "550e8400-e29b-41d4-a716-446655440000",
      documentType: "id_document",
      title: "Driver License"
    });
    expect(input).not.toBeNull();
    expect(input?.entityType).toBe("applicant");
  });

  it("rejects invalid entity type", () => {
    expect(
      parseCreateVaultDocumentInput({
        entityType: "unknown",
        entityId: "550e8400-e29b-41d4-a716-446655440000",
        documentType: "id_document",
        title: "Driver License"
      })
    ).toBeNull();
  });

  it("rejects missing title", () => {
    expect(
      parseCreateVaultDocumentInput({
        entityType: "applicant",
        entityId: "550e8400-e29b-41d4-a716-446655440000",
        documentType: "id_document"
      })
    ).toBeNull();
  });
});

describe("parseUpdateVaultDocumentInput", () => {
  it("accepts partial updates", () => {
    expect(parseUpdateVaultDocumentInput({ title: "Updated title" })).toEqual({
      title: "Updated title"
    });
  });

  it("rejects empty update payload", () => {
    expect(parseUpdateVaultDocumentInput({})).toBeNull();
  });
});
