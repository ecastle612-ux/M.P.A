import { NextResponse } from "next/server";
import {
  PARTNER_REQUEST_STATUS_LABELS,
  PARTNER_SERVICE_CATEGORY_LABELS,
  PARTNER_REQUEST_URGENCY_LABELS
} from "@mpa/shared";
import { requirePartnerServicesRead, requirePartnerServicesWrite } from "../../../../../lib/partners/authz";
import { loadPartnerRequestDeps } from "../../../../../lib/partners/request-deps";
import {
  getPartnerRequestAuthorized,
  mutatePartnerRequest
} from "../../../../../lib/partners/request-service";
import { createSignedDownloadUrl, listMediaForEntity } from "../../../../../lib/media/media-service";

export const runtime = "nodejs";

type Params = { params: Promise<{ requestId: string }> };

export async function GET(_request: Request, context: Params) {
  const authz = await requirePartnerServicesRead();
  if ("error" in authz) return authz.error;
  const { requestId } = await context.params;
  const deps = await loadPartnerRequestDeps();
  const row = await getPartnerRequestAuthorized(requestId, authz.organizationId, deps);
  if (!row) {
    return NextResponse.json({ error: "Request not found." }, { status: 404 });
  }
  const events = await deps.requests.listEvents(row.id);
  let media: Array<{ id: string; fileType: string; mimeType: string; downloadUrl: string | null }> = [];
  try {
    const { createServiceRoleClient } = await import("../../../../../lib/supabase/service-role");
    const supabase = createServiceRoleClient();
    const rows = await listMediaForEntity({
      supabase,
      organizationId: authz.organizationId,
      relatedEntityType: "partner_service_request",
      relatedEntityId: row.id
    });
    media = await Promise.all(
      rows.map(async (item) => {
        const signed = await createSignedDownloadUrl({
          organizationId: authz.organizationId,
          storageReference: item.storage_reference
        });
        return {
          id: item.id,
          fileType: item.file_type,
          mimeType: item.mime_type,
          downloadUrl: "url" in signed ? signed.url : null
        };
      })
    );
  } catch {
    media = [];
  }

  return NextResponse.json({
    request: {
      ...row,
      categoryLabel: PARTNER_SERVICE_CATEGORY_LABELS[row.category],
      urgencyLabel: PARTNER_REQUEST_URGENCY_LABELS[row.urgency],
      statusLabel: PARTNER_REQUEST_STATUS_LABELS[row.status]
    },
    events: events.map((event) => ({
      id: event.id,
      action: event.action,
      createdAt: event.createdAt,
      actorUserId: event.actorUserId
    })),
    media
  });
}

export async function PATCH(request: Request, context: Params) {
  const authz = await requirePartnerServicesWrite();
  if ("error" in authz) return authz.error;
  const { requestId } = await context.params;
  const body = (await request.json().catch(() => null)) as {
    action?: "review" | "accept" | "decline" | "convert";
    declinedReason?: string;
    propertyId?: string;
  } | null;
  if (!body?.action) {
    return NextResponse.json({ error: "Action is required." }, { status: 400 });
  }
  const deps = await loadPartnerRequestDeps();
  const result = await mutatePartnerRequest(
    {
      requestId,
      organizationId: authz.organizationId,
      actorUserId: authz.user.id,
      action: body.action,
      ...(body.declinedReason ? { declinedReason: body.declinedReason } : {}),
      ...(body.propertyId ? { propertyId: body.propertyId } : {}),
      entitlements: authz.entitlements
    },
    deps
  );
  if (!result.ok) {
    const status = result.code === "not_found" ? 404 : result.code === "forbidden" ? 403 : 409;
    return NextResponse.json({ error: result.error }, { status });
  }
  return NextResponse.json({ request: result.request });
}
