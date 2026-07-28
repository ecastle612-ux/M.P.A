import { NextResponse } from "next/server";
import { apiError, apiInternalError } from "../../../../../lib/api/http";
import { requireMasterAdminApiAccess } from "../../../../../lib/master-admin/access";
import {
  AUTH_ISSUE_CLASSES,
  escalateSupportCase,
  listSupportEscalations,
  openSupportEscalation,
  resolveSupportEscalation,
  type AuthIssueClass
} from "../../../../../lib/auth/recovery/support-escalation";
import { readRequestMeta } from "../../../../../lib/auth/recovery/request-meta";

export async function GET(request: Request) {
  try {
    const access = await requireMasterAdminApiAccess();
    if (!access.ok) return access.response;

    const organizationId = new URL(request.url).searchParams.get("organizationId")?.trim();
    if (!organizationId) {
      return apiError(400, "INVALID_INPUT", "organizationId is required");
    }

    const escalations = await listSupportEscalations(organizationId);
    return NextResponse.json({ ok: true, escalations }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return apiInternalError();
  }
}

export async function POST(request: Request) {
  try {
    const access = await requireMasterAdminApiAccess();
    if (!access.ok) return access.response;

    const body = (await request.json()) as Record<string, unknown>;
    const action = typeof body["action"] === "string" ? body["action"] : "open";
    const meta = readRequestMeta(request);

    if (action === "open") {
      const issueClass = body["issueClass"];
      if (typeof issueClass !== "string" || !(AUTH_ISSUE_CLASSES as readonly string[]).includes(issueClass)) {
        return apiError(400, "INVALID_INPUT", "Valid issueClass is required");
      }
      const record = await openSupportEscalation({
        organizationId:
          typeof body["organizationId"] === "string" ? body["organizationId"].trim() : null,
        issueClass: issueClass as AuthIssueClass,
        reason: typeof body["reason"] === "string" ? body["reason"] : "",
        openedBy: access.user.id,
        subjectUserId:
          typeof body["subjectUserId"] === "string" ? body["subjectUserId"].trim() : null,
        actorIsMasterAdmin: true,
        ipAddress: meta.ipAddress,
        device: meta.device
      });
      return NextResponse.json({ ok: true, escalation: record }, { headers: { "Cache-Control": "no-store" } });
    }

    if (action === "escalate") {
      const escalationId =
        typeof body["escalationId"] === "string" ? body["escalationId"].trim() : "";
      if (!escalationId) return apiError(400, "INVALID_INPUT", "escalationId is required");
      const record = await escalateSupportCase({
        escalationId,
        actorUserId: access.user.id,
        actorIsMasterAdmin: true,
        reason: typeof body["reason"] === "string" ? body["reason"] : null,
        forceLevel: body["forceLevel"] === "L3" ? "L3" : undefined
      });
      return NextResponse.json({ ok: true, escalation: record }, { headers: { "Cache-Control": "no-store" } });
    }

    if (action === "resolve") {
      const escalationId =
        typeof body["escalationId"] === "string" ? body["escalationId"].trim() : "";
      if (!escalationId) return apiError(400, "INVALID_INPUT", "escalationId is required");
      const record = await resolveSupportEscalation({
        escalationId,
        actorUserId: access.user.id,
        actorIsMasterAdmin: true,
        resolutionNotes: typeof body["resolutionNotes"] === "string" ? body["resolutionNotes"] : ""
      });
      return NextResponse.json({ ok: true, escalation: record }, { headers: { "Cache-Control": "no-store" } });
    }

    return apiError(400, "INVALID_INPUT", "Unknown action");
  } catch (err) {
    const message = err instanceof Error ? err.message : "Escalation failed";
    if (message.includes("required") || message.includes("not found") || message.includes("already")) {
      return apiError(400, "INVALID_INPUT", message);
    }
    return apiInternalError();
  }
}
