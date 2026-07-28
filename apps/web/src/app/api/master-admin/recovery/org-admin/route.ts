import { NextResponse } from "next/server";
import { apiError, apiInternalError } from "../../../../../lib/api/http";
import { requireMasterAdminApiAccess } from "../../../../../lib/master-admin/access";
import { recoverOrganizationAdmin } from "../../../../../lib/auth/recovery/org-admin-recovery";
import { readRequestMeta } from "../../../../../lib/auth/recovery/request-meta";

export async function POST(request: Request) {
  try {
    const access = await requireMasterAdminApiAccess();
    if (!access.ok) return access.response;

    const body = (await request.json()) as Record<string, unknown>;
    const organizationId =
      typeof body["organizationId"] === "string" ? body["organizationId"].trim() : "";
    const targetIdentifier =
      typeof body["targetIdentifier"] === "string" ? body["targetIdentifier"].trim() : "";
    const reason = typeof body["reason"] === "string" ? body["reason"] : "";
    const identityVerified = body["identityVerified"] === true;
    const secondaryContactConfirmed = body["secondaryContactConfirmed"] === true;
    const verificationNotes =
      typeof body["verificationNotes"] === "string" ? body["verificationNotes"] : null;

    if (!organizationId || !targetIdentifier) {
      return apiError(400, "INVALID_INPUT", "organizationId and targetIdentifier are required");
    }

    const meta = readRequestMeta(request);
    const result = await recoverOrganizationAdmin({
      organizationId,
      actorUserId: access.user.id,
      targetIdentifier,
      reason,
      identityVerified,
      secondaryContactConfirmed,
      verificationNotes,
      ipAddress: meta.ipAddress,
      device: meta.device
    });

    return NextResponse.json(
      {
        ok: true,
        organizationId: result.organizationId,
        targetUserId: result.targetUserId,
        username: result.username,
        deliveryStatus: result.deliveryStatus,
        auditId: result.auditId
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Recovery failed";
    if (
      message.includes("required") ||
      message.includes("not found") ||
      message.includes("not an") ||
      message.includes("confirmation")
    ) {
      return apiError(400, "INVALID_INPUT", message);
    }
    return apiInternalError();
  }
}
