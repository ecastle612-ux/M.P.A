import { NextResponse } from "next/server";
import { createFacilityAssetQrInputSchema } from "@mpa/shared";
import { requireFacilityAssetPermission } from "../../../../../../lib/facility/authz";
import { clientEnv } from "../../../../../../lib/env/client-env";
import {
  createFacilityAssetQr,
  getFacilityAssetQrState,
  revokeFacilityAssetQr
} from "../../../../../../lib/facility/asset-qr-service";

type Params = { params: Promise<{ assetId: string }> };

export async function GET(_request: Request, context: Params) {
  const authz = await requireFacilityAssetPermission("pm.maintenance:read", { managerOnly: true });
  if ("error" in authz) return authz.error;
  const { assetId } = await context.params;
  try {
    const state = await getFacilityAssetQrState(authz.supabase, authz.organizationId, assetId);
    if (!state) return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    return NextResponse.json({
      intake: state.intake,
      hasActiveQr: Boolean(state.intake && state.intake.status === "active")
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load asset QR" },
      { status: 400 }
    );
  }
}

export async function POST(request: Request, context: Params) {
  const authz = await requireFacilityAssetPermission("pm.maintenance:write", { managerOnly: true });
  if ("error" in authz) return authz.error;
  const { assetId } = await context.params;
  const payload = (await request.json().catch(() => null)) as { action?: string; formId?: string } | null;

  try {
    if (payload?.action === "revoke") {
      const result = await revokeFacilityAssetQr(authz.supabase, authz.organizationId, authz.user.id, assetId);
      return NextResponse.json(result);
    }
    const parsed = createFacilityAssetQrInputSchema.safeParse({ formId: payload?.formId });
    if (!parsed.success) {
      return NextResponse.json({ error: "Select a published request form." }, { status: 400 });
    }
    const origin = clientEnv.NEXT_PUBLIC_APP_URL ?? "https://www.my-property-assistant.com";
    const created = await createFacilityAssetQr(
      authz.supabase,
      authz.organizationId,
      authz.user.id,
      assetId,
      parsed.data,
      origin
    );
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to manage asset QR" },
      { status: 400 }
    );
  }
}
