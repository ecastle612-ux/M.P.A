export const MEDIA_ENTITY_TYPES = [
  "maintenance",
  "vendor",
  "inspection",
  "incident",
  "organization"
] as const;

export type MediaEntityType = (typeof MEDIA_ENTITY_TYPES)[number];

export const MEDIA_FILE_TYPES = ["image", "video"] as const;
export type MediaFileType = (typeof MEDIA_FILE_TYPES)[number];

export const MEDIA_STATUSES = [
  "pending",
  "ready",
  "processing",
  "quarantined",
  "failed",
  "deleted"
] as const;
export type MediaStatus = (typeof MEDIA_STATUSES)[number];

export const MEDIA_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif"
] as const;

export const MEDIA_VIDEO_MIME_TYPES = ["video/mp4", "video/quicktime"] as const;

export const MEDIA_ALLOWED_MIME_TYPES = [
  ...MEDIA_IMAGE_MIME_TYPES,
  ...MEDIA_VIDEO_MIME_TYPES
] as const;

export type MediaAllowedMimeType = (typeof MEDIA_ALLOWED_MIME_TYPES)[number];

/** Design targets for Phase 1 validation. */
export const MEDIA_MAX_IMAGE_BYTES = 20 * 1024 * 1024;
export const MEDIA_MAX_VIDEO_BYTES = 100 * 1024 * 1024;
export const MEDIA_MAX_VIDEO_DURATION_SECONDS = 60;
export const MEDIA_SIGNED_URL_TTL_SECONDS = 15 * 60;
export const MEDIA_BUCKET = "media";

export function isMediaEntityType(value: unknown): value is MediaEntityType {
  return typeof value === "string" && (MEDIA_ENTITY_TYPES as readonly string[]).includes(value);
}

export function isMediaAllowedMimeType(value: unknown): value is MediaAllowedMimeType {
  return typeof value === "string" && (MEDIA_ALLOWED_MIME_TYPES as readonly string[]).includes(value);
}

export function mediaFileTypeForMime(mime: string): MediaFileType | null {
  if ((MEDIA_IMAGE_MIME_TYPES as readonly string[]).includes(mime)) return "image";
  if ((MEDIA_VIDEO_MIME_TYPES as readonly string[]).includes(mime)) return "video";
  return null;
}

export function maxBytesForMediaMime(mime: string): number {
  const kind = mediaFileTypeForMime(mime);
  if (kind === "image") return MEDIA_MAX_IMAGE_BYTES;
  if (kind === "video") return MEDIA_MAX_VIDEO_BYTES;
  return 0;
}

export function validateMediaUploadIntent(input: {
  mimeType: unknown;
  fileSize: unknown;
  relatedEntityType: unknown;
  originalFileName?: unknown;
}):
  | {
      ok: true;
      mimeType: MediaAllowedMimeType;
      fileType: MediaFileType;
      fileSize: number;
      relatedEntityType: MediaEntityType;
      originalFileName: string | null;
    }
  | { ok: false; error: string } {
  if (!isMediaEntityType(input.relatedEntityType)) {
    return { ok: false, error: "relatedEntityType is invalid." };
  }
  if (!isMediaAllowedMimeType(input.mimeType)) {
    return {
      ok: false,
      error: "Unsupported file type. Allowed: JPG, PNG, HEIC, WebP, MP4, MOV."
    };
  }
  if (typeof input.fileSize !== "number" || !Number.isFinite(input.fileSize) || input.fileSize <= 0) {
    return { ok: false, error: "fileSize must be a positive number." };
  }
  const max = maxBytesForMediaMime(input.mimeType);
  if (input.fileSize > max) {
    return {
      ok: false,
      error: `File exceeds maximum size (${Math.floor(max / (1024 * 1024))} MB).`
    };
  }
  const fileType = mediaFileTypeForMime(input.mimeType);
  if (!fileType) {
    return { ok: false, error: "Unsupported file type." };
  }
  const originalFileName =
    typeof input.originalFileName === "string" && input.originalFileName.trim()
      ? input.originalFileName.trim().slice(0, 255)
      : null;
  return {
    ok: true,
    mimeType: input.mimeType,
    fileType,
    fileSize: Math.floor(input.fileSize),
    relatedEntityType: input.relatedEntityType,
    originalFileName
  };
}

export function buildMediaStoragePath(input: {
  organizationId: string;
  relatedEntityType: MediaEntityType;
  relatedEntityId: string | null;
  mediaId: string;
  extension: string;
}): string {
  const entityFolder = input.relatedEntityId ?? "draft";
  const ext = input.extension.replace(/^\./, "").toLowerCase() || "bin";
  return `${input.organizationId}/${input.relatedEntityType}/${entityFolder}/${input.mediaId}/original.${ext}`;
}

export function extensionForMediaMime(mime: MediaAllowedMimeType): string {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/heic":
    case "image/heif":
      return "heic";
    case "video/mp4":
      return "mp4";
    case "video/quicktime":
      return "mov";
    default:
      return "bin";
  }
}
