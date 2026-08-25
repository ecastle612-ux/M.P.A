import { NextResponse } from "next/server";
import { loadPartnerRequestDeps } from "../../../../../../lib/partners/request-deps";
import { publicPartnerUnavailable, resolveLivePartnerPortal } from "../../../../../../lib/partners/request-service";
import { createSignedDownloadUrl } from "../../../../../../lib/media/media-service";
import { createServiceRoleClient } from "../../../../../../lib/supabase/service-role";
import { consumeRateLimit, requestActorKey } from "../../../../../../lib/security/durable-rate-limit";

export const runtime = "nodejs";

type Params = { params: Promise<{ slug: string }> };

export async function GET(request: Request, context: Params) {
  const { slug } = await context.params;
  if (
    !(await consumeRateLimit({
      class: "PUBLIC",
      key: `partner-portal-logo:${slug}:${requestActorKey(request)}`
    }))
  ) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  const deps = await loadPartnerRequestDeps();
  const live = await resolveLivePartnerPortal(slug, deps);
  if (!live?.partner.organizationId || !live.partner.logoMediaId) {
    return NextResponse.json(publicPartnerUnavailable(), { status: 404 });
  }

  let supabase;
  try {
    supabase = createServiceRoleClient();
  } catch {
    return NextResponse.json(publicPartnerUnavailable(), { status: 503 });
  }

  const { data: media } = await supabase
    .from("media_attachments")
    .select("id, organization_id, related_entity_type, related_entity_id, attachment_category, status, storage_reference")
    .eq("id", live.partner.logoMediaId)
    .maybeSingle();
  if (
    !media ||
    media.organization_id !== live.partner.organizationId ||
    media.related_entity_type !== "partner_branding" ||
    media.related_entity_id !== live.partner.id ||
    media.attachment_category !== "partner_branding" ||
    media.status !== "ready" ||
    typeof media.storage_reference !== "string"
  ) {
    return NextResponse.json(publicPartnerUnavailable(), { status: 404 });
  }

  const signed = await createSignedDownloadUrl({
    organizationId: live.partner.organizationId,
    storageReference: media.storage_reference
  });
  if ("error" in signed) {
    return NextResponse.json(publicPartnerUnavailable(), { status: 404 });
  }
  return NextResponse.redirect(signed.url, 302);
}
