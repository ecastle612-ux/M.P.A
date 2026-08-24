import { NextResponse } from "next/server";
import { isFacilityRequestContextKind, publicRequestPath } from "@mpa/shared";
import { requireFacilityRequestFormsPermission } from "../../../../../../lib/facility/authz";
import { clientEnv } from "../../../../../../lib/env/client-env";
import {
  createRequestIntake,
  listRequestIntakes,
  lockedContextFromIntake,
  revokeRequestIntake
} from "../../../../../../lib/facility/request-form-service";
import { assertSafePublicRequestUrl, buildPublicRequestQrSvg, publicRequestAbsoluteUrl } from "../../../../../../lib/facility/public-request-qr";

type Params = { params: Promise<{ formId: string }> };

export async function GET(_request: Request, context: Params) {
  const authz = await requireFacilityRequestFormsPermission();
  if ("error" in authz) return authz.error;
  const { formId } = await context.params;
  try {
    const intakes = await listRequestIntakes(authz.supabase, authz.organizationId, formId);
    return NextResponse.json({ intakes });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load links" },
      { status: 400 }
    );
  }
}

export async function POST(request: Request, context: Params) {
  const authz = await requireFacilityRequestFormsPermission();
  if ("error" in authz) return authz.error;
  const { formId } = await context.params;
  const payload = (await request.json().catch(() => null)) as {
    action?: string;
    intakeId?: string;
    contextKind?: string;
    context?: Record<string, unknown>;
  } | null;

  try {
    if (payload?.action === "revoke" && payload.intakeId) {
      const intake = await revokeRequestIntake(authz.supabase, authz.organizationId, payload.intakeId);
      return NextResponse.json({ intake });
    }
    if (!payload?.contextKind || !isFacilityRequestContextKind(payload.contextKind)) {
      return NextResponse.json({ error: "Choose a location context." }, { status: 400 });
    }
    const created = await createRequestIntake(authz.supabase, authz.organizationId, authz.user.id, {
      formId,
      contextKind: payload.contextKind,
      context: lockedContextFromIntake(payload.context ?? {})
    });
    const origin = clientEnv.NEXT_PUBLIC_APP_URL ?? "https://www.my-property-assistant.com";
    const linkUrl = publicRequestAbsoluteUrl(origin, created.token, "link");
    const qrUrl = publicRequestAbsoluteUrl(origin, created.token, "qr");
    const safeLink = assertSafePublicRequestUrl(linkUrl);
    const safeQr = assertSafePublicRequestUrl(qrUrl);
    if (!safeLink.ok || !safeQr.ok) {
      return NextResponse.json({ error: "Failed to create a safe public link." }, { status: 400 });
    }
    return NextResponse.json(
      {
        intake: created.intake,
        token: created.token,
        linkUrl,
        qrUrl,
        path: publicRequestPath(created.token),
        qrSvg: await buildPublicRequestQrSvg(qrUrl)
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create link" },
      { status: 400 }
    );
  }
}
