import { NextResponse } from "next/server";
import { MEDIA_IMAGE_MIME_TYPES } from "@mpa/shared";
import { requirePartnerServicesWrite } from "../../../../../lib/partners/authz";
import { loadCommandCenterDeps, resolveBoundPartner } from "../../../../../lib/partners/command-center-service";
import { createUploadIntent } from "../../../../../lib/media/media-service";
import { createServiceRoleClient } from "../../../../../lib/supabase/service-role";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const authz = await requirePartnerServicesWrite();
  if ("error" in authz) return authz.error;
  const deps = await loadCommandCenterDeps();
  const partner = await resolveBoundPartner(authz.organizationId, deps.store);
  if (!partner) {
    return NextResponse.json({ error: "No Partner Program account is bound to this workspace." }, { status: 404 });
  }

  const payload = (await request.json().catch(() => null)) as {
    mimeType?: unknown;
    fileSize?: unknown;
    originalFileName?: unknown;
    organizationId?: unknown;
    partnerId?: unknown;
    storagePath?: unknown;
  } | null;
  if (
    payload &&
    (payload.organizationId != null || payload.partnerId != null || payload.storagePath != null)
  ) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (typeof payload?.mimeType === "string" && !(MEDIA_IMAGE_MIME_TYPES as readonly string[]).includes(payload.mimeType)) {
    return NextResponse.json({ error: "Partner logos must be an image." }, { status: 400 });
  }

  let supabase;
  try {
    supabase = createServiceRoleClient();
  } catch {
    return NextResponse.json({ error: "Logo upload is unavailable." }, { status: 503 });
  }

  const result = await createUploadIntent({
    supabase,
    organizationId: authz.organizationId,
    userId: authz.user.id,
    mimeType: payload?.mimeType,
    fileSize: payload?.fileSize,
    relatedEntityType: "partner_branding",
    relatedEntityId: partner.id,
    originalFileName: payload?.originalFileName,
    attachmentCategory: "partner_branding"
  });
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status ?? 400 });
  }
  return NextResponse.json({
    mediaId: result.media.id,
    uploadUrl: result.uploadUrl,
    expiresIn: result.expiresIn
  });
}
