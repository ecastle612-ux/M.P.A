import { NextResponse } from "next/server";
import { requirePartnerServicesRead } from "../../../../../../lib/partners/authz";
import { loadCommandCenterDeps, resolveBoundPartner } from "../../../../../../lib/partners/command-center-service";
import { createSignedDownloadUrl } from "../../../../../../lib/media/media-service";
import { createServiceRoleClient } from "../../../../../../lib/supabase/service-role";

export const runtime = "nodejs";

export async function GET() {
  const authz = await requirePartnerServicesRead();
  if ("error" in authz) return authz.error;
  const deps = await loadCommandCenterDeps();
  const partner = await resolveBoundPartner(authz.organizationId, deps.store);
  if (!partner?.logoMediaId) {
    return NextResponse.json({ logoUrl: null });
  }
  let supabase;
  try {
    supabase = createServiceRoleClient();
  } catch {
    return NextResponse.json({ logoUrl: null });
  }
  const { data: media } = await supabase
    .from("media_attachments")
    .select("organization_id, related_entity_type, related_entity_id, attachment_category, status, storage_reference")
    .eq("id", partner.logoMediaId)
    .maybeSingle();
  if (
    !media ||
    media.organization_id !== authz.organizationId ||
    media.related_entity_type !== "partner_branding" ||
    media.related_entity_id !== partner.id ||
    media.attachment_category !== "partner_branding" ||
    media.status !== "ready" ||
    typeof media.storage_reference !== "string"
  ) {
    return NextResponse.json({ logoUrl: null });
  }
  const signed = await createSignedDownloadUrl({
    organizationId: authz.organizationId,
    storageReference: media.storage_reference
  });
  return NextResponse.json({ logoUrl: "error" in signed ? null : signed.url });
}
