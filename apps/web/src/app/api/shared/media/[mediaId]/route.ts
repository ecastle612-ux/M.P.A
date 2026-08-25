import { NextResponse } from "next/server";
import { isOrgManagerRoles, resolveMediaActorForMediaId } from "../../../../../lib/media/authz";
import { writeReceiptAudit } from "../../../../../lib/media/events-audit";
import { softDeleteMedia } from "../../../../../lib/media/media-service";

type RouteContext = { params: Promise<{ mediaId: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
  const { mediaId } = await context.params;
  const authz = await resolveMediaActorForMediaId("write", mediaId);
  if ("error" in authz) return authz.error;

  const result = await softDeleteMedia({
    supabase: authz.supabase,
    organizationId: authz.organizationId,
    userId: authz.user.id,
    mediaId,
    allowManager: isOrgManagerRoles(authz.roles)
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
        action: "media.receipt.removed",
        entityType: result.media.related_entity_type,
        entityId: result.media.related_entity_id,
        payload: {
          mediaId: result.media.id,
          classification: "receipt",
          removed: true
        }
      });
    } catch {
      // Soft-delete already persisted; do not fail the user-facing remove.
    }
  }

  return NextResponse.json({ ok: true, mediaId: result.media.id });
}
