import { NextResponse } from "next/server";
import { apiError, apiInternalError, parseJsonBody } from "../../../../../lib/api/http";
import { applyProviderWebhook } from "../../../../../lib/signature/server";

type RouteContext = { params: Promise<{ provider: string }> };

const ALLOWED = ["signwell", "noop", "docusign", "adobe_sign", "signnow", "pandadoc"];

export async function POST(request: Request, context: RouteContext) {
  try {
    const { provider } = await context.params;
    if (!ALLOWED.includes(provider)) {
      return apiError(404, "UNKNOWN_PROVIDER", "Unknown signature provider");
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
    if (message.toLowerCase().includes("signature") || message.toLowerCase().includes("webhook")) {
      return apiError(401, "INVALID_SIGNATURE", message);
    }
    return apiError(400, "WEBHOOK_FAILED", message);
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { provider } = await context.params;
    if (!["signwell", "noop"].includes(provider)) {
      return apiError(400, "UNSUPPORTED", "Simulate only for signwell/noop");
    }
    if (process.env["NODE_ENV"] === "production" && process.env["SIGNWELL_ALLOW_SIMULATE"] !== "true") {
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
        type: "document_completed",
        event: {
          type: "document_completed",
          time: Math.floor(Date.now() / 1000),
          hash: `sim-${Date.now()}`
        },
        externalReference,
        data: { object: { id: externalReference, status: "Completed" } }
      },
      { "x-mpa-simulate": "1", "x-mpa-raw-body": "{}" }
    );
    return NextResponse.json({ ok: true, ...result });
  } catch {
    return apiInternalError();
  }
}
