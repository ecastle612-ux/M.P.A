import {
  MEDIA_PRIVATE_BUCKET,
  type MediaKind,
  type MediaPlane
} from "./constants";
import { extensionForMime, sanitizeFilename } from "./contracts";

export function buildOriginalStoragePath(input: {
  plane: MediaPlane;
  ownerUserId: string;
  organizationId: string | null;
  kind: MediaKind;
  entityType: string | null;
  entityId: string | null;
  assetId: string;
  mimeType: string;
  originalFilename?: string;
}): string {
  const ext = extensionForMime(input.mimeType);
  const leaf = sanitizeFilename(input.originalFilename ?? `original.${ext}`);
  const filename = leaf.includes(".") ? leaf : `${leaf}.${ext}`;

  if (input.plane === "user") {
    return `users/${input.ownerUserId}/profile/${input.assetId}/original/${filename}`;
  }

  const orgId = input.organizationId;
  if (!orgId) {
    throw new Error("organizationId required for organization plane");
  }
  const entityType = input.entityType ?? "general";
  const entityId = input.entityId ?? "unbound";
  return `${orgId}/${input.kind}/${entityType}/${entityId}/${input.assetId}/original/${filename}`;
}

export function buildVariantStoragePath(input: {
  originalPath: string;
  variant: string;
  ext?: string;
}): string {
  const parts = input.originalPath.split("/");
  const assetRoot = parts.slice(0, -2).join("/");
  const ext = input.ext ?? "webp";
  return `${assetRoot}/variants/${input.variant}.${ext}`;
}

export function mediaBucket(): string {
  return MEDIA_PRIVATE_BUCKET;
}
