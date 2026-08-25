import { NextResponse } from "next/server";
import { requirePartnerServicesWrite } from "../../../../../../lib/partners/authz";
import { loadCommandCenterDeps, resolveBoundPartner } from "../../../../../../lib/partners/command-center-service";
import { bindPartnerLogo } from "../../../../../../lib/partners/service";
import { confirmMediaUpload } from "../../../../../../lib/media/media-service";
import { createServiceRoleClient } from "../../../../../../lib/supabase/service-role";
import { loadPartnerDeps } from "../../../../../../lib/partners/runtime";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const authz = await requirePartnerServicesWrite();
  if ("error" in authz) return authz.error;
  const payload = (await request.json().catch(() => null)) as { mediaId?: unknown; partnerId?: unknown } | null;
  if (payload?.partnerId != null) {
    return NextResponse.json({ error: "partner_id is not an authorization parameter." }, { status: 400 });
  }
  if (typeof payload?.mediaId !== "string" || !payload.mediaId) {
    return NextResponse.json({ error: "mediaId is required." }, { status: 400 });
  }

  const deps = await loadCommandCenterDeps();
  const partner = await resolveBoundPartner(authz.organizationId, deps.store);
  if (!partner) {
    return NextResponse.json({ error: "No Partner Program account is bound to this workspace." }, { status: 404 });
  }

  let supabase;
  try {
    supabase = createServiceRoleClient();
  } catch {
    return NextResponse.json({ error: "Logo upload is unavailable." }, { status: 503 });
  }

  const { data: media } = await supabase
    .from("media_attachments")
    .select("id, organization_id, related_entity_type, related_entity_id, attachment_category, uploaded_by_user_id")
    .eq("id", payload.mediaId)
    .maybeSingle();
  if (
    !media ||
    media.organization_id !== authz.organizationId ||
    media.related_entity_type !== "partner_branding" ||
    media.related_entity_id !== partner.id ||
    media.attachment_category !== "partner_branding" ||
    media.uploaded_by_user_id !== authz.user.id
  ) {
    return NextResponse.json({ error: "Logo file was not found for this partner." }, { status: 404 });
  }

  const confirmed = await confirmMediaUpload({
    supabase,
    organizationId: authz.organizationId,
    userId: authz.user.id,
    mediaId: payload.mediaId
  });
  if ("error" in confirmed) {
    return NextResponse.json({ error: confirmed.error }, { status: confirmed.status ?? 400 });
  }

  const bound = await bindPartnerLogo(
    { organizationId: authz.organizationId, actorUserId: authz.user.id, mediaId: payload.mediaId },
    await loadPartnerDeps()
  );
  if (!bound.ok) {
    return NextResponse.json({ error: bound.error }, { status: 400 });
  }
  return NextResponse.json({ logoMediaId: bound.partner.logoMediaId });
}
