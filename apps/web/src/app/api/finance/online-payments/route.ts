import { NextResponse } from "next/server";
import { assertNoStripeAccountId, connectAccountReady } from "@mpa/shared";
import { requireFinancePermission } from "../../../../lib/finance/authz";
import { orgSkuAllowsResidentialFinance } from "../../../../lib/finance/checkout-authz";
import {
  createConnectLoginLink,
  loadConnectAccount,
  publicConnectView,
  startConnectOnboarding,
  syncConnectAccount
} from "../../../../lib/finance/connect-service";
import {
  customerOnlinePaymentsStatus,
  disableOnlinePayments,
  enableOnlinePayments
} from "../../../../lib/finance/online-payments-service";
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

function safeJson(payload: Record<string, unknown>, status = 200) {
  if (!assertNoStripeAccountId(payload)) {
    return NextResponse.json({ error: "internal_payload_rejected" }, { status: 500 });
  }
  return NextResponse.json(payload, { status });
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
    const status = await customerOnlinePaymentsStatus(resolved.writer, authz.organizationId);
    return safeJson(status);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Online payments status failed" },
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
  const action = payload?.action as string | undefined;
  try {
    const resolved = await residentialWriter(authz.organizationId);
    if ("error" in resolved) {
      return resolved.error;
    }
    const account = await loadConnectAccount(resolved.writer, authz.organizationId);
    if (account && account.organization_id !== authz.organizationId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (action === "sync" || action === "continue_setup" || action === "connect") {
      if (action === "sync") {
        await syncConnectAccount(resolved.writer, authz.organizationId, authz.user.id);
        const status = await customerOnlinePaymentsStatus(resolved.writer, authz.organizationId);
        return safeJson({ ...status, ready: status.connect_ready });
      }
      const result = await startConnectOnboarding(
        resolved.writer,
        authz.organizationId,
        authz.user.id,
        resolved.skuCode
      );
      const status = await customerOnlinePaymentsStatus(resolved.writer, authz.organizationId);
      return safeJson({
        ...status,
        onboardingUrl: result.onboardingUrl,
        ready: connectAccountReady(result.account)
      });
    }

    if (action === "manage") {
      if (!account?.stripe_account_id) {
        return NextResponse.json({ error: "not_connected" }, { status: 409 });
      }
      const url = await createConnectLoginLink(account.stripe_account_id);
      const status = await customerOnlinePaymentsStatus(resolved.writer, authz.organizationId);
      return safeJson({ ...status, manageUrl: url });
    }

    if (action === "enable") {
      try {
        await enableOnlinePayments(resolved.writer, {
          organizationId: authz.organizationId,
          actorId: authz.user.id
        });
      } catch (error) {
        if (error instanceof Error && error.message === "connect_not_ready") {
          return safeJson(
            {
              error: "connect_not_ready",
              message: "Stripe setup must be ready before online payments can be enabled.",
              connect: publicConnectView(account)
            },
            409
          );
        }
        throw error;
      }
      const status = await customerOnlinePaymentsStatus(resolved.writer, authz.organizationId);
      return safeJson(status);
    }

    if (action === "disable") {
      await disableOnlinePayments(resolved.writer, {
        organizationId: authz.organizationId,
        actorId: authz.user.id
      });
      const status = await customerOnlinePaymentsStatus(resolved.writer, authz.organizationId);
      return safeJson(status);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Online payments update failed";
    return NextResponse.json({ error: message }, { status: message === "Forbidden" ? 403 : 400 });
  }
}
