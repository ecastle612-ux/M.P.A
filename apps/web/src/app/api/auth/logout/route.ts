import { NextResponse, type NextRequest } from "next/server";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { isSameOrigin, rateLimitGuard } from "../../../../lib/security/api-guards";
import { getClientIp, hashIp } from "../../../../lib/security/request";
import { getRequestId, recordAuditEvent, captureException } from "../../../../lib/observability";

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request.headers);

  if (!isSameOrigin(request)) {
    return NextResponse.json({ ok: false, error: "Invalid origin" }, { status: 403 });
  }

  const limited = rateLimitGuard(request, "auth:logout", { limit: 20, windowMs: 60_000 });
  if (limited) {
    recordAuditEvent({
      action: "auth.rate_limited",
      resourceType: "auth_session",
      requestId,
      ipHash: hashIp(getClientIp(request)),
      severity: "warning",
      metadata: { route: "logout" }
    });
    return limited;
  }

  try {
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    await supabase.auth.signOut();

    recordAuditEvent({
      action: "auth.logout",
      resourceType: "auth_session",
      requestId,
      ipHash: hashIp(getClientIp(request)),
      ...(user?.id ? { actorId: user.id } : {})
    });

    return NextResponse.json(
      { ok: true },
      { headers: { "Cache-Control": "no-store", "x-request-id": requestId } }
    );
  } catch (error) {
    captureException(error, { module: "api.auth.logout", requestId });
    return NextResponse.json(
      { ok: false, error: "Logout failed" },
      { status: 500, headers: { "Cache-Control": "no-store", "x-request-id": requestId } }
    );
  }
}
