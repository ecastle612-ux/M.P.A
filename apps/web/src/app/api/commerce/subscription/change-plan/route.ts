import { NextResponse } from "next/server";
import { COM_002_FLAGS } from "@mpa/shared";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import { ACTIVE_ORGANIZATION_COOKIE } from "../../../../../lib/organization/contracts";

export const runtime = "nodejs";

/**
 * Customer plan-change endpoint — Business and legacy Professional Price swaps are unsupported.
 * Unit-volume commercial changes are not implemented on this route.
 */
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
    planTier?: string;
    billingCycle?: string;
  };

  if (body.planTier === "business") {
    return NextResponse.json(
      {
        error: "unsupported_plan",
        message: "PM Business is not a customer product and cannot be selected."
      },
      { status: 400 }
    );
  }

  return NextResponse.json(
    {
      error: "unsupported_plan_change",
      message:
        "Customer plan or billing-cycle changes that swap Stripe Prices are not available on this endpoint. Unit-volume subscriptions are managed through capacity and billing lifecycle flows."
    },
    { status: 409 }
  );
}
