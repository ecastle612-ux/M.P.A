import { NextResponse } from "next/server";
import { COM_002_FLAGS } from "@mpa/shared";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import { ACTIVE_ORGANIZATION_COOKIE } from "../../../../../lib/organization/contracts";
import { authorizeAdditionalUnitCapacity } from "../../../../../lib/saas-lifecycle/unit-capacity-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!COM_002_FLAGS.sliceE_subscriptionLifecycle) {
    return NextResponse.json({ error: "slice_disabled" }, { status: 404 });
  }

  const supabase = await createAuthServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  }

  const cookieHeader = request.headers.get("cookie") ?? "";
  const match = cookieHeader.match(new RegExp(`${ACTIVE_ORGANIZATION_COOKIE}=([^;]+)`));
  const organizationId = match?.[1] ? decodeURIComponent(match[1]) : null;
  if (!organizationId) {
    return NextResponse.json({ error: "missing_organization" }, { status: 400 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const intentId = typeof body["intentId"] === "string" ? body["intentId"] : null;
  const idempotencyKey =
    typeof body["idempotencyKey"] === "string"
      ? body["idempotencyKey"]
      : request.headers.get("idempotency-key");

  const result = await authorizeAdditionalUnitCapacity({
    organizationId,
    intentId,
    idempotencyKey,
    clientBody: body,
    supabase
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        error: result.error,
        ...(result.detail ? { detail: result.detail } : {})
      },
      { status: result.status }
    );
  }

  return NextResponse.json({
    ok: true,
    reused: result.reused,
    capacityStatus: result.snapshot.capacityStatus,
    actualUnits: result.snapshot.actualUnits,
    authorizedCapacity: result.snapshot.authorizedCapacity,
    additionalBlocks: result.snapshot.additionalBlocks,
    pendingAdditionalBlocks: result.snapshot.pendingAdditionalBlocks,
    currentBillingAmountMonthlyUsd: result.snapshot.currentBillingAmountMonthlyUsd,
    nextBillingAmountMonthlyUsd: result.snapshot.nextBillingAmountMonthlyUsd,
    nextBillingPeriodEnd: result.snapshot.nextBillingPeriodEnd,
    effectiveAt: "next_billing_period",
    snapshot: result.snapshot
  });
}
