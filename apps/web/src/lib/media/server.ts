import type { Database, Json } from "@mpa/supabase";
import type { User } from "@supabase/supabase-js";
import { createServiceRoleServerClient } from "../auth/server";
import {
  MEDIA_PRIVATE_BUCKET,
  SIGNED_URL_TTL_SECONDS,
  type MediaKind,
  type MediaStatus,
  type MediaVariant
} from "./constants";
import type {
  CreateMediaIntentInput,
  MediaAssetDto,
  MediaSignedUrlResult,
  MediaUploadIntentResult
} from "./contracts";
import { buildOriginalStoragePath, buildVariantStoragePath, mediaBucket } from "./paths";
import { canDeleteMedia, canReadMedia, canWriteMedia } from "./permissions";

type MediaAssetRow = Database["public"]["Tables"]["media_assets"]["Row"];

function requireServiceClient() {
  const client = createServiceRoleServerClient();
  if (!client) {
    throw new Error("Service role client is not configured");
  }
  return client;
}

function mapAsset(row: MediaAssetRow): MediaAssetDto {
  return {
    id: row.id,
    organizationId: row.organization_id,
    ownerUserId: row.owner_user_id,
    plane: row.plane,
    kind: row.kind as MediaKind,
    entityType: row.entity_type,
    entityId: row.entity_id,
    status: row.status as MediaStatus,
    mimeType: row.mime_type,
    byteSize: row.byte_size,
    contentHash: row.content_hash,
    storageBucket: row.storage_bucket,
    storagePath: row.storage_path,
    originalFilename: row.original_filename,
    width: row.width,
    height: row.height,
    version: row.version,
    replacedAssetId: row.replaced_asset_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function writeAudit(input: {
  mediaAssetId: string | null;
  actorUserId: string | null;
  organizationId: string | null;
  eventType:
    | "uploaded"
    | "replaced"
    | "deleted"
    | "signed_url_issued"
    | "processing_started"
    | "processing_completed"
    | "processing_failed"
    | "scan_queued"
    | "scan_cleared"
    | "scan_blocked";
  details?: Json;
}) {
  const supabase = requireServiceClient();
  await supabase.from("media_audit_events").insert({
    media_asset_id: input.mediaAssetId,
    actor_user_id: input.actorUserId,
    organization_id: input.organizationId,
    event_type: input.eventType,
    details: input.details ?? {}
  });
}

export async function createUploadIntent(
  user: User,
  input: CreateMediaIntentInput
): Promise<MediaUploadIntentResult> {
  const plane = input.kind === "profile_photo" ? "user" : "organization";
  const organizationId = plane === "user" ? null : input.organizationId ?? null;

  const allowed = await canWriteMedia({
    user,
    plane,
    organizationId,
    ownerUserId: user.id
  });
  if (!allowed) {
    throw new Error("FORBIDDEN");
  }

  const supabase = requireServiceClient();
  const assetId = crypto.randomUUID();
  const pathInput: Parameters<typeof buildOriginalStoragePath>[0] = {
    plane,
    ownerUserId: user.id,
    organizationId,
    kind: input.kind,
    entityType: input.entityType ?? (plane === "user" ? "user" : null),
    entityId: input.entityId ?? (plane === "user" ? user.id : null),
    assetId,
    mimeType: input.mimeType
  };
  if (input.originalFilename) {
    pathInput.originalFilename = input.originalFilename;
  }
  const storagePath = buildOriginalStoragePath(pathInput);

  let version = 1;
  if (input.replaceAssetId) {
    const { data: previous } = await supabase
      .from("media_assets")
      .select("*")
      .eq("id", input.replaceAssetId)
      .maybeSingle();
    if (!previous || previous.deleted_at) {
      throw new Error("Replace target not found");
    }
    const canReplace = await canWriteMedia({
      user,
      plane: previous.plane,
      organizationId: previous.organization_id,
      ownerUserId: previous.owner_user_id
    });
    if (!canReplace) {
      throw new Error("FORBIDDEN");
    }
    version = previous.version + 1;
  }

  const { data: inserted, error } = await supabase
    .from("media_assets")
    .insert({
      id: assetId,
      organization_id: organizationId,
      owner_user_id: user.id,
      plane,
      kind: input.kind,
      entity_type: input.entityType ?? (plane === "user" ? "user" : null),
      entity_id: input.entityId ?? (plane === "user" ? user.id : null),
      status: "pending_upload",
      mime_type: input.mimeType,
      byte_size: input.byteSize,
      content_hash: input.contentHash ?? null,
      storage_bucket: MEDIA_PRIVATE_BUCKET,
      storage_path: storagePath,
      original_filename: input.originalFilename ?? null,
      version,
      replaced_asset_id: input.replaceAssetId ?? null,
      metadata: {}
    })
    .select("*")
    .single();

  if (error || !inserted) {
    throw new Error(error?.message ?? "Could not create media asset");
  }

  const { data: signed, error: signedError } = await supabase.storage
    .from(mediaBucket())
    .createSignedUploadUrl(storagePath);

  if (signedError || !signed) {
    await supabase.from("media_assets").update({ status: "failed" }).eq("id", assetId);
    throw new Error(signedError?.message ?? "Could not create signed upload URL");
  }

  if (input.replaceAssetId) {
    await writeAudit({
      mediaAssetId: assetId,
      actorUserId: user.id,
      organizationId,
      eventType: "replaced",
      details: { replacedAssetId: input.replaceAssetId }
    });
  }

  return {
    asset: mapAsset(inserted),
    uploadUrl: signed.signedUrl,
    uploadToken: signed.token,
    path: signed.path,
    bucket: MEDIA_PRIVATE_BUCKET
  };
}

export async function confirmUpload(user: User, assetId: string): Promise<MediaAssetDto> {
  const supabase = requireServiceClient();
  const { data: asset, error } = await supabase.from("media_assets").select("*").eq("id", assetId).maybeSingle();
  if (error || !asset || asset.deleted_at) {
    throw new Error("Media asset not found");
  }

  const allowed = await canWriteMedia({
    user,
    plane: asset.plane,
    organizationId: asset.organization_id,
    ownerUserId: asset.owner_user_id
  });
  if (!allowed) {
    throw new Error("FORBIDDEN");
  }

  if (asset.status !== "pending_upload" && asset.status !== "failed") {
    return mapAsset(asset);
  }

  const folder = asset.storage_path.split("/").slice(0, -1).join("/");
  const leaf = asset.storage_path.split("/").pop();
  const { data: objects, error: listError } = await supabase.storage.from(asset.storage_bucket).list(folder, {
    ...(leaf ? { search: leaf } : {})
  });

  if (listError) {
    throw new Error(listError.message);
  }

  const found = leaf ? (objects ?? []).some((object) => object.name === leaf) : false;
  if (!found) {
    // Fallback: try download head via createSignedUrl existence
    const { error: downloadError } = await supabase.storage
      .from(asset.storage_bucket)
      .createSignedUrl(asset.storage_path, 60);
    if (downloadError) {
      throw new Error("Upload not found in storage. Please retry the upload.");
    }
  }

  if (asset.replaced_asset_id) {
    await supabase
      .from("media_assets")
      .update({ status: "deleted", deleted_at: new Date().toISOString() })
      .eq("id", asset.replaced_asset_id);
  }

  const { data: updated, error: updateError } = await supabase
    .from("media_assets")
    .update({ status: "processing" })
    .eq("id", assetId)
    .select("*")
    .single();

  if (updateError || !updated) {
    throw new Error(updateError?.message ?? "Could not confirm upload");
  }

  await writeAudit({
    mediaAssetId: assetId,
    actorUserId: user.id,
    organizationId: asset.organization_id,
    eventType: "uploaded"
  });
  await writeAudit({
    mediaAssetId: assetId,
    actorUserId: user.id,
    organizationId: asset.organization_id,
    eventType: "processing_started"
  });

  // Ensure original variant row exists pointing at original path
  await supabase.from("media_asset_variants").upsert(
    {
      media_asset_id: assetId,
      variant: "original",
      storage_path: asset.storage_path,
      mime_type: asset.mime_type,
      byte_size: asset.byte_size,
      width: asset.width,
      height: asset.height
    },
    { onConflict: "media_asset_id,variant" }
  );

  return mapAsset(updated);
}

export async function getSignedMediaUrl(
  user: User,
  assetId: string,
  variant: MediaVariant = "small"
): Promise<MediaSignedUrlResult> {
  const supabase = requireServiceClient();
  const { data: asset, error } = await supabase.from("media_assets").select("*").eq("id", assetId).maybeSingle();
  if (error || !asset || asset.deleted_at) {
    throw new Error("Media asset not found");
  }

  const allowed = await canReadMedia({
    user,
    plane: asset.plane,
    organizationId: asset.organization_id,
    ownerUserId: asset.owner_user_id
  });
  if (!allowed) {
    throw new Error("FORBIDDEN");
  }

  let path = asset.storage_path;
  let mimeType = asset.mime_type;

  if (variant !== "original") {
    const { data: variantRow } = await supabase
      .from("media_asset_variants")
      .select("*")
      .eq("media_asset_id", assetId)
      .eq("variant", variant)
      .maybeSingle();

    if (variantRow) {
      path = variantRow.storage_path;
      mimeType = variantRow.mime_type;
    } else if (asset.status === "processing" || asset.status === "pending_upload") {
      // Fall back to original while processing
      path = asset.storage_path;
    } else {
      const { data: thumb } = await supabase
        .from("media_asset_variants")
        .select("*")
        .eq("media_asset_id", assetId)
        .eq("variant", "thumb")
        .maybeSingle();
      if (thumb) {
        path = thumb.storage_path;
        mimeType = thumb.mime_type;
      }
    }
  }

  const { data: signed, error: signedError } = await supabase.storage
    .from(asset.storage_bucket)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

  if (signedError || !signed?.signedUrl) {
    throw new Error(signedError?.message ?? "Could not create signed URL");
  }

  return {
    assetId,
    variant,
    url: signed.signedUrl,
    expiresIn: SIGNED_URL_TTL_SECONDS,
    mimeType,
    status: asset.status as MediaStatus
  };
}

export async function getMediaAsset(user: User, assetId: string): Promise<MediaAssetDto> {
  const supabase = requireServiceClient();
  const { data: asset, error } = await supabase.from("media_assets").select("*").eq("id", assetId).maybeSingle();
  if (error || !asset || asset.deleted_at) {
    throw new Error("Media asset not found");
  }
  const allowed = await canReadMedia({
    user,
    plane: asset.plane,
    organizationId: asset.organization_id,
    ownerUserId: asset.owner_user_id
  });
  if (!allowed) {
    throw new Error("FORBIDDEN");
  }
  return mapAsset(asset);
}

export async function deleteMediaAsset(user: User, assetId: string): Promise<void> {
  const supabase = requireServiceClient();
  const { data: asset, error } = await supabase.from("media_assets").select("*").eq("id", assetId).maybeSingle();
  if (error || !asset || asset.deleted_at) {
    throw new Error("Media asset not found");
  }

  const allowed = await canDeleteMedia({
    user,
    plane: asset.plane,
    organizationId: asset.organization_id,
    ownerUserId: asset.owner_user_id
  });
  if (!allowed) {
    throw new Error("FORBIDDEN");
  }

  const { data: variants } = await supabase
    .from("media_asset_variants")
    .select("storage_path")
    .eq("media_asset_id", assetId);

  const paths = [asset.storage_path, ...(variants ?? []).map((row) => row.storage_path)];
  const uniquePaths = [...new Set(paths)];
  if (uniquePaths.length > 0) {
    await supabase.storage.from(asset.storage_bucket).remove(uniquePaths);
  }

  await supabase
    .from("media_assets")
    .update({ status: "deleted", deleted_at: new Date().toISOString() })
    .eq("id", assetId);

  await writeAudit({
    mediaAssetId: assetId,
    actorUserId: user.id,
    organizationId: asset.organization_id,
    eventType: "deleted"
  });
}

export function variantPathFor(asset: MediaAssetRow, variant: Exclude<MediaVariant, "original">): string {
  return buildVariantStoragePath({
    originalPath: asset.storage_path,
    variant,
    ext: "webp"
  });
}

export { writeAudit, mapAsset, requireServiceClient };
