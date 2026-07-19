import { NextResponse, type NextRequest } from "next/server";
import { isSameOrigin, rateLimitGuard } from "../../../../lib/security/api-guards";
import { getClientIp, hashIp } from "../../../../lib/security/request";
import { getRequestId, recordAuditEvent, captureException } from "../../../../lib/observability";

/**
 * Authentication audit-event sink. Because sign-in runs client-side directly against
 * Supabase Auth, the browser reports attempt outcomes here so they can be audited and
 * rate-limited at the app edge (a brute-force signal). Strictly additive and fail-open.
 */
const ALLOWED_ACTIONS = new Set(["login_succeeded", "login_failed", "password_reset_requested"]);

export async function POST(request: NextRequest) {
  const requestId = getRequestId(request.headers);

  if (!isSameOrigin(request)) {
    return NextResponse.json({ ok: false, error: "Invalid origin" }, { status: 403 });
  }

  const limited = rateLimitGuard(request, "auth:events", { limit: 10, windowMs: 60_000 });
  if (limited) {
    recordAuditEvent({
      action: "auth.rate_limited",
      resourceType: "auth_attempt",
      requestId,
      ipHash: hashIp(getClientIp(request)),
      severity: "warning",
      metadata: { route: "events" }
    });
    return limited;
  }

  try {
    const body: unknown = await request.json().catch(() => null);
    const action =
      typeof body === "object" && body !== null && "action" in body
        ? String((body as { action: unknown }).action)
        : "";

    if (!ALLOWED_ACTIONS.has(action)) {
      return NextResponse.json(
        { ok: false, error: "Unsupported action" },
        { status: 400, headers: { "Cache-Control": "no-store" } }
      );
    }

    recordAuditEvent({
      action: `auth.${action}`,
      resourceType: "auth_attempt",
      requestId,
      ipHash: hashIp(getClientIp(request)),
      severity: action === "login_failed" ? "warning" : "info"
    });

    return NextResponse.json(
      { ok: true },
      { headers: { "Cache-Control": "no-store", "x-request-id": requestId } }
    );
  } catch (error) {
    captureException(error, { module: "api.auth.events", requestId });
    // fail-open: never surface audit failures to the auth UX
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  }
}
