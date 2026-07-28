import { NextResponse } from "next/server";
import { apiError, apiInternalError } from "../../../../../lib/api/http";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import {
  evaluatePermission,
  resolveAuthorizationContext
} from "../../../../../lib/auth/authorization";
import { userHasMasterAdminCapability } from "../../../../../lib/master-admin/access";
import {
  archiveOrganization,
  confirmCancellation,
  coordinateFinalBilling,
  freezeOrganization,
  getOffboardingState,
  recordRetentionOffer,
  recoverWinBack,
  refreshExportInventory,
  setLegalHold
} from "../../../../../lib/commercial/offboarding";

async function requireOrgAccess(organizationId: string, manage: boolean) {
  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, response: apiError(401, "UNAUTHENTICATED", "Please sign in.") };

  const actorIsMasterAdmin = await userHasMasterAdminCapability(user);
  const authorization = await resolveAuthorizationContext(user, organizationId);
  const canRead =
    actorIsMasterAdmin ||
    evaluatePermission(authorization, "organization:read") ||
    evaluatePermission(authorization, "saas:read");
  if (!canRead) {
    return { ok: false as const, response: apiError(403, "FORBIDDEN", "Forbidden") };
  }
  if (manage) {
    const canManage =
      actorIsMasterAdmin || evaluatePermission(authorization, "authorization:manage");
    if (!canManage) {
      return { ok: false as const, response: apiError(403, "FORBIDDEN", "Forbidden") };
    }
  }
  return { ok: true as const, user, actorIsMasterAdmin };
}

/**
 * COM-001 Slice D — org offboarding status (export / freeze / archive).
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ organizationId: string }> }
) {
  try {
    const { organizationId } = await context.params;
    const access = await requireOrgAccess(organizationId, false);
    if (!access.ok) return access.response;

    const offboarding = await getOffboardingState(organizationId);
    return NextResponse.json(
      { ok: true, offboarding },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Offboarding failed";
    if (message.includes("not found")) return apiError(404, "NOT_FOUND", message);
    return apiInternalError();
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ organizationId: string }> }
) {
  try {
    const { organizationId } = await context.params;
    const access = await requireOrgAccess(organizationId, true);
    if (!access.ok) return access.response;

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const action = typeof body["action"] === "string" ? body["action"] : "";

    let offboarding;
    switch (action) {
      case "confirm_cancel":
        offboarding = await confirmCancellation({
          organizationId,
          actorUserId: access.user.id,
          reason: typeof body["reason"] === "string" ? body["reason"] : null,
          skipRetentionOffer: body["skipRetentionOffer"] === true
        });
        break;
      case "retention_offer": {
        const status = String(body["status"] ?? "");
        if (!["offered", "accepted", "declined", "skipped"].includes(status)) {
          return apiError(400, "INVALID_INPUT", "Invalid retention status");
        }
        offboarding = await recordRetentionOffer({
          organizationId,
          status: status as "offered" | "accepted" | "declined" | "skipped",
          notes: typeof body["notes"] === "string" ? body["notes"] : null,
          actorUserId: access.user.id
        });
        break;
      }
      case "coordinate_billing":
        offboarding = await coordinateFinalBilling({
          organizationId,
          actorUserId: access.user.id
        });
        break;
      case "refresh_export":
        offboarding = await refreshExportInventory({
          organizationId,
          actorUserId: access.user.id
        });
        break;
      case "freeze":
        offboarding = await freezeOrganization({
          organizationId,
          actorUserId: access.user.id
        });
        break;
      case "archive":
        if (!access.actorIsMasterAdmin) {
          return apiError(403, "FORBIDDEN", "Archive requires Master Admin");
        }
        offboarding = await archiveOrganization({
          organizationId,
          actorUserId: access.user.id
        });
        break;
      case "legal_hold":
        if (!access.actorIsMasterAdmin) {
          return apiError(403, "FORBIDDEN", "Legal hold requires Master Admin");
        }
        offboarding = await setLegalHold({
          organizationId,
          legalHold: body["legalHold"] === true,
          actorUserId: access.user.id
        });
        break;
      case "recover":
        offboarding = await recoverWinBack({
          organizationId,
          actorUserId: access.user.id,
          ...(typeof body["reason"] === "string" ? { reason: body["reason"] } : {})
        });
        break;
      default:
        return apiError(400, "INVALID_INPUT", "Unknown action");
    }

    return NextResponse.json(
      { ok: true, offboarding },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Offboarding action failed";
    if (
      message.includes("must") ||
      message.includes("before") ||
      message.includes("cannot") ||
      message.includes("Legal hold")
    ) {
      return apiError(400, "INVALID_STATE", message);
    }
    return apiInternalError();
  }
}
