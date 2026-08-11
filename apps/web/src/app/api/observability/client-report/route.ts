import { NextResponse } from "next/server";
import { captureException } from "../../../../lib/observability";
import type { CaptureExceptionOptions } from "../../../../lib/observability";
import { requestIdFromHeaders } from "../../../../lib/observability/request-context";

/**
 * STAB-006 — client error boundary reports (scrubbed). Fail-open; no auth required.
 * Does not accept secrets; payload is scrubbed again server-side.
 */
export async function POST(request: Request) {
  const requestId = requestIdFromHeaders(request.headers);
  const body = (await request.json().catch(() => ({}))) as {
    message?: string;
    name?: string;
    stack?: string;
    route?: string;
    organizationId?: string;
  };

  const message = typeof body.message === "string" ? body.message.slice(0, 1000) : "Client error";
  const err = new Error(message);
  if (typeof body.name === "string") err.name = body.name.slice(0, 200);
  if (typeof body.stack === "string") err.stack = body.stack.slice(0, 8000);

  const options: CaptureExceptionOptions = {
    severity: "error",
    requestId,
    route: typeof body.route === "string" ? body.route.slice(0, 500) : "client-boundary",
    source: "client"
  };
  if (typeof body.organizationId === "string" && body.organizationId.length > 0) {
    options.organizationId = body.organizationId;
  }
  captureException(err, options);

  return NextResponse.json(
    { ok: true, requestId },
    { headers: { "x-request-id": requestId, "Cache-Control": "no-store" } }
  );
}
