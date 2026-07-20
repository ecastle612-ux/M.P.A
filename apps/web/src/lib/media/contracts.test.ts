import { describe, expect, it } from "vitest";
import { parseCreateMediaIntentInput, sanitizeFilename } from "./contracts";

describe("parseCreateMediaIntentInput", () => {
  it("accepts profile photo JPEG under 10MB", () => {
    const parsed = parseCreateMediaIntentInput({
      kind: "profile_photo",
      mimeType: "image/jpeg",
      byteSize: 1024
    });
    expect(parsed).toMatchObject({
      kind: "profile_photo",
      mimeType: "image/jpeg",
      organizationId: null
    });
  });

  it("rejects unsupported mime", () => {
    const parsed = parseCreateMediaIntentInput({
      kind: "profile_photo",
      mimeType: "image/gif",
      byteSize: 1024
    });
    expect(parsed).toEqual({ error: "Unsupported file type. Use JPEG, PNG, WEBP, or HEIC." });
  });

  it("rejects oversized images", () => {
    const parsed = parseCreateMediaIntentInput({
      kind: "profile_photo",
      mimeType: "image/png",
      byteSize: 11 * 1024 * 1024
    });
    expect(parsed).toEqual({ error: "Image exceeds the 10 MB limit." });
  });

  it("requires organizationId for property photos", () => {
    const parsed = parseCreateMediaIntentInput({
      kind: "property_photo",
      mimeType: "image/webp",
      byteSize: 2048
    });
    expect(parsed).toEqual({ error: "organizationId is required for this media kind" });
  });
});

describe("sanitizeFilename", () => {
  it("strips path segments and unsafe characters", () => {
    expect(sanitizeFilename("../../evil name!!.png")).toBe("evil_name_.png");
  });
});
