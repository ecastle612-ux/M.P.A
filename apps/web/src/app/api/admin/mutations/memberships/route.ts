import { NextResponse } from "next/server";
import { mutateMembershipStatus } from "../../../../../lib/admin/ma7-mutation-service";
import type { Ma7MembershipStatus } from "../../../../../lib/admin/ma7-mutations";

export const runtime = "nodejs";

/** MA-7 — governed membership deactivate / reactivate (status only; no role edits). */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    membershipId?: string;
    organizationId?: string;
    status?: string;
    reason?: string;
    confirm?: boolean;
    confirmationToken?: string;
    idempotencyKey?: string;
    capabilities?: unknown;
  } | null;

  // Ignore client-claimed capabilities entirely.
  void body?.capabilities;

  if (!body?.membershipId || !body.organizationId) {
    return NextResponse.json({ error: "invalid_payload", code: "invalid_payload" }, { status: 400 });
  }
  if (body.status !== "active" && body.status !== "inactive") {
    return NextResponse.json({ error: "invalid_payload", code: "invalid_payload" }, { status: 400 });
  }

  const result = await mutateMembershipStatus({
    membershipId: body.membershipId,
    organizationId: body.organizationId,
    status: body.status as Ma7MembershipStatus,
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
      organizationId: result.organizationId ?? null,
      entityId: result.entityId ?? null
    },
    { status, headers: { "Cache-Control": "no-store" } }
  );
}
