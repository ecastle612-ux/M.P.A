import { NextResponse } from "next/server";
import { apiError, apiInternalError } from "../../../../../lib/api/http";
import { requireMasterAdminApiAccess } from "../../../../../lib/master-admin/access";
import {
  getActiveMasterAdminSession,
  recordMasterAdminEvent
} from "../../../../../lib/master-admin/session";

export async function POST(request: Request) {
  try {
    const access = await requireMasterAdminApiAccess();
    if (!access.ok) return access.response;

    const session = await getActiveMasterAdminSession(access.user.id);
    if (!session) {
      return apiError(400, "NO_SESSION", "No active Master Admin session.");
    }

    const body = (await request.json().catch(() => null)) as {
      pathname?: string;
      eventType?: "page_visit" | "sensitive_action" | "note";
      detail?: Record<string, unknown>;
    } | null;

    if (!body?.pathname) {
      return apiError(400, "INVALID_INPUT", "pathname is required.");
    }

    await recordMasterAdminEvent({
      sessionId: session.id,
      organizationId: session.organizationId,
      actorUserId: access.user.id,
      eventType: body.eventType ?? "page_visit",
      pathname: body.pathname,
      detail: body.detail ?? {}
    });

    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return apiInternalError();
  }
}
