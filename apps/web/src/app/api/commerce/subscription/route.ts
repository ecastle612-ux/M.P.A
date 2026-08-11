import { NextResponse } from "next/server";
import {
  COM_002_FLAGS,
  customerStatusCopy,
  toBillingCycleLabel,
  toPlanTierLabel
} from "@mpa/shared";
import { createAuthServerClient } from "../../../../lib/auth/server";
import { ACTIVE_ORGANIZATION_COOKIE } from "../../../../lib/organization/contracts";
import {
  enforceGraceExpirations,
  lifecycleViewForOrganization
} from "../../../../lib/saas-lifecycle/apply-lifecycle";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!COM_002_FLAGS.sliceE_subscriptionLifecycle) {
    return NextResponse.json({ error: "slice_disabled" }, { status: 404 });
  }
  await enforceGraceExpirations();
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

  const view = lifecycleViewForOrganization(organizationId);
  if (!view) {
    return NextResponse.json({
      organizationId,
      status: null,
      phase: null,
      moduleAccess: false,
      message: "No self-serve subscription is linked yet."
    });
  }

  const copy = customerStatusCopy(view.phase);
  return NextResponse.json({
    organizationId,
    stripeSubscriptionId: view.stripeSubscriptionId,
    status: view.status,
    phase: view.phase,
    moduleAccess: view.moduleAccess,
    planTier: view.planTier,
    planLabel: toPlanTierLabel(view.planTier),
    billingCycle: view.billingCycle,
    billingCycleLabel: toBillingCycleLabel(view.billingCycle),
    seatLimit: null,
    propertyLimit: null,
    managedUnitCount: view.managedUnitCount,
    authorizedUnitCapacity: view.authorizedUnitCapacity,
    authorizedAdditionalBlocks: view.authorizedAdditionalBlocks,
    pendingAdditionalBlocks: view.pendingAdditionalBlocks,
    pendingAuthorizedUnitCapacity: view.pendingAuthorizedUnitCapacity,
    declaredUnitCount: view.declaredUnitCount,
    lastCapacityAuthorizedAt: view.lastCapacityAuthorizedAt,
    trialEndsAt: view.trialEndsAt,
    cancelAtPeriodEnd: view.cancelAtPeriodEnd,
    currentPeriodEnd: view.currentPeriodEnd,
    graceStartedAt: view.graceStartedAt,
    pendingPlanTier: view.pendingPlanTier,
    scaRequired: view.scaRequired,
    title: copy.title,
    detail: copy.detail,
    requiredAction: copy.requiredAction,
    paymentHistory: view.paymentHistory.slice(-20).reverse(),
    audit: view.audit.slice(-20).reverse()
  });
}
