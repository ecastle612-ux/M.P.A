import { NextResponse } from "next/server";
import { isMediaEntityType } from "@mpa/shared";
import { assertMediaEntityAccess, requireMediaActor } from "../../../../lib/media/authz";
import { attachMediaToEntity, listMediaForEntity } from "../../../../lib/media/media-service";

export async function GET(request: Request) {
  const authz = await requireMediaActor("read");
  if ("error" in authz) return authz.error;

  const url = new URL(request.url);
  const relatedEntityType = url.searchParams.get("relatedEntityType");
  const relatedEntityId = url.searchParams.get("relatedEntityId");
  if (!isMediaEntityType(relatedEntityType) || !relatedEntityId) {
    return NextResponse.json(
      { error: "relatedEntityType and relatedEntityId are required" },
      { status: 400 }
    );
  }

  const entityAccess = await assertMediaEntityAccess({
    supabase: authz.supabase,
    organizationId: authz.organizationId,
    relatedEntityType,
    relatedEntityId
  });
  if ("error" in entityAccess) return entityAccess.error;

  try {
    const media = await listMediaForEntity({
      supabase: authz.supabase,
      organizationId: authz.organizationId,
      relatedEntityType,
      relatedEntityId
    });
    return NextResponse.json({
      media: media.map((row) => ({
        id: row.id,
        fileType: row.file_type,
        mimeType: row.mime_type,
        fileSize: row.file_size,
        status: row.status,
        sortOrder: row.sort_order,
        uploadedByUserId: row.uploaded_by_user_id,
        createdAt: row.created_at,
        metadata: row.metadata
      }))
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list media" },
      { status: 400 }
    );
  }
}

/** Bind draft/pending-ready media IDs to a workflow entity after create. */
export async function POST(request: Request) {
  const authz = await requireMediaActor("write");
  if ("error" in authz) return authz.error;

  const payload = (await request.json().catch(() => null)) as {
    mediaIds?: unknown;
    relatedEntityType?: unknown;
    relatedEntityId?: unknown;
  } | null;

  if (
    !payload ||
    !isMediaEntityType(payload.relatedEntityType) ||
    typeof payload.relatedEntityId !== "string" ||
    !Array.isArray(payload.mediaIds)
  ) {
    return NextResponse.json(
      { error: "mediaIds, relatedEntityType, and relatedEntityId are required" },
      { status: 400 }
    );
  }

  const entityAccess = await assertMediaEntityAccess({
    supabase: authz.supabase,
    organizationId: authz.organizationId,
    relatedEntityType: payload.relatedEntityType,
    relatedEntityId: payload.relatedEntityId
  });
  if ("error" in entityAccess) return entityAccess.error;

  const mediaIds = payload.mediaIds.filter((id): id is string => typeof id === "string");
  const result = await attachMediaToEntity({
    supabase: authz.supabase,
    organizationId: authz.organizationId,
    userId: authz.user.id,
    mediaIds,
    relatedEntityType: payload.relatedEntityType,
    relatedEntityId: payload.relatedEntityId
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status ?? 400 });
  }

  return NextResponse.json({
    media: result.media.map((row) => ({
      id: row.id,
      relatedEntityId: row.related_entity_id,
      status: row.status
    }))
  });
}
