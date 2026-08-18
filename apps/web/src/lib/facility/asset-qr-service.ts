import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createFacilityAssetQrInputSchema,
  isRetiredFacilityAssetStatus,
  lockedContextFromFacilityAsset,
  publicRequestPath
} from "@mpa/shared";
import { writeMaintenanceAudit } from "../maintenance/events-audit";
import { getFacilityAsset } from "./asset-service";
import { createRequestIntake, revokeRequestIntake } from "./request-form-service";
import { assertSafePublicRequestUrl, buildPublicRequestQrSvg, publicRequestAbsoluteUrl } from "./public-request-qr";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Db = SupabaseClient<any>;

export function buildAssetLabelSvg(input: {
  organizationName: string;
  assetName: string;
  assetCode: string;
  qrSvg: string;
}): string {
  const escape = (value: string) =>
    value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const innerQr = input.qrSvg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="360" height="480" viewBox="0 0 360 480" role="img" aria-label="Scan to report a problem for ${escape(input.assetName)}">
  <rect width="360" height="480" fill="#ffffff" stroke="#111111" stroke-width="2"/>
  <text x="180" y="36" text-anchor="middle" font-family="ui-sans-serif, system-ui, sans-serif" font-size="16" font-weight="700" fill="#111111">M.P.A.</text>
  <text x="180" y="58" text-anchor="middle" font-family="ui-sans-serif, system-ui, sans-serif" font-size="12" fill="#111111">${escape(input.organizationName)}</text>
  <text x="180" y="84" text-anchor="middle" font-family="ui-sans-serif, system-ui, sans-serif" font-size="14" font-weight="600" fill="#111111">Scan to report a problem</text>
  <g transform="translate(52 104)">${innerQr}</g>
  <text x="180" y="390" text-anchor="middle" font-family="ui-sans-serif, system-ui, sans-serif" font-size="16" font-weight="700" fill="#111111">${escape(input.assetName)}</text>
  <text x="180" y="414" text-anchor="middle" font-family="ui-sans-serif, system-ui, sans-serif" font-size="14" fill="#111111">${escape(input.assetCode)}</text>
  <text x="180" y="448" text-anchor="middle" font-family="ui-sans-serif, system-ui, sans-serif" font-size="12" fill="#111111">Scan → Describe → Submit</text>
</svg>`;
}

async function bindIntakeToAsset(
  supabase: Db,
  organizationId: string,
  assetId: string,
  intakeId: string | null
) {
  const { error } = await supabase
    .from("facility_assets")
    .update({ active_request_intake_id: intakeId, updated_at: new Date().toISOString() })
    .eq("id", assetId)
    .eq("organization_id", organizationId)
    .is("deleted_at", null);
  if (error) throw new Error(error.message);
}

export async function createFacilityAssetQr(
  supabase: Db,
  organizationId: string,
  actorUserId: string,
  assetId: string,
  raw: { formId: string },
  origin: string
) {
  const input = createFacilityAssetQrInputSchema.parse(raw);
  const asset = await getFacilityAsset(supabase, organizationId, assetId);
  if (!asset) throw new Error("Asset not found");
  if (isRetiredFacilityAssetStatus(asset.status)) {
    throw new Error("Retired assets cannot receive a new public request QR.");
  }

  if (asset.active_request_intake_id) {
    await revokeRequestIntake(supabase, organizationId, asset.active_request_intake_id);
  }

  const context = lockedContextFromFacilityAsset(asset);
  const created = await createRequestIntake(supabase, organizationId, actorUserId, {
    formId: input.formId,
    contextKind: "asset",
    context
  });
  await bindIntakeToAsset(supabase, organizationId, assetId, created.intake.id as string);

  const linkUrl = publicRequestAbsoluteUrl(origin, created.token, "link");
  const qrUrl = publicRequestAbsoluteUrl(origin, created.token, "qr");
  const safe = assertSafePublicRequestUrl(qrUrl);
  if (!safe.ok) throw new Error(safe.error);
  const qrSvg = await buildPublicRequestQrSvg(qrUrl);
  const { data: org } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", organizationId)
    .maybeSingle();
  const labelSvg = buildAssetLabelSvg({
    organizationName: (org?.name as string | undefined) ?? "My Property Assistant",
    assetName: asset.name,
    assetCode: asset.asset_code,
    qrSvg
  });

  await writeMaintenanceAudit({
    supabase,
    organizationId,
    actorId: actorUserId,
    action: "facility_asset.qr_created",
    entityType: "facility_assets",
    entityId: assetId,
    payload: { intakeId: created.intake.id, formId: input.formId, contextKind: "asset" }
  });

  return {
    intake: {
      id: created.intake.id,
      status: created.intake.status,
      contextKind: created.intake.context_kind,
      publicTokenPrefix: created.intake.public_token_prefix,
      formId: created.intake.form_id
    },
    token: created.token,
    linkUrl,
    qrUrl,
    qrSvg,
    labelSvg,
    path: publicRequestPath(created.token, "qr")
  };
}

export async function revokeFacilityAssetQr(
  supabase: Db,
  organizationId: string,
  actorUserId: string,
  assetId: string
) {
  const asset = await getFacilityAsset(supabase, organizationId, assetId);
  if (!asset) throw new Error("Asset not found");
  if (!asset.active_request_intake_id) {
    return { revoked: false };
  }
  await revokeRequestIntake(supabase, organizationId, asset.active_request_intake_id);
  await bindIntakeToAsset(supabase, organizationId, assetId, null);
  await writeMaintenanceAudit({
    supabase,
    organizationId,
    actorId: actorUserId,
    action: "facility_asset.qr_revoked",
    entityType: "facility_assets",
    entityId: assetId,
    payload: { intakeId: asset.active_request_intake_id }
  });
  return { revoked: true };
}

export async function getFacilityAssetQrState(supabase: Db, organizationId: string, assetId: string) {
  const asset = await getFacilityAsset(supabase, organizationId, assetId);
  if (!asset) return null;
  if (!asset.active_request_intake_id) {
    return { asset, intake: null };
  }
  const { data, error } = await supabase
    .from("facility_request_intakes")
    .select("id, form_id, public_token_prefix, context_kind, context_json, status, created_at, revoked_at")
    .eq("organization_id", organizationId)
    .eq("id", asset.active_request_intake_id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return { asset, intake: data };
}
