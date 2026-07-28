import { NextResponse } from "next/server";
import { apiError, parseJsonBody } from "../../../../../lib/api/http";
import {
  PublicCheckoutError,
  simulatePublicCheckoutProvision
} from "../../../../../lib/saas/public-checkout";
import { isPublicSelfServePlan, type AcqSelfServePlan } from "../../../../../lib/acquire/decisions";

/**
 * Sandbox/noop only — completes public Checkout provision without Stripe webhooks.
 */
export async function POST(request: Request) {
  try {
    const parsed = await parseJsonBody(request);
    if (!parsed.ok) return parsed.response;
    const payload = parsed.payload as Record<string, unknown>;
    const sessionId = String(payload["sessionId"] ?? "");
    const companyName = String(payload["companyName"] ?? "");
    const workEmail = String(payload["workEmail"] ?? "");
    const planCode = String(payload["planCode"] ?? "professional");

    if (!isPublicSelfServePlan(planCode)) {
      return apiError(403, "INVALID_PLAN", "Plan is not available for public Checkout.");
    }

    const result = await simulatePublicCheckoutProvision({
      sessionId,
      companyName,
      workEmail,
      planCode: planCode as AcqSelfServePlan
    });

    return NextResponse.json({ ok: true, organizationId: result.organizationId });
  } catch (error) {
    if (error instanceof PublicCheckoutError) {
      return apiError(error.httpStatus, error.code, error.message);
    }
    const message = error instanceof Error ? error.message : "Simulation failed";
    return apiError(400, "SIMULATE_FAILED", message);
  }
}
