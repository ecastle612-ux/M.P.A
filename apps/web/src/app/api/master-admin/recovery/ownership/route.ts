import { NextResponse } from "next/server";
import { apiError, apiInternalError } from "../../../../../lib/api/http";
import { requireMasterAdminApiAccess } from "../../../../../lib/master-admin/access";
import { restoreOrganizationOwnership } from "../../../../../lib/auth/recovery/ownership-restore";
import { readRequestMeta } from "../../../../../lib/auth/recovery/request-meta";

export async function POST(request: Request) {
  try {
    const access = await requireMasterAdminApiAccess();
    if (!access.ok) return access.response;

    const body = (await request.json()) as Record<string, unknown>;
    const organizationId =
      typeof body["organizationId"] === "string" ? body["organizationId"].trim() : "";
    const newOwnerIdentifier =
      typeof body["newOwnerIdentifier"] === "string" ? body["newOwnerIdentifier"].trim() : "";
    const reason = typeof body["reason"] === "string" ? body["reason"] : "";
    const identityVerified = body["identityVerified"] === true;
    const secondaryContactConfirmed = body["secondaryContactConfirmed"] === true;
    const disablePreviousOwner = body["disablePreviousOwner"] === true;
    const issueTemporaryCredentials = body["issueTemporaryCredentials"] !== false;
    const disputeHold = body["disputeHold"] === true;

    if (!organizationId || !newOwnerIdentifier) {
      return apiError(400, "INVALID_INPUT", "organizationId and newOwnerIdentifier are required");
    }

    const meta = readRequestMeta(request);
    const result = await restoreOrganizationOwnership({
      organizationId,
      actorUserId: access.user.id,
      newOwnerIdentifier,
      reason,
      identityVerified,
      secondaryContactConfirmed,
      disablePreviousOwner,
      issueTemporaryCredentials,
      disputeHold,
      ipAddress: meta.ipAddress,
      device: meta.device
    });

    return NextResponse.json(
      {
        ok: true,
        ...result
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ownership restore failed";
    if (
      message.includes("required") ||
      message.includes("not found") ||
      message.includes("must") ||
      message.includes("suspended") ||
      message.includes("already")
    ) {
      return apiError(400, "INVALID_INPUT", message);
    }
    return apiInternalError();
  }
}
