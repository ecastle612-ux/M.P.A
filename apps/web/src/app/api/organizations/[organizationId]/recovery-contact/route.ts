import { NextResponse } from "next/server";
import { apiError, apiInternalError } from "../../../../../lib/api/http";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import {
  evaluatePermission,
  resolveAuthorizationContext
} from "../../../../../lib/auth/authorization";
import { userHasMasterAdminCapability } from "../../../../../lib/master-admin/access";
import {
  acknowledgeRecoveryContact,
  getRecoveryContact,
  upsertRecoveryContact,
  verifyRecoveryContact
} from "../../../../../lib/auth/recovery/recovery-contact";
import { readRequestMeta } from "../../../../../lib/auth/recovery/request-meta";

export async function GET(
  _request: Request,
  context: { params: Promise<{ organizationId: string }> }
) {
  try {
    const { organizationId } = await context.params;
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Please sign in to continue.");

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (
      !evaluatePermission(authorization, "membership:read") &&
      !(await userHasMasterAdminCapability(user))
    ) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const contact = await getRecoveryContact(organizationId);
    return NextResponse.json({ ok: true, contact }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return apiInternalError();
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ organizationId: string }> }
) {
  try {
    const { organizationId } = await context.params;
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Please sign in to continue.");

    const actorIsMasterAdmin = await userHasMasterAdminCapability(user);
    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (!evaluatePermission(authorization, "membership:update") && !actorIsMasterAdmin) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const body = (await request.json()) as Record<string, unknown>;
    const action = typeof body["action"] === "string" ? body["action"] : "upsert";
    const meta = readRequestMeta(request);

    if (action === "verify") {
      const token = typeof body["token"] === "string" ? body["token"] : "";
      const contact = await verifyRecoveryContact({
        organizationId,
        token,
        actorUserId: user.id
      });
      return NextResponse.json({ ok: true, contact }, { headers: { "Cache-Control": "no-store" } });
    }

    if (action === "acknowledge") {
      const contact = await acknowledgeRecoveryContact({
        organizationId,
        actorUserId: user.id,
        actorIsMasterAdmin
      });
      return NextResponse.json({ ok: true, contact }, { headers: { "Cache-Control": "no-store" } });
    }

    const result = await upsertRecoveryContact({
      organizationId,
      actorUserId: user.id,
      actorIsMasterAdmin,
      fullName: typeof body["fullName"] === "string" ? body["fullName"] : "",
      email: typeof body["email"] === "string" ? body["email"] : "",
      phone: typeof body["phone"] === "string" ? body["phone"] : null,
      acknowledge: body["acknowledge"] === true,
      ipAddress: meta.ipAddress,
      device: meta.device
    });

    return NextResponse.json(
      {
        ok: true,
        contact: result.contact,
        verificationSent: Boolean(result.verificationToken)
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Recovery contact update failed";
    if (
      message.includes("required") ||
      message.includes("Invalid") ||
      message.includes("expired") ||
      message.includes("Forbidden") ||
      message.includes("not found")
    ) {
      return apiError(400, "INVALID_INPUT", message);
    }
    return apiInternalError();
  }
}
