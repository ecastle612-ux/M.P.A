import { NextResponse } from "next/server";
import { isOrgManagerRoles, requireMediaActor } from "../../../../../lib/media/authz";
import { softDeleteMedia } from "../../../../../lib/media/media-service";

type RouteContext = { params: Promise<{ mediaId: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
  const { mediaId } = await context.params;
  const authz = await requireMediaActor("write");
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

  return NextResponse.json({ ok: true, mediaId: result.media.id });
}
