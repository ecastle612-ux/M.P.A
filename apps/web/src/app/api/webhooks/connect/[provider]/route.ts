import { NextResponse } from "next/server";
import { apiError, parseJsonBody } from "../../../../../lib/api/http";
import { applyConnectProviderWebhook } from "../../../../../lib/owner-payouts/service";

type RouteContext = { params: Promise<{ provider: string }> };

const ALLOWED = ["stripe", "noop"];

/**
 * FIN-003 Connect account webhooks only.
 * Never share secrets or handlers with /api/webhooks/payments or /api/webhooks/saas.
 */
export async function POST(request: Request, context: RouteContext) {
  try {
    const { provider } = await context.params;
    if (!ALLOWED.includes(provider)) {
      return apiError(404, "UNKNOWN_PROVIDER", "Unknown Connect provider");
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

    const result = await applyConnectProviderWebhook(provider, payload, headers);
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
    if (!["stripe", "noop"].includes(provider)) {
      return apiError(400, "UNSUPPORTED", "Simulate only for stripe/noop");
    }
    if (process.env["NODE_ENV"] === "production" && process.env["STRIPE_ALLOW_SIMULATE"] !== "true") {
      return apiError(403, "FORBIDDEN", "Simulate disabled in production");
    }

    const parsed = await parseJsonBody(request);
    if (!parsed.ok) return parsed.response;
    const payload = parsed.payload as Record<string, unknown>;
    const externalAccountId =
      typeof payload["externalAccountId"] === "string" ? payload["externalAccountId"] : null;
    if (!externalAccountId) return apiError(400, "INVALID_PAYLOAD", "externalAccountId required");

    const result = await applyConnectProviderWebhook(
      provider,
      {
        id: typeof payload["id"] === "string" ? payload["id"] : `sim-connect-${Date.now()}`,
        type: typeof payload["type"] === "string" ? payload["type"] : "account.updated",
        data: { object: { id: externalAccountId } }
      },
      { "x-mpa-simulate": "1", "x-mpa-raw-body": "{}" }
    );
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Simulate failed";
    return apiError(400, "SIMULATE_FAILED", message);
  }
}
