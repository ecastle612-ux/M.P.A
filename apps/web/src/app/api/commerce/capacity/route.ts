import { NextResponse } from "next/server";
import { COM_002_FLAGS } from "@mpa/shared";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { ACTIVE_ORGANIZATION_COOKIE } from "../../../../lib/organization/contracts";
import { getOrganizationCapacityView } from "../../../../lib/saas-lifecycle/unit-capacity-service";

export const runtime = "nodejs";

export async function GET(request: Request) {
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

  const view = await getOrganizationCapacityView({ organizationId, supabase });
  if (!view.linked || !view.snapshot) {
    return NextResponse.json({
      organizationId,
      linked: false,
      message: "No self-serve subscription is linked yet."
    });
  }

  return NextResponse.json({
    organizationId,
    linked: true,
    capacityStatus: view.snapshot.capacityStatus,
    declaredUnits: view.snapshot.declaredUnits,
    actualUnits: view.snapshot.actualUnits,
    authorizedCapacity: view.snapshot.authorizedCapacity,
    additionalBlocks: view.snapshot.additionalBlocks,
    requiredBlocks: view.snapshot.requiredBlocks,
    requiredCapacity: view.snapshot.requiredCapacity,
    pendingAdditionalBlocks: view.snapshot.pendingAdditionalBlocks,
    pendingAuthorizedCapacity: view.snapshot.pendingAuthorizedCapacity,
    currentBillingAmountMonthlyUsd: view.snapshot.currentBillingAmountMonthlyUsd,
    nextBillingAmountMonthlyUsd: view.snapshot.nextBillingAmountMonthlyUsd,
    additionalCapacityCostMonthlyUsd: view.snapshot.additionalCapacityCostMonthlyUsd,
    billingInterval: view.snapshot.billingInterval,
    nextBillingPeriodEnd: view.snapshot.nextBillingPeriodEnd,
    trialActive: view.snapshot.trialActive,
    trialCapacityNote: view.snapshot.trialCapacityNote,
    gate: view.gate,
    snapshot: view.snapshot,
    seatLimit: null,
    propertyLimit: null
  });
}
