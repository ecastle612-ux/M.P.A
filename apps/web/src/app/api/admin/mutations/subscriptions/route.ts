import { NextResponse } from "next/server";
import { mutateSubscriptionLifecycle } from "../../../../../lib/admin/ma7-mutation-service";

export const runtime = "nodejs";

/** MA-7 — governed subscription cancel / reactivate via authoritative lifecycle service. */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    organizationId?: string;
    action?: string;
    reason?: string;
    confirm?: boolean;
    confirmationToken?: string;
    idempotencyKey?: string;
    capabilities?: unknown;
  } | null;

  void body?.capabilities;

  if (!body?.organizationId || (body.action !== "cancel" && body.action !== "reactivate")) {
    return NextResponse.json({ error: "invalid_payload", code: "invalid_payload" }, { status: 400 });
  }

  const result = await mutateSubscriptionLifecycle({
    organizationId: body.organizationId,
    action: body.action,
    reason: body.reason,
    confirm: body.confirm,
    confirmationToken: body.confirmationToken,
    idempotencyKey: body.idempotencyKey ?? null
  });

  const status =
    result.code === "unauthorized"
      ? 401
      : result.code === "forbidden"
        ? 403
        : result.code === "not_found"
          ? 404
          : result.ok
            ? 200
            : 400;

  return NextResponse.json(
    {
      ok: result.ok,
      code: result.code,
      message: result.message,
      correlationId: result.correlationId,
      previousState: result.previousState ?? null,
      resultingState: result.resultingState ?? null,
      organizationId: result.organizationId ?? null
    },
    { status, headers: { "Cache-Control": "no-store" } }
  );
}
