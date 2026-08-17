import { NextResponse } from "next/server";
import { autopayRunInputSchema } from "@mpa/shared";
import { requireFinancePermission } from "../../../../../lib/finance/authz";
import { runAutopayForLease } from "../../../../../lib/finance/autopay-service";
import {
  orgSkuAllowsResidentialFinance,
  stripePaymentExecutionDisabledResponse,
  stripePaymentExecutionEnabled
} from "../../../../../lib/finance/checkout-authz";
import { connectAccountReady, connectUnavailableResponse, loadConnectAccount } from "../../../../../lib/finance/connect-service";
import { createServiceRoleClient } from "../../../../../lib/supabase/service-role";

export async function POST(request: Request) {
  const authz = await requireFinancePermission("pm.finance:charge.write");
  if ("error" in authz) {
    return authz.error;
  }
  const payload = await request.json().catch(() => ({}));
  const parsed = autopayRunInputSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const writer = createServiceRoleClient();
  const { data: subscription } = await writer
    .from("organization_subscriptions")
    .select("sku_code, status")
    .eq("organization_id", authz.organizationId)
    .maybeSingle();
  const skuCode = subscription && subscription.status !== "canceled" ? subscription.sku_code : null;
  if (!orgSkuAllowsResidentialFinance(skuCode)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: settings } = await writer
    .from("financial_module_settings")
    .select("stripe_payment_execution_enabled")
    .eq("organization_id", authz.organizationId)
    .maybeSingle();
  if (!stripePaymentExecutionEnabled(settings)) {
    return stripePaymentExecutionDisabledResponse();
  }
  const connect = await loadConnectAccount(writer, authz.organizationId);
  if (!connectAccountReady(connect)) {
    return NextResponse.json(connectUnavailableResponse(connect), { status: 403 });
  }

  const leaseIds = parsed.data.leaseId
    ? [parsed.data.leaseId]
    : (
        (
          await writer
            .from("financial_autopay_enrollments")
            .select("lease_id")
            .eq("organization_id", authz.organizationId)
            .eq("status", "active")
        ).data ?? []
      ).map((row) => row.lease_id as string);

  const results = [];
  for (const leaseId of leaseIds) {
    try {
      results.push(
        await runAutopayForLease(writer, {
          organizationId: authz.organizationId,
          leaseId,
          ...(parsed.data.asOfDate ? { asOfDate: parsed.data.asOfDate } : {})
        })
      );
    } catch (error) {
      results.push({
        leaseId,
        error: error instanceof Error ? error.message : "autopay_failed"
      });
    }
  }
  return NextResponse.json({ results });
}
