import { describe, expect, it } from "vitest";
import { DOCUMENT_ENTITY_TYPES, isDocumentEntityType, isDocumentCategory } from "./schemas";
import { hasDocumentCapability } from "./permissions";

describe("Documents remediation helpers", () => {
  it("covers property/resident/lease/maintenance/vendor entities", () => {
    for (const entity of ["property", "resident", "lease", "maintenance", "vendor"]) {
      expect(isDocumentEntityType(entity)).toBe(true);
    }
    expect(DOCUMENT_ENTITY_TYPES).toContain("lease");
    expect(isDocumentCategory("evidence")).toBe(true);
  });

  it("evaluates document capabilities", () => {
    expect(hasDocumentCapability(["platform.documents:read"], "platform.documents:read")).toBe(true);
    expect(hasDocumentCapability(["platform.documents:read"], "platform.documents:write")).toBe(false);
    expect(
      hasDocumentCapability(
        ["platform.documents:read", "platform.documents:write"],
        "platform.documents:write"
      )
    ).toBe(true);
  });
});
