import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import { consumeFacilityRequestRateLimit } from "../../../../../lib/facility/request-form-rate-limit";
import {
  resolvePublicIntake,
  sendRequesterConfirmationEmail,
  submitPublicRequest
} from "../../../../../lib/facility/public-request-service";
import { createServiceRoleClient } from "../../../../../lib/supabase/service-role";
import { clientEnv } from "../../../../../lib/env/client-env";

type Params = { params: Promise<{ token: string }> };

function publicDb() {
  try {
    return createServiceRoleClient();
  } catch {
    return null;
  }
}

export async function GET(request: Request, context: Params) {
  const { token } = await context.params;
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!consumeFacilityRequestRateLimit(`get:${token}:${ip}`)) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }
  const supabase = publicDb();
  if (!supabase) {
    return NextResponse.json({ error: "Request intake is unavailable." }, { status: 503 });
  }
  try {
    const resolved = await resolvePublicIntake(supabase, token);
    if (!resolved.ok) {
      return NextResponse.json({ error: resolved.error }, { status: resolved.status });
    }
    return NextResponse.json({
      formName: resolved.portal.formName,
      organizationName: resolved.portal.organizationName,
      instructions: resolved.portal.instructions,
      accessPolicy: resolved.portal.accessPolicy,
      fields: resolved.portal.fields,
      lockedContext: resolved.portal.lockedContext,
      buildings: resolved.portal.buildings,
      requiresAuth: resolved.portal.requiresAuth,
      versionId: resolved.versionId
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load request form" },
      { status: 400 }
    );
  }
}

export async function POST(request: Request, context: Params) {
  const { token } = await context.params;
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!consumeFacilityRequestRateLimit(`post:${token}:${ip}`)) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }
  const supabase = publicDb();
  if (!supabase) {
    return NextResponse.json({ error: "Request intake is unavailable." }, { status: 503 });
  }
  const payload = (await request.json().catch(() => null)) as {
    via?: string;
    values?: Record<string, unknown>;
    attachments?: Array<{ kind: "image" | "video"; mimeType: string; fileSize: number; mediaId?: string }>;
    idempotencyKey?: string;
    organization_id?: unknown;
    propertyId?: unknown;
    facilityAssetId?: unknown;
    versionId?: string;
  } | null;
  if (!payload?.idempotencyKey || !payload.values) {
    return NextResponse.json({ error: "Submission is incomplete." }, { status: 400 });
  }

  let actorUserId: string | null = null;
  try {
    const auth = await createAuthServerClient();
    const {
      data: { user }
    } = await auth.auth.getUser();
    actorUserId = user?.id ?? null;
  } catch {
    actorUserId = null;
  }

  try {
    const result = await submitPublicRequest(supabase, {
      token,
      via: payload.via ?? new URL(request.url).searchParams.get("via"),
      values: payload.values,
      attachments: payload.attachments ?? [],
      idempotencyKey: payload.idempotencyKey,
      actorUserId,
      clientOrganizationId: payload.organization_id,
      clientPropertyId: payload.propertyId,
      clientAssetId: payload.facilityAssetId,
      ...(payload.versionId ? { expectedVersionId: payload.versionId } : {}),
      origin: clientEnv.NEXT_PUBLIC_APP_URL
    });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    if (result.requesterEmail) {
      const statusUrl = `${clientEnv.NEXT_PUBLIC_APP_URL}${result.statusPath}`;
      await sendRequesterConfirmationEmail({
        to: result.requesterEmail,
        requestNumber: result.requestNumber,
        title: result.title,
        statusUrl
      });
    }
    return NextResponse.json({
      requestNumber: result.requestNumber,
      title: result.title,
      location: result.location,
      submittedAt: result.submittedAt,
      statusPath: result.statusPath,
      statusToken: result.statusToken,
      source: result.source
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to submit request" },
      { status: 400 }
    );
  }
}
