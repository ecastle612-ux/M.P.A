import { NextResponse } from "next/server";
import { requireMediaActor } from "../../../../../../lib/media/authz";
import { confirmMediaUpload } from "../../../../../../lib/media/media-service";

type RouteContext = { params: Promise<{ mediaId: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const { mediaId } = await context.params;
  const authz = await requireMediaActor("write");
  if ("error" in authz) return authz.error;

  const result = await confirmMediaUpload({
    supabase: authz.supabase,
    organizationId: authz.organizationId,
    userId: authz.user.id,
    mediaId
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status ?? 400 });
  }

  return NextResponse.json({
    media: {
      id: result.media.id,
      fileType: result.media.file_type,
      mimeType: result.media.mime_type,
      fileSize: result.media.file_size,
      status: result.media.status,
      relatedEntityType: result.media.related_entity_type,
      relatedEntityId: result.media.related_entity_id,
      createdAt: result.media.created_at
    }
  });
}
