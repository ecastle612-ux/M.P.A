import { NextResponse } from "next/server";
import { createAuthServerClient } from "../../../lib/auth/server";
import { evaluatePermission, resolveAuthorizationContext } from "../../../lib/auth/authorization";
import { resolveActiveOrganizationIdForUser } from "../../../lib/organization/server";
import { apiError, apiInternalError, parseJsonBody } from "../../../lib/api/http";
import type { SaasBillingInterval, SaasPlanCode } from "../../../lib/integrations/saas-billing/contracts";
import {
  createSaasCheckoutSession,
  createSaasPortalSession,
  getOrgSaasSnapshot,
  mirrorSandboxSubscription
} from "../../../lib/saas/server";

const PLAN_CODES: SaasPlanCode[] = ["trial", "founder", "professional", "business", "enterprise"];
const INTERVALS: SaasBillingInterval[] = ["month", "year"];

export async function GET() {
  try {
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Unauthenticated");

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) {
      return NextResponse.json({ snapshot: null }, { headers: { "Cache-Control": "no-store" } });
    }

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (!evaluatePermission(authorization, "saas:read")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const snapshot = await getOrgSaasSnapshot(organizationId, supabase);
    return NextResponse.json({ snapshot }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return apiInternalError();
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    if (!user) return apiError(401, "UNAUTHENTICATED", "Unauthenticated");

    const organizationId = await resolveActiveOrganizationIdForUser(user.id);
    if (!organizationId) return apiError(400, "NO_ACTIVE_ORGANIZATION", "No active organization");

    const authorization = await resolveAuthorizationContext(user, organizationId);
    if (!evaluatePermission(authorization, "saas:manage")) {
      return apiError(403, "FORBIDDEN", "Forbidden");
    }

    const parsed = await parseJsonBody(request);
    if (!parsed.ok) return parsed.response;
    const payload = parsed.payload as Record<string, unknown>;
    const action = typeof payload["action"] === "string" ? payload["action"] : "";

    if (action === "checkout") {
      const planCode = String(payload["planCode"] ?? "professional") as SaasPlanCode;
      const billingInterval = String(payload["billingInterval"] ?? "month") as SaasBillingInterval;
      if (!PLAN_CODES.includes(planCode)) return apiError(400, "INVALID_PLAN", "Invalid planCode");
      if (!INTERVALS.includes(billingInterval)) {
        return apiError(400, "INVALID_INTERVAL", "Invalid billingInterval");
      }
      const appUrl = process.env["NEXT_PUBLIC_APP_URL"]?.trim() || "http://localhost:3000";
      const successUrl =
        typeof payload["successUrl"] === "string"
          ? payload["successUrl"]
          : `${appUrl}/settings/billing?saas=success`;
      const cancelUrl =
        typeof payload["cancelUrl"] === "string"
          ? payload["cancelUrl"]
          : `${appUrl}/settings/billing?saas=cancel`;

      const session = await createSaasCheckoutSession(
        organizationId,
        user.id,
        {
          planCode: planCode === "trial" ? "professional" : planCode,
          billingInterval,
          successUrl,
          cancelUrl,
          email:
            typeof payload["email"] === "string"
              ? payload["email"]
              : (user.email ?? null),
          name: typeof payload["name"] === "string" ? payload["name"] : null,
          withTrial: planCode === "trial" || payload["withTrial"] === true
        },
        supabase
      );
      return NextResponse.json({ session });
    }

    if (action === "portal") {
      const appUrl = process.env["NEXT_PUBLIC_APP_URL"]?.trim() || "http://localhost:3000";
      const returnUrl =
        typeof payload["returnUrl"] === "string"
          ? payload["returnUrl"]
          : `${appUrl}/settings/billing`;
      const portal = await createSaasPortalSession(organizationId, user.id, returnUrl, supabase);
      return NextResponse.json({ portal });
    }

    if (action === "mirror_sandbox") {
      if (process.env["NODE_ENV"] === "production" && process.env["STRIPE_ALLOW_SIMULATE"] !== "true") {
        return apiError(403, "FORBIDDEN", "Sandbox mirror disabled in production");
      }
      const planCode = String(payload["planCode"] ?? "professional") as SaasPlanCode;
      if (!PLAN_CODES.includes(planCode)) return apiError(400, "INVALID_PLAN", "Invalid planCode");
      const status = payload["status"] === "trialing" ? "trialing" : "active";
      const subscription = await mirrorSandboxSubscription(organizationId, user.id, {
        planCode: planCode === "trial" ? "professional" : planCode,
        status
      });
      return NextResponse.json({ subscription });
    }

    return apiError(400, "UNKNOWN_ACTION", "Unknown action");
  } catch (error) {
    const message = error instanceof Error ? error.message : "SaaS request failed";
    if (message.toLowerCase().includes("already has an open")) {
      return apiError(409, "SUBSCRIPTION_EXISTS", message);
    }
    return apiError(400, "SAAS_FAILED", message);
  }
}
