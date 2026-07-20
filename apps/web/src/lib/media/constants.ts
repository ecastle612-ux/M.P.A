export const MEDIA_PRIVATE_BUCKET = "media-private";

export const MEDIA_KINDS = [
  "profile_photo",
  "property_photo",
  "unit_photo",
  "maintenance_photo",
  "inspection_photo",
  "document",
  "general"
] as const;

export type MediaKind = (typeof MEDIA_KINDS)[number];

export const MEDIA_PLANES = ["user", "organization"] as const;
export type MediaPlane = (typeof MEDIA_PLANES)[number];

export const MEDIA_STATUSES = [
  "pending_upload",
  "processing",
  "ready",
  "failed",
  "deleted"
] as const;
export type MediaStatus = (typeof MEDIA_STATUSES)[number];

export const MEDIA_VARIANTS = ["thumb", "small", "medium", "large", "original"] as const;
export type MediaVariant = (typeof MEDIA_VARIANTS)[number];

export const IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif"
] as const;

export const DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
] as const;

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_DOCUMENT_BYTES = 25 * 1024 * 1024;
export const SIGNED_URL_TTL_SECONDS = 15 * 60;
export const SIGNED_UPLOAD_TTL_SECONDS = 30 * 60;

export const VARIANT_MAX_EDGE: Record<Exclude<MediaVariant, "original">, number> = {
  thumb: 128,
  small: 320,
  medium: 960,
  large: 1920
};

export function isMediaKind(value: string): value is MediaKind {
  return (MEDIA_KINDS as readonly string[]).includes(value);
}

export function isMediaVariant(value: string): value is MediaVariant {
  return (MEDIA_VARIANTS as readonly string[]).includes(value);
}

export function isImageMimeType(mime: string): boolean {
  return (IMAGE_MIME_TYPES as readonly string[]).includes(mime);
}

export function maxBytesForKind(kind: MediaKind): number {
  return kind === "document" ? MAX_DOCUMENT_BYTES : MAX_IMAGE_BYTES;
}

export function allowedMimeTypesForKind(kind: MediaKind): readonly string[] {
  if (kind === "document") {
    return [...IMAGE_MIME_TYPES, ...DOCUMENT_MIME_TYPES];
  }
  return IMAGE_MIME_TYPES;
}
