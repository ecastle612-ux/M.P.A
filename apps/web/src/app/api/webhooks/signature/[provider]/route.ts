import { NextResponse } from "next/server";
import { apiError, apiInternalError, parseJsonBody } from "../../../../../lib/api/http";
import { applyProviderWebhook } from "../../../../../lib/signature/server";

type RouteContext = { params: Promise<{ provider: string }> };

const ALLOWED = ["dropbox_sign", "hellosign", "noop", "docusign", "adobe_sign", "signnow", "pandadoc"];

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
      // Dropbox Sign may send form-encoded events in some modes
      payload = { raw: rawBody };
    }

    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });
    headers["x-mpa-raw-body"] = rawBody;

    const result = await applyProviderWebhook(provider === "hellosign" ? "dropbox_sign" : provider, payload, headers);
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
    if (!["dropbox_sign", "hellosign", "noop"].includes(provider)) {
      return apiError(400, "UNSUPPORTED", "Simulate only for dropbox_sign/noop");
    }
    if (process.env["NODE_ENV"] === "production" && process.env["DROPBOX_SIGN_ALLOW_SIMULATE"] !== "true") {
      return apiError(403, "FORBIDDEN", "Simulate disabled in production");
    }

    const parsed = await parseJsonBody(request);
    if (!parsed.ok) return parsed.response;
    const payload = parsed.payload as Record<string, unknown>;
    const externalReference =
      typeof payload["externalReference"] === "string" ? payload["externalReference"] : null;
    if (!externalReference) return apiError(400, "INVALID_PAYLOAD", "externalReference required");

    const result = await applyProviderWebhook(
      provider === "hellosign" ? "dropbox_sign" : provider,
      {
        id: `sim-${Date.now()}`,
        type: "signature_request_all_signed",
        event_type: "signature_request_all_signed",
        externalReference,
        signature_request: { signature_request_id: externalReference, is_complete: true }
      },
      { "x-mpa-simulate": "1", "x-mpa-raw-body": "{}" }
    );
    return NextResponse.json({ ok: true, ...result });
  } catch {
    return apiInternalError();
  }
}
