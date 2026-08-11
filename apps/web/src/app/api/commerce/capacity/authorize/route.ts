import { NextResponse } from "next/server";
import { COM_002_FLAGS } from "@mpa/shared";
import { requireCommerceBillingAuth } from "../../../../../lib/saas-lifecycle/commerce-billing-auth";
import { authorizeAdditionalUnitCapacity } from "../../../../../lib/saas-lifecycle/unit-capacity-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!COM_002_FLAGS.sliceE_subscriptionLifecycle) {
    return NextResponse.json({ error: "slice_disabled" }, { status: 404 });
  }

  const auth = await requireCommerceBillingAuth(request);
  if ("error" in auth) {
    return auth.error;
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const intentId = typeof body["intentId"] === "string" ? body["intentId"] : null;
  const idempotencyKey =
    typeof body["idempotencyKey"] === "string"
      ? body["idempotencyKey"]
      : request.headers.get("idempotency-key");

  const result = await authorizeAdditionalUnitCapacity({
    organizationId: auth.organizationId,
    intentId,
    idempotencyKey,
    clientBody: body,
    supabase: auth.supabase
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

  if (result.sub.organizationId !== auth.organizationId) {
    return NextResponse.json({ error: "subscription_org_mismatch" }, { status: 403 });
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
