import { NextResponse } from "next/server";
import { apiError, apiInternalError, parseJsonBody } from "../../../../lib/api/http";
import {
  createPublicSaasCheckoutSession,
  PublicCheckoutError
} from "../../../../lib/saas/public-checkout";
import type { SaasBillingInterval } from "../../../../lib/integrations/saas-billing/contracts";
import {
  acquireClientKey,
  checkAcquireRateLimit
} from "../../../../lib/acquire/rate-limit";
import { ACQ_FUNNEL_EVENTS, emitAcqFunnelEvent } from "../../../../lib/acquire/funnel";
import { log } from "../../../../lib/observability/logger";

export async function POST(request: Request) {
  const rate = checkAcquireRateLimit({
    key: acquireClientKey(request, "acq.checkout"),
    limit: 20,
    windowMs: 60_000
  });
  if (!rate.allowed) {
    return apiError(429, "RATE_LIMITED", "Too many Checkout attempts. Please wait and try again.");
  }

  try {
    const parsed = await parseJsonBody(request);
    if (!parsed.ok) return parsed.response;
    const payload = parsed.payload as Record<string, unknown>;

    const planCode = String(payload["planCode"] ?? "");
    const billingInterval = String(payload["billingInterval"] ?? "month") as SaasBillingInterval;
    const companyName = String(payload["companyName"] ?? "");
    const workEmail = String(payload["workEmail"] ?? "");
    const appUrl = process.env["NEXT_PUBLIC_APP_URL"]?.trim() || "http://localhost:3000";
    const successUrl =
      typeof payload["successUrl"] === "string"
        ? payload["successUrl"]
        : `${appUrl}/acquire/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl =
      typeof payload["cancelUrl"] === "string"
        ? payload["cancelUrl"]
        : `${appUrl}/acquire/canceled`;

    const session = await createPublicSaasCheckoutSession({
      planCode,
      billingInterval,
      companyName,
      workEmail,
      successUrl,
      cancelUrl
    });

    emitAcqFunnelEvent(ACQ_FUNNEL_EVENTS.checkoutStarted, {
      plan_code: session.planCode,
      interval: session.billingInterval,
      session_id: session.sessionId,
      sandbox: session.sandbox
    });
    log("info", "acq_checkout_session_created", {
      planCode: session.planCode,
      interval: session.billingInterval,
      sessionId: session.sessionId,
      opportunityId: session.opportunityId,
      sandbox: session.sandbox
    });

    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    if (error instanceof PublicCheckoutError) {
      log("warn", "acq_checkout_rejected", {
        code: error.code,
        message: error.message
      });
      return apiError(error.httpStatus, error.code, error.message);
    }
    log("error", "acq_checkout_failed", {
      message: error instanceof Error ? error.message : "unknown"
    });
    return apiInternalError();
  }
}
