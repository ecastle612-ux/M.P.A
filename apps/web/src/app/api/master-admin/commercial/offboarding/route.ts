import { NextResponse } from "next/server";
import { apiError, apiInternalError } from "../../../../../lib/api/http";
import { requireMasterAdminApiAccess } from "../../../../../lib/master-admin/access";
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
import {
  completeCsMotion,
  listCsMotions,
  refreshCsMotionDueHooks,
  scheduleCsMotions,
  CS_MOTION_KEYS,
  type CsMotionKey
} from "../../../../../lib/commercial/cs-motions";
import {
  listRenewalAlerts,
  refreshRenewalAlertDueHooks,
  syncRenewalAlerts
} from "../../../../../lib/commercial/renewal-alerts";

/**
 * COM-001 Slice D — Master Admin / CS ops-minimum offboarding · CS · renewal lookup.
 */
export async function GET(request: Request) {
  try {
    const access = await requireMasterAdminApiAccess();
    if (!access.ok) return access.response;

    const url = new URL(request.url);
    const organizationId = url.searchParams.get("organizationId")?.trim() ?? "";
    if (!organizationId) {
      return apiError(400, "INVALID_INPUT", "organizationId is required");
    }

    const [offboarding, motions, alerts] = await Promise.all([
      getOffboardingState(organizationId),
      refreshCsMotionDueHooks({
        organizationId,
        actorUserId: access.user.id
      }),
      refreshRenewalAlertDueHooks({
        organizationId,
        actorUserId: access.user.id
      })
    ]);

    return NextResponse.json(
      { ok: true, offboarding, motions, alerts },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Lookup failed";
    if (message.includes("not found")) return apiError(404, "NOT_FOUND", message);
    return apiInternalError();
  }
}

export async function POST(request: Request) {
  try {
    const access = await requireMasterAdminApiAccess();
    if (!access.ok) return access.response;

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const organizationId =
      typeof body["organizationId"] === "string" ? body["organizationId"].trim() : "";
    if (!organizationId) {
      return apiError(400, "INVALID_INPUT", "organizationId is required");
    }
    const action = typeof body["action"] === "string" ? body["action"] : "";
    const actorUserId = access.user.id;

    switch (action) {
      case "confirm_cancel": {
        const offboarding = await confirmCancellation({
          organizationId,
          actorUserId,
          reason: typeof body["reason"] === "string" ? body["reason"] : null,
          skipRetentionOffer: body["skipRetentionOffer"] === true
        });
        return NextResponse.json({ ok: true, offboarding });
      }
      case "retention_offer": {
        const status = String(body["status"] ?? "");
        if (!["offered", "accepted", "declined", "skipped"].includes(status)) {
          return apiError(400, "INVALID_INPUT", "Invalid retention status");
        }
        const offboarding = await recordRetentionOffer({
          organizationId,
          status: status as "offered" | "accepted" | "declined" | "skipped",
          notes: typeof body["notes"] === "string" ? body["notes"] : null,
          actorUserId
        });
        return NextResponse.json({ ok: true, offboarding });
      }
      case "coordinate_billing": {
        const offboarding = await coordinateFinalBilling({ organizationId, actorUserId });
        return NextResponse.json({ ok: true, offboarding });
      }
      case "refresh_export": {
        const offboarding = await refreshExportInventory({ organizationId, actorUserId });
        return NextResponse.json({ ok: true, offboarding });
      }
      case "freeze": {
        const offboarding = await freezeOrganization({ organizationId, actorUserId });
        return NextResponse.json({ ok: true, offboarding });
      }
      case "archive": {
        const offboarding = await archiveOrganization({ organizationId, actorUserId });
        return NextResponse.json({ ok: true, offboarding });
      }
      case "legal_hold": {
        const offboarding = await setLegalHold({
          organizationId,
          legalHold: body["legalHold"] === true,
          actorUserId
        });
        return NextResponse.json({ ok: true, offboarding });
      }
      case "recover": {
        const offboarding = await recoverWinBack({
          organizationId,
          actorUserId,
          ...(typeof body["reason"] === "string" ? { reason: body["reason"] } : {})
        });
        return NextResponse.json({ ok: true, offboarding });
      }
      case "schedule_cs": {
        const motions = await scheduleCsMotions({ organizationId, actorUserId });
        return NextResponse.json({ ok: true, motions });
      }
      case "refresh_cs": {
        const motions = await refreshCsMotionDueHooks({ organizationId, actorUserId });
        return NextResponse.json({ ok: true, motions });
      }
      case "complete_cs":
      case "skip_cs": {
        const motionKey = String(body["motionKey"] ?? "") as CsMotionKey;
        if (!(CS_MOTION_KEYS as readonly string[]).includes(motionKey)) {
          return apiError(400, "INVALID_INPUT", "Unknown motion key");
        }
        const motion = await completeCsMotion({
          organizationId,
          motionKey,
          notes: typeof body["notes"] === "string" ? body["notes"] : null,
          actorUserId,
          skip: action === "skip_cs"
        });
        const motions = await listCsMotions(organizationId);
        return NextResponse.json({ ok: true, motion, motions });
      }
      case "sync_renewals": {
        const alerts = await syncRenewalAlerts({ organizationId, actorUserId });
        return NextResponse.json({ ok: true, alerts });
      }
      case "refresh_renewals": {
        const alerts = await refreshRenewalAlertDueHooks({ organizationId, actorUserId });
        return NextResponse.json({ ok: true, alerts });
      }
      case "list_renewals": {
        const alerts = await listRenewalAlerts(organizationId);
        return NextResponse.json({ ok: true, alerts });
      }
      default:
        return apiError(400, "INVALID_INPUT", "Unknown action");
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Action failed";
    if (
      message.includes("must") ||
      message.includes("before") ||
      message.includes("cannot") ||
      message.includes("Legal hold") ||
      message.includes("Unknown")
    ) {
      return apiError(400, "INVALID_STATE", message);
    }
    return apiInternalError();
  }
}
