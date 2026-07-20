import { NextResponse } from "next/server";
import { apiError, apiInternalError, parseJsonBody } from "../../../../../lib/api/http";
import { applyProviderWebhook } from "../../../../../lib/screening/server";

type RouteContext = { params: Promise<{ provider: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const { provider } = await context.params;
    if (!["checkr", "noop", "smartmove", "rentprep", "equifax"].includes(provider)) {
      return apiError(404, "UNKNOWN_PROVIDER", "Unknown screening provider");
    }

    const rawBody = await request.text();
    let payload: unknown = {};
    try {
      payload = rawBody ? JSON.parse(rawBody) : {};
    } catch {
      return apiError(400, "INVALID_JSON", "Invalid JSON body");
    }

    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });
    // Preserve raw body for HMAC when needed
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

/** Sandbox helper: simulate Checkr completion without external network */
export async function PUT(request: Request, context: RouteContext) {
  try {
    const { provider } = await context.params;
    if (provider !== "checkr" && provider !== "noop") {
      return apiError(400, "UNSUPPORTED", "Simulate only for checkr/noop");
    }
    if (process.env["NODE_ENV"] === "production" && process.env["CHECKR_ALLOW_SIMULATE"] !== "true") {
      return apiError(403, "FORBIDDEN", "Simulate disabled in production");
    }

    const parsed = await parseJsonBody(request);
    if (!parsed.ok) return parsed.response;
    const payload = parsed.payload as Record<string, unknown>;
    const externalReference =
      typeof payload["externalReference"] === "string" ? payload["externalReference"] : null;
    if (!externalReference) return apiError(400, "INVALID_PAYLOAD", "externalReference required");

    const result = await applyProviderWebhook(
      provider,
      {
        id: `sim-${Date.now()}`,
        type: "report.completed",
        externalReference,
        data: { id: externalReference, object: { id: externalReference } }
      },
      {}
    );
    return NextResponse.json({ ok: true, ...result });
  } catch {
    return apiInternalError();
  }
}
