import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  autopayConfirmInputSchema,
  autopayRevokeInputSchema,
  autopayStartInputSchema,
  occupancyIsCurrent
} from "@mpa/shared";
import { createAuthServerClient } from "../../../../../lib/auth/server";
import {
  confirmAutopayEnrollment,
  describeAutopay,
  loadAutopayEnrollment,
  revokeAutopayEnrollment,
  startAutopaySetup
} from "../../../../../lib/finance/autopay-service";
import {
  orgSkuAllowsResidentialFinance,
  stripePaymentExecutionDisabledResponse,
  stripePaymentExecutionEnabled
} from "../../../../../lib/finance/checkout-authz";
import { connectAccountReady, connectUnavailableResponse, loadConnectAccount } from "../../../../../lib/finance/connect-service";
import { createServiceRoleClient } from "../../../../../lib/supabase/service-role";

async function occupyingResident(userId: string, leaseId: string) {
  const authClient = await createAuthServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = authClient as SupabaseClient<any>;
  const { data: resident } = await supabase
    .from("lease_residents")
    .select("id, lease_id, organization_id, occupancy_status, occupy_from, occupy_to")
    .eq("user_id", userId)
    .eq("lease_id", leaseId)
    .maybeSingle();
  if (!resident) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  const occupying = occupancyIsCurrent({
    occupancyStatus: (resident.occupancy_status as "scheduled" | "occupying" | "moved_out") ?? "occupying",
    occupyFrom: (resident.occupy_from as string | null) ?? "1970-01-01",
    occupyTo: (resident.occupy_to as string | null) ?? null
  });
  if (!occupying) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { supabase, resident };
}

export async function GET(request: Request) {
  const authClient = await createAuthServerClient();
  const {
    data: { user }
  } = await authClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const leaseId = new URL(request.url).searchParams.get("leaseId");
  if (!leaseId) {
    return NextResponse.json({ error: "leaseId required" }, { status: 400 });
  }
  const occupying = await occupyingResident(user.id, leaseId);
  if ("error" in occupying) {
    return occupying.error;
  }
  const writer = createServiceRoleClient();
  const enrollment = await loadAutopayEnrollment(writer, occupying.resident.organization_id, leaseId);
  return NextResponse.json(describeAutopay(enrollment));
}

export async function POST(request: Request) {
  const authClient = await createAuthServerClient();
  const {
    data: { user }
  } = await authClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }
  const payload = await request.json().catch(() => null);
  const action = payload?.action as string | undefined;
  const parsed =
    action === "start"
      ? autopayStartInputSchema.safeParse(payload)
      : action === "confirm"
        ? autopayConfirmInputSchema.safeParse(payload)
        : action === "revoke"
          ? autopayRevokeInputSchema.safeParse(payload)
          : null;
  if (!parsed || !parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const occupying = await occupyingResident(user.id, parsed.data.leaseId);
  if ("error" in occupying) {
    return occupying.error;
  }

  const writer = createServiceRoleClient();
  const [{ data: subscription }, { data: settings }] = await Promise.all([
    writer
      .from("organization_subscriptions")
      .select("sku_code, status")
      .eq("organization_id", occupying.resident.organization_id)
      .maybeSingle(),
    writer
      .from("financial_module_settings")
      .select("stripe_payment_execution_enabled")
      .eq("organization_id", occupying.resident.organization_id)
      .maybeSingle()
  ]);
  const skuCode = subscription && subscription.status !== "canceled" ? subscription.sku_code : null;
  if (!orgSkuAllowsResidentialFinance(skuCode)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (parsed.data.action !== "revoke") {
    if (!stripePaymentExecutionEnabled(settings)) {
      return stripePaymentExecutionDisabledResponse();
    }
    const connect = await loadConnectAccount(writer, occupying.resident.organization_id);
    if (!connectAccountReady(connect)) {
      return NextResponse.json(connectUnavailableResponse(connect), { status: 403 });
    }
  }

  try {
    if (parsed.data.action === "start") {
      const setup = await startAutopaySetup(writer, {
        organizationId: occupying.resident.organization_id,
        leaseId: parsed.data.leaseId,
        residentId: occupying.resident.id,
        userId: user.id,
        consentText: parsed.data.consentText
      });
      return NextResponse.json(setup);
    }
    if (parsed.data.action === "confirm") {
      const enrollment = await confirmAutopayEnrollment(writer, {
        organizationId: occupying.resident.organization_id,
        leaseId: parsed.data.leaseId,
        residentId: occupying.resident.id,
        userId: user.id,
        consentText: parsed.data.consentText,
        ...(parsed.data.setupIntentId ? { setupIntentId: parsed.data.setupIntentId } : {}),
        ...(parsed.data.checkoutSessionId ? { checkoutSessionId: parsed.data.checkoutSessionId } : {})
      });
      return NextResponse.json({ enrollment, ...describeAutopay(enrollment) });
    }
    const enrollment = await revokeAutopayEnrollment(writer, {
      organizationId: occupying.resident.organization_id,
      leaseId: parsed.data.leaseId,
      userId: user.id
    });
    return NextResponse.json({ enrollment, ...describeAutopay(enrollment), balancesPreserved: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "AutoPay failed" },
      { status: 400 }
    );
  }
}
