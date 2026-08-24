import { NextResponse } from "next/server";
import { isReceiptAllowedMimeType } from "@mpa/shared";
import { loadPartnerRequestDeps } from "../../../../../../lib/partners/request-deps";
import { publicPartnerUnavailable, resolveLivePartnerPortal } from "../../../../../../lib/partners/request-service";
import { createUploadIntent } from "../../../../../../lib/media/media-service";
import { createServiceRoleClient } from "../../../../../../lib/supabase/service-role";
import { consumeRateLimit, requestActorKey } from "../../../../../../lib/security/durable-rate-limit";

export const runtime = "nodejs";

type Params = { params: Promise<{ slug: string }> };

export async function POST(request: Request, context: Params) {
  const { slug } = await context.params;
  if (
    !(await consumeRateLimit({
      class: "PUBLIC",
      key: `partner-portal-media:${slug}:${requestActorKey(request)}`
    }))
  ) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  let supabase;
  try {
    supabase = createServiceRoleClient();
  } catch {
    return NextResponse.json(publicPartnerUnavailable(), { status: 503 });
  }

  const deps = await loadPartnerRequestDeps();
  const live = await resolveLivePartnerPortal(slug, deps);
  if (!live || !live.partner.organizationId) {
    return NextResponse.json(publicPartnerUnavailable(), { status: 404 });
  }

  const payload = (await request.json().catch(() => null)) as {
    mimeType?: unknown;
    fileSize?: unknown;
    originalFileName?: unknown;
    organizationId?: unknown;
    partnerId?: unknown;
    userId?: unknown;
    storagePath?: unknown;
  } | null;
  if (
    payload &&
    (payload.organizationId != null ||
      payload.partnerId != null ||
      payload.userId != null ||
      payload.storagePath != null)
  ) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (typeof payload?.mimeType === "string" && isReceiptAllowedMimeType(payload.mimeType) && payload.mimeType === "application/pdf") {
    return NextResponse.json({ error: "That file type is not allowed on this form." }, { status: 400 });
  }

  const result = await createUploadIntent({
    supabase,
    organizationId: live.partner.organizationId,
    userId: null,
    mimeType: payload?.mimeType,
    fileSize: payload?.fileSize,
    relatedEntityType: "partner_service_request",
    relatedEntityId: null,
    originalFileName: payload?.originalFileName,
    attachmentCategory: "evidence"
  });
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status ?? 400 });
  }

  await supabase.from("platform_partner_request_media_grants").insert({
    partner_id: live.partner.id,
    organization_id: live.partner.organizationId,
    media_id: result.media.id,
    request_id: null,
    expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString()
  });

  return NextResponse.json({
    mediaId: result.media.id,
    uploadUrl: result.uploadUrl,
    fileType: result.media.file_type
  });
}
