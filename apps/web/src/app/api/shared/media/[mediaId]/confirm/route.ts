import { NextResponse } from "next/server";
import { resolveMediaActorForMediaId } from "../../../../../../lib/media/authz";
import { writeReceiptAudit } from "../../../../../../lib/media/events-audit";
import { confirmMediaUpload } from "../../../../../../lib/media/media-service";

type RouteContext = { params: Promise<{ mediaId: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const { mediaId } = await context.params;
  const authz = await resolveMediaActorForMediaId("write", mediaId);
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

  if (result.media.attachment_category === "receipt") {
    try {
      await writeReceiptAudit({
        supabase: authz.supabase,
        organizationId: authz.organizationId,
        actorId: authz.user.id,
        action: "media.receipt.uploaded",
        entityType: result.media.related_entity_type,
        entityId: result.media.related_entity_id,
        payload: {
          mediaId: result.media.id,
          classification: "receipt",
          mimeType: result.media.mime_type,
          fileType: result.media.file_type
        }
      });
    } catch {
      // Audit must not block a successful confirm; metadata already records uploader/org/parent.
    }
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
      attachmentCategory: result.media.attachment_category,
      createdAt: result.media.created_at
    }
  });
}
