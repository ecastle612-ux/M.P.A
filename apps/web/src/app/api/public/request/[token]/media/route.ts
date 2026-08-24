import { NextResponse } from "next/server";
import { consumeFacilityRequestRateLimit } from "../../../../../../lib/facility/request-form-rate-limit";
import { resolvePublicIntake } from "../../../../../../lib/facility/public-request-service";
import { createUploadIntent } from "../../../../../../lib/media/media-service";
import { createServiceRoleClient } from "../../../../../../lib/supabase/service-role";

type Params = { params: Promise<{ token: string }> };

export async function POST(request: Request, context: Params) {
  const { token } = await context.params;
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!consumeFacilityRequestRateLimit(`media:${token}:${ip}`)) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }
  let supabase;
  try {
    supabase = createServiceRoleClient();
  } catch {
    return NextResponse.json({ error: "Request intake is unavailable." }, { status: 503 });
  }
  const resolved = await resolvePublicIntake(supabase, token);
  if (!resolved.ok) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }
  const payload = (await request.json().catch(() => null)) as {
    mimeType?: unknown;
    fileSize?: unknown;
    originalFileName?: unknown;
  } | null;
  const result = await createUploadIntent({
    supabase,
    organizationId: resolved.organizationId,
    userId: null,
    mimeType: payload?.mimeType,
    fileSize: payload?.fileSize,
    relatedEntityType: "facility_request_intake",
    relatedEntityId: resolved.intakeId,
    originalFileName: payload?.originalFileName
  });
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status ?? 400 });
  }
  await supabase.from("facility_request_media_grants").insert({
    organization_id: resolved.organizationId,
    intake_id: resolved.intakeId,
    media_id: result.media.id,
    storage_reference: result.path,
    expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString()
  });
  return NextResponse.json({
    mediaId: result.media.id,
    uploadUrl: result.uploadUrl,
    fileType: result.media.file_type
  });
}
