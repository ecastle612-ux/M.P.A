import { describe, expect, it } from "vitest";
import {
  DOCUMENT_ENTITY_TYPES,
  DOCUMENT_CATEGORIES,
  inferMimeKind,
  isDocumentEntityType,
  isDocumentCategory,
  isPdfExportTemplate
} from "./schemas";
import { hasDocumentCapability } from "./permissions";

describe("Document Intelligence helpers", () => {
  it("covers core and extended entity types", () => {
    for (const entity of ["property", "resident", "lease", "maintenance", "vendor", "asset", "unit"]) {
      expect(isDocumentEntityType(entity)).toBe(true);
    }
    expect(DOCUMENT_ENTITY_TYPES).toContain("inspection");
    expect(DOCUMENT_ENTITY_TYPES).toContain("compliance");
    expect(isDocumentCategory("evidence")).toBe(true);
    expect(isDocumentCategory("warranty")).toBe(true);
    expect(DOCUMENT_CATEGORIES).toContain("invoice");
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

  it("infers mime kinds and PDF templates", () => {
    expect(inferMimeKind("application/pdf")).toBe("pdf");
    expect(inferMimeKind("image/png")).toBe("image");
    expect(inferMimeKind("text/plain")).toBe("text");
    expect(inferMimeKind("video/mp4")).toBe("video");
    expect(isPdfExportTemplate("lease")).toBe(true);
    expect(isPdfExportTemplate("work_order")).toBe(true);
    expect(isPdfExportTemplate("rental_application")).toBe(true);
    expect(isPdfExportTemplate("approval_letter")).toBe(true);
    expect(isPdfExportTemplate("nope")).toBe(false);
  });
});
