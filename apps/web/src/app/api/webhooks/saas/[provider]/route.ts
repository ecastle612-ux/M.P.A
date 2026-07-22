import { NextResponse } from "next/server";
import { apiError, parseJsonBody } from "../../../../../lib/api/http";
import { applySaasProviderWebhook } from "../../../../../lib/saas/server";

type RouteContext = { params: Promise<{ provider: string }> };

const ALLOWED = ["stripe", "noop"];

/**
 * BILL-001 SaaS Billing webhooks.
 * Must never call billing/server (rent) or Connect apply handlers.
 */
export async function POST(request: Request, context: RouteContext) {
  try {
    const { provider } = await context.params;
    if (!ALLOWED.includes(provider)) {
      return apiError(404, "UNKNOWN_PROVIDER", "Unknown SaaS billing provider");
    }

    const rawBody = await request.text();
    let payload: unknown = {};
    try {
      payload = rawBody ? JSON.parse(rawBody) : {};
    } catch {
      payload = { raw: rawBody };
    }

    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });
    headers["x-mpa-raw-body"] = rawBody;

    const result = await applySaasProviderWebhook(provider, payload, headers);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook failed";
    if (message.toLowerCase().includes("signature")) {
      return apiError(401, "INVALID_SIGNATURE", message);
    }
    return apiError(400, "WEBHOOK_FAILED", message);
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { provider } = await context.params;
    if (!ALLOWED.includes(provider)) {
      return apiError(400, "UNSUPPORTED", "Simulate only for stripe/noop");
    }
    if (process.env["NODE_ENV"] === "production" && process.env["STRIPE_ALLOW_SIMULATE"] !== "true") {
      return apiError(403, "FORBIDDEN", "Simulate disabled in production");
    }

    const parsed = await parseJsonBody(request);
    if (!parsed.ok) return parsed.response;
    const payload = parsed.payload as Record<string, unknown>;

    const result = await applySaasProviderWebhook(
      provider,
      {
        id: typeof payload["id"] === "string" ? payload["id"] : `sim-saas-${Date.now()}`,
        type: typeof payload["type"] === "string" ? payload["type"] : "subscription_upsert",
        organizationId:
          typeof payload["organizationId"] === "string" ? payload["organizationId"] : undefined,
        externalCustomerId:
          typeof payload["externalCustomerId"] === "string"
            ? payload["externalCustomerId"]
            : undefined,
        externalSubscriptionId:
          typeof payload["externalSubscriptionId"] === "string"
            ? payload["externalSubscriptionId"]
            : undefined,
        planCode: typeof payload["planCode"] === "string" ? payload["planCode"] : "professional",
        status: typeof payload["status"] === "string" ? payload["status"] : "active"
      },
      { "x-mpa-simulate": "1", "x-mpa-raw-body": "{}" }
    );
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Simulate failed";
    return apiError(400, "SIMULATE_FAILED", message);
  }
}
