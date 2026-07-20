import {
  allowedMimeTypesForKind,
  isMediaKind,
  maxBytesForKind,
  type MediaKind,
  type MediaStatus,
  type MediaVariant
} from "./constants";

export type CreateMediaIntentInput = {
  kind: MediaKind;
  mimeType: string;
  byteSize: number;
  originalFilename?: string;
  contentHash?: string;
  organizationId?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  replaceAssetId?: string | null;
};

export type MediaAssetDto = {
  id: string;
  organizationId: string | null;
  ownerUserId: string;
  plane: "user" | "organization";
  kind: MediaKind;
  entityType: string | null;
  entityId: string | null;
  status: MediaStatus;
  mimeType: string;
  byteSize: number;
  contentHash: string | null;
  storageBucket: string;
  storagePath: string;
  originalFilename: string | null;
  width: number | null;
  height: number | null;
  version: number;
  replacedAssetId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MediaUploadIntentResult = {
  asset: MediaAssetDto;
  uploadUrl: string;
  uploadToken: string;
  path: string;
  bucket: string;
};

export type MediaSignedUrlResult = {
  assetId: string;
  variant: MediaVariant;
  url: string;
  expiresIn: number;
  mimeType: string;
  status: MediaStatus;
};

export function parseCreateMediaIntentInput(payload: unknown): CreateMediaIntentInput | { error: string } {
  if (!payload || typeof payload !== "object") {
    return { error: "Invalid payload" };
  }
  const value = payload as Record<string, unknown>;
  const kindRaw = typeof value["kind"] === "string" ? value["kind"].trim() : "";
  if (!isMediaKind(kindRaw)) {
    return { error: "Unsupported media kind" };
  }
  const mimeType = typeof value["mimeType"] === "string" ? value["mimeType"].trim().toLowerCase() : "";
  if (!mimeType || !allowedMimeTypesForKind(kindRaw).includes(mimeType)) {
    return { error: "Unsupported file type. Use JPEG, PNG, WEBP, or HEIC." };
  }
  const byteSizeRaw = value["byteSize"];
  const byteSize =
    typeof byteSizeRaw === "number"
      ? byteSizeRaw
      : typeof byteSizeRaw === "string"
        ? Number.parseInt(byteSizeRaw, 10)
        : NaN;
  if (!Number.isFinite(byteSize) || byteSize <= 0) {
    return { error: "Invalid file size" };
  }
  if (byteSize > maxBytesForKind(kindRaw)) {
    return {
      error:
        kindRaw === "document"
          ? "File exceeds the 25 MB limit."
          : "Image exceeds the 10 MB limit."
    };
  }

  const organizationId =
    typeof value["organizationId"] === "string" && value["organizationId"].trim()
      ? value["organizationId"].trim()
      : null;
  const entityType =
    typeof value["entityType"] === "string" && value["entityType"].trim()
      ? value["entityType"].trim()
      : null;
  const entityId =
    typeof value["entityId"] === "string" && value["entityId"].trim() ? value["entityId"].trim() : null;
  const replaceAssetId =
    typeof value["replaceAssetId"] === "string" && value["replaceAssetId"].trim()
      ? value["replaceAssetId"].trim()
      : null;
  const originalFilename =
    typeof value["originalFilename"] === "string"
      ? sanitizeFilename(value["originalFilename"])
      : undefined;
  const contentHashRaw = value["contentHash"];
  const contentHash =
    typeof contentHashRaw === "string" && /^[a-f0-9]{64}$/i.test(contentHashRaw.trim())
      ? contentHashRaw.trim().toLowerCase()
      : undefined;

  if (kindRaw === "profile_photo") {
    const result: CreateMediaIntentInput = {
      kind: kindRaw,
      mimeType,
      byteSize,
      organizationId: null,
      entityType: "user",
      entityId: null,
      replaceAssetId
    };
    if (originalFilename) result.originalFilename = originalFilename;
    if (contentHash) result.contentHash = contentHash;
    return result;
  }

  if (!organizationId) {
    return { error: "organizationId is required for this media kind" };
  }

  const result: CreateMediaIntentInput = {
    kind: kindRaw,
    mimeType,
    byteSize,
    organizationId,
    entityType,
    entityId,
    replaceAssetId
  };
  if (originalFilename) result.originalFilename = originalFilename;
  if (contentHash) result.contentHash = contentHash;
  return result;
}

export function sanitizeFilename(filename: string): string {
  const base = filename.split(/[/\\]/).pop() ?? "file";
  const cleaned = base.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/_+/g, "_");
  return cleaned.slice(0, 120) || "file";
}

export function extensionForMime(mimeType: string): string {
  switch (mimeType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/heic":
    case "image/heif":
      return "heic";
    case "application/pdf":
      return "pdf";
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      return "docx";
    case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
      return "xlsx";
    default:
      return "bin";
  }
}
