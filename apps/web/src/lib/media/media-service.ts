import {
  MEDIA_BUCKET,
  MEDIA_SIGNED_URL_TTL_SECONDS,
  buildMediaStoragePath,
  extensionForMediaMime,
  validateMediaUploadIntent,
  type MediaEntityType,
  type MediaFileType,
  type MediaStatus
} from "@mpa/shared";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createServiceRoleClient } from "../supabase/service-role";

export type MediaAttachmentRow = {
  id: string;
  organization_id: string;
  uploaded_by_user_id: string | null;
  related_entity_type: MediaEntityType;
  related_entity_id: string | null;
  file_type: MediaFileType;
  mime_type: string;
  storage_reference: string;
  thumbnail_reference: string | null;
  preview_reference: string | null;
  file_size: number;
  sort_order: number;
  status: MediaStatus;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

function storageClient(): SupabaseClient | null {
  try {
    if (process.env["VITEST"]) return null;
    return createServiceRoleClient();
  } catch {
    return null;
  }
}

export async function createUploadIntent(input: {
  supabase: SupabaseClient;
  organizationId: string;
  userId: string | null;
  mimeType: unknown;
  fileSize: unknown;
  relatedEntityType: unknown;
  relatedEntityId?: string | null;
  originalFileName?: unknown;
}): Promise<
  | {
      media: MediaAttachmentRow;
      uploadUrl: string;
      uploadToken: string | null;
      path: string;
      expiresIn: number;
    }
  | { error: string; status?: number }
> {
  const validated = validateMediaUploadIntent({
    mimeType: input.mimeType,
    fileSize: input.fileSize,
    relatedEntityType: input.relatedEntityType,
    originalFileName: input.originalFileName
  });
  if (!validated.ok) {
    return { error: validated.error, status: 400 };
  }

  const mediaId = crypto.randomUUID();
  const relatedEntityId =
    typeof input.relatedEntityId === "string" && input.relatedEntityId.length > 0
      ? input.relatedEntityId
      : null;
  const path = buildMediaStoragePath({
    organizationId: input.organizationId,
    relatedEntityType: validated.relatedEntityType,
    relatedEntityId,
    mediaId,
    extension: extensionForMediaMime(validated.mimeType)
  });

  const nowIso = new Date().toISOString();
  const { data, error } = await input.supabase
    .from("media_attachments")
    .insert({
      id: mediaId,
      organization_id: input.organizationId,
      uploaded_by_user_id: input.userId,
      related_entity_type: validated.relatedEntityType,
      related_entity_id: relatedEntityId,
      file_type: validated.fileType,
      mime_type: validated.mimeType,
      storage_reference: path,
      thumbnail_reference: null,
      preview_reference: null,
      file_size: validated.fileSize,
      sort_order: 0,
      status: "pending",
      metadata: {
        original_filename: validated.originalFileName
      },
      created_at: nowIso,
      updated_at: nowIso
    })
    .select("*")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Failed to create media attachment.", status: 400 };
  }

  const storage = storageClient();
  if (!storage) {
    // Test / local without service role: return opaque placeholder (never a public CDN URL).
    return {
      media: data as MediaAttachmentRow,
      uploadUrl: `signed://media-upload/${path}`,
      uploadToken: "test-token",
      path,
      expiresIn: MEDIA_SIGNED_URL_TTL_SECONDS
    };
  }

  const signed = await storage.storage
    .from(MEDIA_BUCKET)
    .createSignedUploadUrl(path);
  if (signed.error || !signed.data) {
    await input.supabase
      .from("media_attachments")
      .update({ status: "failed", updated_at: new Date().toISOString() })
      .eq("id", mediaId);
    return { error: signed.error?.message ?? "Failed to mint signed upload URL.", status: 500 };
  }

  return {
    media: data as MediaAttachmentRow,
    uploadUrl: signed.data.signedUrl,
    uploadToken: signed.data.token ?? null,
    path: signed.data.path ?? path,
    expiresIn: MEDIA_SIGNED_URL_TTL_SECONDS
  };
}

export async function confirmMediaUpload(input: {
  supabase: SupabaseClient;
  organizationId: string;
  userId: string;
  mediaId: string;
}): Promise<{ media: MediaAttachmentRow } | { error: string; status?: number }> {
  const { data: existing, error: loadError } = await input.supabase
    .from("media_attachments")
    .select("*")
    .eq("id", input.mediaId)
    .eq("organization_id", input.organizationId)
    .maybeSingle();

  if (loadError) return { error: loadError.message, status: 400 };
  if (!existing || existing.deleted_at) return { error: "Not found", status: 404 };
  if (existing.uploaded_by_user_id !== input.userId) {
    return { error: "Forbidden", status: 403 };
  }
  if (existing.status === "ready") {
    return { media: existing as MediaAttachmentRow };
  }
  if (existing.status !== "pending" && existing.status !== "failed") {
    return { error: "Media cannot be confirmed in its current state.", status: 400 };
  }

  const storage = storageClient();
  if (storage) {
    const listed = await storage.storage.from(MEDIA_BUCKET).list(
      existing.storage_reference.split("/").slice(0, -1).join("/"),
      { search: existing.storage_reference.split("/").pop() }
    );
    if (listed.error) {
      return { error: listed.error.message, status: 400 };
    }
  }

  const nowIso = new Date().toISOString();
  // Phase 1: use original as preview/thumb reference for images; video poster deferred.
  const thumb =
    existing.file_type === "image" ? (existing.storage_reference as string) : null;
  const { data, error } = await input.supabase
    .from("media_attachments")
    .update({
      status: "ready",
      thumbnail_reference: thumb,
      preview_reference: existing.storage_reference,
      updated_at: nowIso
    })
    .eq("id", input.mediaId)
    .eq("organization_id", input.organizationId)
    .select("*")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Failed to confirm upload.", status: 400 };
  }
  return { media: data as MediaAttachmentRow };
}

export async function attachMediaToEntity(input: {
  supabase: SupabaseClient;
  organizationId: string;
  userId: string;
  mediaIds: string[];
  relatedEntityType: MediaEntityType;
  relatedEntityId: string;
}): Promise<{ media: MediaAttachmentRow[] } | { error: string; status?: number }> {
  if (!Array.isArray(input.mediaIds) || input.mediaIds.length === 0) {
    return { media: [] };
  }
  const unique = Array.from(new Set(input.mediaIds));
  const { data: rows, error } = await input.supabase
    .from("media_attachments")
    .select("*")
    .eq("organization_id", input.organizationId)
    .in("id", unique)
    .is("deleted_at", null);

  if (error) return { error: error.message, status: 400 };
  const list = (rows ?? []) as MediaAttachmentRow[];
  if (list.length !== unique.length) {
    return { error: "One or more media attachments were not found.", status: 404 };
  }
  for (const row of list) {
    if (row.uploaded_by_user_id !== input.userId && row.related_entity_id == null) {
      return { error: "Forbidden", status: 403 };
    }
    if (row.related_entity_type !== input.relatedEntityType) {
      return { error: "Media entity type mismatch.", status: 400 };
    }
    if (row.related_entity_id && row.related_entity_id !== input.relatedEntityId) {
      return { error: "Media already attached to another entity.", status: 409 };
    }
  }

  const nowIso = new Date().toISOString();
  const { data, error: updateError } = await input.supabase
    .from("media_attachments")
    .update({
      related_entity_id: input.relatedEntityId,
      updated_at: nowIso
    })
    .eq("organization_id", input.organizationId)
    .in("id", unique)
    .select("*");

  if (updateError) return { error: updateError.message, status: 400 };
  return { media: (data ?? []) as MediaAttachmentRow[] };
}

export async function listMediaForEntity(input: {
  supabase: SupabaseClient;
  organizationId: string;
  relatedEntityType: MediaEntityType;
  relatedEntityId: string;
}): Promise<MediaAttachmentRow[]> {
  const { data, error } = await input.supabase
    .from("media_attachments")
    .select("*")
    .eq("organization_id", input.organizationId)
    .eq("related_entity_type", input.relatedEntityType)
    .eq("related_entity_id", input.relatedEntityId)
    .eq("status", "ready")
    .is("deleted_at", null)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as MediaAttachmentRow[];
}

export async function createSignedDownloadUrl(input: {
  organizationId: string;
  storageReference: string;
}): Promise<{ url: string; expiresIn: number } | { error: string; status?: number }> {
  if (!input.storageReference.startsWith(`${input.organizationId}/`)) {
    return { error: "Forbidden", status: 403 };
  }
  const storage = storageClient();
  if (!storage) {
    return {
      url: `signed://media-download/${input.storageReference}`,
      expiresIn: MEDIA_SIGNED_URL_TTL_SECONDS
    };
  }
  const signed = await storage.storage
    .from(MEDIA_BUCKET)
    .createSignedUrl(input.storageReference, MEDIA_SIGNED_URL_TTL_SECONDS);
  if (signed.error || !signed.data?.signedUrl) {
    return { error: signed.error?.message ?? "Failed to mint download URL.", status: 500 };
  }
  return { url: signed.data.signedUrl, expiresIn: MEDIA_SIGNED_URL_TTL_SECONDS };
}

export async function softDeleteMedia(input: {
  supabase: SupabaseClient;
  organizationId: string;
  userId: string;
  mediaId: string;
  allowManager: boolean;
}): Promise<{ media: MediaAttachmentRow } | { error: string; status?: number }> {
  const { data: existing, error: loadError } = await input.supabase
    .from("media_attachments")
    .select("*")
    .eq("id", input.mediaId)
    .eq("organization_id", input.organizationId)
    .maybeSingle();

  if (loadError) return { error: loadError.message, status: 400 };
  if (!existing || existing.deleted_at) return { error: "Not found", status: 404 };
  if (existing.uploaded_by_user_id !== input.userId && !input.allowManager) {
    return { error: "Forbidden", status: 403 };
  }

  const nowIso = new Date().toISOString();
  const { data, error } = await input.supabase
    .from("media_attachments")
    .update({
      status: "deleted",
      deleted_at: nowIso,
      updated_at: nowIso
    })
    .eq("id", input.mediaId)
    .eq("organization_id", input.organizationId)
    .select("*")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Failed to delete media.", status: 400 };
  }

  const storage = storageClient();
  if (storage && typeof existing.storage_reference === "string") {
    await storage.storage.from(MEDIA_BUCKET).remove([existing.storage_reference]).catch(() => undefined);
  }

  return { media: data as MediaAttachmentRow };
}
