import { describe, expect, it } from "vitest";
import {
  MEDIA_MAX_IMAGE_BYTES,
  MEDIA_MAX_VIDEO_BYTES,
  buildMediaStoragePath,
  validateMediaUploadIntent
} from "./schemas";

describe("MEDIA-001 upload validation", () => {
  it("accepts allowlisted image upload intent", () => {
    const result = validateMediaUploadIntent({
      mimeType: "image/jpeg",
      fileSize: 1024,
      relatedEntityType: "maintenance",
      originalFileName: "chair.jpg"
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.fileType).toBe("image");
      expect(result.originalFileName).toBe("chair.jpg");
    }
  });

  it("accepts MP4/MOV video under size cap", () => {
    const mp4 = validateMediaUploadIntent({
      mimeType: "video/mp4",
      fileSize: MEDIA_MAX_VIDEO_BYTES,
      relatedEntityType: "maintenance"
    });
    expect(mp4.ok).toBe(true);
    const mov = validateMediaUploadIntent({
      mimeType: "video/quicktime",
      fileSize: 10_000,
      relatedEntityType: "maintenance"
    });
    expect(mov.ok).toBe(true);
  });

  it("rejects disallowed MIME and oversized files", () => {
    expect(
      validateMediaUploadIntent({
        mimeType: "application/pdf",
        fileSize: 100,
        relatedEntityType: "maintenance"
      }).ok
    ).toBe(false);
    expect(
      validateMediaUploadIntent({
        mimeType: "image/png",
        fileSize: MEDIA_MAX_IMAGE_BYTES + 1,
        relatedEntityType: "maintenance"
      }).ok
    ).toBe(false);
  });

  it("accepts conversation_message parent type", () => {
    const result = validateMediaUploadIntent({
      mimeType: "image/jpeg",
      fileSize: 2048,
      relatedEntityType: "conversation_message",
      originalFileName: "note.jpg"
    });
    expect(result.ok).toBe(true);
  });

  it("builds org-isolated storage paths", () => {
    const path = buildMediaStoragePath({
      organizationId: "org_1",
      relatedEntityType: "maintenance",
      relatedEntityId: "wo_1",
      mediaId: "media_1",
      extension: "jpg"
    });
    expect(path).toBe("org_1/maintenance/wo_1/media_1/original.jpg");
  });
});
