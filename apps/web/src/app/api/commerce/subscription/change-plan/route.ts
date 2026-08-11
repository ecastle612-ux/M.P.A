import { NextResponse } from "next/server";
import { COM_002_FLAGS } from "@mpa/shared";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import { ACTIVE_ORGANIZATION_COOKIE } from "../../../../../lib/organization/contracts";
import { changePlanTier } from "../../../../../lib/saas-lifecycle/apply-lifecycle";

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
  const body = (await request.json().catch(() => ({}))) as {
    planTier?: "professional" | "business";
    billingCycle?: "monthly" | "annual";
  };
  // ADR-019: Business is not an offered customer plan. Allow professional only
  // (e.g. cycle changes / legacy remediation toward the approved mapping).
  if (body.planTier !== "professional") {
    return NextResponse.json({ error: "business_tier_not_offered" }, { status: 400 });
  }
  const result = await changePlanTier({
    organizationId,
    planTier: body.planTier,
    ...(body.billingCycle ? { billingCycle: body.billingCycle } : {})
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }
  return NextResponse.json({
    ok: true,
    planTier: result.sub.planTier,
    pendingPlanTier: result.sub.pendingPlanTier,
    seatLimit: result.sub.seatLimit,
    propertyLimit: result.sub.propertyLimit
  });
}
