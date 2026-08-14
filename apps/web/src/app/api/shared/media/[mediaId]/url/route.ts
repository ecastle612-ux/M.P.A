import { NextResponse } from "next/server";
import { assertMediaEntityAccess, resolveMediaActorWithFallback } from "../../../../../../lib/media/authz";
import {
  createSignedDownloadUrl
} from "../../../../../../lib/media/media-service";
import type { MediaEntityType } from "@mpa/shared";

type RouteContext = { params: Promise<{ mediaId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { mediaId } = await context.params;
  const authz = await resolveMediaActorWithFallback("read");
  if ("error" in authz) return authz.error;

  const { data: media, error } = await authz.supabase
    .from("media_attachments")
    .select("*")
    .eq("id", mediaId)
    .eq("organization_id", authz.organizationId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  if (!media || media.deleted_at || media.status === "deleted") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (media.status !== "ready") {
    return NextResponse.json({ error: "Media is not ready" }, { status: 409 });
  }

  const entityAccess = await assertMediaEntityAccess({
    supabase: authz.supabase,
    organizationId: authz.organizationId,
    relatedEntityType: media.related_entity_type as MediaEntityType,
    relatedEntityId: (media.related_entity_id as string | null) ?? null,
    conversationActor: { plane: authz.plane, tenantAccountId: authz.tenantAccountId }
  });
  if ("error" in entityAccess) return entityAccess.error;

  const variant = "original";
  const storageReference =
    variant === "original"
      ? (media.storage_reference as string)
      : ((media.thumbnail_reference as string | null) ?? (media.storage_reference as string));

  const signed = await createSignedDownloadUrl({
    organizationId: authz.organizationId,
    storageReference
  });
  if ("error" in signed) {
    return NextResponse.json({ error: signed.error }, { status: signed.status ?? 400 });
  }

  return NextResponse.json({
    url: signed.url,
    expiresIn: signed.expiresIn,
    fileType: media.file_type,
    mimeType: media.mime_type
  });
}
