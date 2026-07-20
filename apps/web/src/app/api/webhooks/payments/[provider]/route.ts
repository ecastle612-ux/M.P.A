import { NextResponse } from "next/server";
import { apiError, parseJsonBody } from "../../../../../lib/api/http";
import { applyProviderWebhook } from "../../../../../lib/billing/server";

type RouteContext = { params: Promise<{ provider: string }> };

const ALLOWED = ["stripe", "noop", "plaid_ach", "finix", "dwolla", "authorizenet"];

export async function POST(request: Request, context: RouteContext) {
  try {
    const { provider } = await context.params;
    if (!ALLOWED.includes(provider)) {
      return apiError(404, "UNKNOWN_PROVIDER", "Unknown payment provider");
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

    const result = await applyProviderWebhook(provider, payload, headers);
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
    const externalAttemptId =
      typeof payload["externalAttemptId"] === "string" ? payload["externalAttemptId"] : null;
    if (!externalAttemptId) return apiError(400, "INVALID_PAYLOAD", "externalAttemptId required");

    const result = await applyProviderWebhook(
      provider,
      {
        id: `sim-${Date.now()}`,
        type: typeof payload["type"] === "string" ? payload["type"] : "succeeded",
        externalAttemptId,
        amountCents: typeof payload["amountCents"] === "number" ? payload["amountCents"] : undefined,
        failureCode: typeof payload["failureCode"] === "string" ? payload["failureCode"] : undefined
      },
      { "x-mpa-simulate": "1", "x-mpa-raw-body": "{}" }
    );
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Simulate failed";
    return apiError(400, "SIMULATE_FAILED", message);
  }
}
