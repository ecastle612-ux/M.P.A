import { NextResponse } from "next/server";
import { connectAccountReady } from "@mpa/shared";
import { requireFinancePermission } from "../../../../lib/finance/authz";
import { orgSkuAllowsResidentialFinance } from "../../../../lib/finance/checkout-authz";
import {
  loadConnectAccount,
  startConnectOnboarding,
  syncConnectAccount
} from "../../../../lib/finance/connect-service";
import { createServiceRoleClient } from "../../../../lib/supabase/service-role";

async function residentialWriter(organizationId: string) {
  const writer = createServiceRoleClient();
  const { data: subscription } = await writer
    .from("organization_subscriptions")
    .select("sku_code, status")
    .eq("organization_id", organizationId)
    .maybeSingle();
  const skuCode = subscription && subscription.status !== "canceled" ? subscription.sku_code : null;
  if (!orgSkuAllowsResidentialFinance(skuCode)) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { writer, skuCode };
}

export async function GET() {
  const authz = await requireFinancePermission("pm.finance:read");
  if ("error" in authz) {
    return authz.error;
  }
  try {
    const resolved = await residentialWriter(authz.organizationId);
    if ("error" in resolved) {
      return resolved.error;
    }
    const account = await loadConnectAccount(resolved.writer, authz.organizationId);
    return NextResponse.json({
      account,
      ready: connectAccountReady(account),
      message: connectAccountReady(account)
        ? "Stripe Connect is ready for tenant Pay Once and AutoPay."
        : "Finish Stripe Connect onboarding before tenants can pay online. Manual FIN-OPS workflows still work."
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Connect status failed" },
      { status: 400 }
    );
  }
}

export async function POST(request: Request) {
  const authz = await requireFinancePermission("pm.finance:settings.manage");
  if ("error" in authz) {
    return authz.error;
  }
  const payload = await request.json().catch(() => ({}));
  try {
    const resolved = await residentialWriter(authz.organizationId);
    if ("error" in resolved) {
      return resolved.error;
    }
    if (payload?.action === "sync") {
      const account = await syncConnectAccount(resolved.writer, authz.organizationId, authz.user.id);
      return NextResponse.json({ account, ready: connectAccountReady(account) });
    }
    const result = await startConnectOnboarding(
      resolved.writer,
      authz.organizationId,
      authz.user.id,
      resolved.skuCode
    );
    return NextResponse.json({
      account: result.account,
      onboardingUrl: result.onboardingUrl,
      ready: connectAccountReady(result.account)
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Connect onboarding failed";
    return NextResponse.json({ error: message }, { status: message === "Forbidden" ? 403 : 400 });
  }
}
