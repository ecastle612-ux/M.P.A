import { NextResponse } from "next/server";
import { apiError, apiInternalError } from "../../../../../lib/api/http";
import { requireMasterAdminApiAccess } from "../../../../../lib/master-admin/access";
import {
  listEngagements,
  listPartnerStubs,
  upsertEngagement,
  upsertPartnerStub
} from "../../../../../lib/commercial/marketplace";
import {
  ENGAGEMENT_PATHS,
  ENGAGEMENT_STATUSES,
  PROVIDER_TYPES,
  type EngagementPath,
  type EngagementStatus,
  type ProviderType
} from "../../../../../lib/commercial/marketplace-types";

/**
 * COM-001 Slice E — marketplace data-model prep (staff). No partner UI workflows.
 */
export async function GET(request: Request) {
  try {
    const access = await requireMasterAdminApiAccess();
    if (!access.ok) return access.response;

    const url = new URL(request.url);
    const organizationId = url.searchParams.get("organizationId")?.trim() || undefined;

    const [engagements, partners] = await Promise.all([
      listEngagements({
        ...(organizationId ? { organizationId } : {}),
        limit: 100
      }),
      listPartnerStubs()
    ]);

    return NextResponse.json(
      { ok: true, engagements, partners },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return apiInternalError();
  }
}

export async function POST(request: Request) {
  try {
    const access = await requireMasterAdminApiAccess();
    if (!access.ok) return access.response;

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const action = typeof body["action"] === "string" ? body["action"] : "upsert_engagement";

    if (action === "upsert_partner_stub") {
      const code = typeof body["code"] === "string" ? body["code"] : "";
      const displayName = typeof body["displayName"] === "string" ? body["displayName"] : "";
      if (!code || !displayName) {
        return apiError(400, "INVALID_INPUT", "code and displayName are required");
      }
      const partner = await upsertPartnerStub({
        code,
        displayName,
        notes: typeof body["notes"] === "string" ? body["notes"] : null,
        actorUserId: access.user.id
      });
      return NextResponse.json({ ok: true, partner });
    }

    if (action === "upsert_engagement") {
      const organizationId =
        typeof body["organizationId"] === "string" ? body["organizationId"].trim() : "";
      const path = String(body["path"] ?? "") as EngagementPath;
      if (!organizationId || !(ENGAGEMENT_PATHS as readonly string[]).includes(path)) {
        return apiError(400, "INVALID_INPUT", "organizationId and valid path are required");
      }
      const providerType = (typeof body["providerType"] === "string"
        ? body["providerType"]
        : "mpa_internal") as ProviderType;
      if (!(PROVIDER_TYPES as readonly string[]).includes(providerType)) {
        return apiError(400, "INVALID_INPUT", "Invalid providerType");
      }
      const status =
        typeof body["status"] === "string"
          ? (body["status"] as EngagementStatus)
          : undefined;
      if (status && !(ENGAGEMENT_STATUSES as readonly string[]).includes(status)) {
        return apiError(400, "INVALID_INPUT", "Invalid status");
      }

      const engagement = await upsertEngagement({
        organizationId,
        path,
        providerType,
        partnerId: typeof body["partnerId"] === "string" ? body["partnerId"] : null,
        ...(status ? { status } : {}),
        notes: typeof body["notes"] === "string" ? body["notes"] : null,
        actorUserId: access.user.id
      });
      return NextResponse.json({ ok: true, engagement });
    }

    return apiError(400, "INVALID_INPUT", "Unknown action");
  } catch (err) {
    const message = err instanceof Error ? err.message : "Engagement failed";
    if (
      message.includes("Invalid") ||
      message.includes("require") ||
      message.includes("cannot")
    ) {
      return apiError(400, "INVALID_INPUT", message);
    }
    return apiInternalError();
  }
}
