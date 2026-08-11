import { NextResponse } from "next/server";
import { COM_002_FLAGS } from "@mpa/shared";
import { requireCommerceBillingAuth } from "../../../../../lib/saas-lifecycle/commerce-billing-auth";
import { cancelAtPeriodEnd } from "../../../../../lib/saas-lifecycle/apply-lifecycle";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!COM_002_FLAGS.sliceE_subscriptionLifecycle) {
    return NextResponse.json({ error: "slice_disabled" }, { status: 404 });
  }

  const auth = await requireCommerceBillingAuth(request);
  if ("error" in auth) {
    return auth.error;
  }

  const sub = await cancelAtPeriodEnd({
    organizationId: auth.organizationId,
    source: "customer"
  });
  if (!sub) {
    return NextResponse.json({ error: "subscription_not_found" }, { status: 404 });
  }
  if (sub.organizationId !== auth.organizationId) {
    return NextResponse.json({ error: "subscription_org_mismatch" }, { status: 403 });
  }

  return NextResponse.json({
    ok: true,
    status: sub.status,
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    currentPeriodEnd: sub.currentPeriodEnd
  });
}
