import { NextResponse } from "next/server";
import { captureException } from "../../../../lib/observability";
import type { CaptureExceptionOptions } from "../../../../lib/observability";
import { requestIdFromHeaders } from "../../../../lib/observability/request-context";
import { consumeRateLimit, requestActorKey } from "../../../../lib/security/durable-rate-limit";

export const runtime = "nodejs";

const MAX_CLIENT_REPORT_BYTES = 8192;

function sanitizeClientRoute(value: unknown): string {
  if (typeof value !== "string") return "client-boundary";
  const trimmed = value.trim().slice(0, 200);
  if (!trimmed.startsWith("/") || trimmed.includes("://") || trimmed.includes("\n")) {
    return "client-boundary";
  }
  return trimmed.split("?")[0] ?? "client-boundary";
}

/**
 * STAB-006 / SEC-001 — client error boundary reports.
 * Unauthenticated reports are console/Sentry only. Never persist attacker-controlled
 * org/user identifiers. Not a generic anonymous logging database.
 */
export async function POST(request: Request) {
  const requestId = requestIdFromHeaders(request.headers);
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_CLIENT_REPORT_BYTES) {
    return NextResponse.json({ error: "payload_too_large" }, { status: 413 });
  }

  if (!(await consumeRateLimit({ class: "PUBLIC", key: `client-report:${requestActorKey(request)}` }))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const raw = await request.text().catch(() => "");
  if (raw.length > MAX_CLIENT_REPORT_BYTES) {
    return NextResponse.json({ error: "payload_too_large" }, { status: 413 });
  }

  let body: {
    message?: string;
    name?: string;
    stack?: string;
    route?: string;
    organizationId?: string;
    userId?: string;
  } = {};
  try {
    body = raw ? (JSON.parse(raw) as typeof body) : {};
  } catch {
    body = {};
  }

  const message = typeof body.message === "string" ? body.message.slice(0, 1000) : "Client error";
  const err = new Error(message);
  if (typeof body.name === "string") err.name = body.name.slice(0, 200);
  if (typeof body.stack === "string") err.stack = body.stack.slice(0, 4000);

  let actorId: string | undefined;
  try {
    const { createAuthServerClient } = await import("../../../../lib/auth/server");
    const supabase = await createAuthServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    actorId = user?.id;
  } catch {
    actorId = undefined;
  }

  const options: CaptureExceptionOptions = {
    severity: "error",
    requestId,
    route: sanitizeClientRoute(body.route),
    source: "client",
    persistDurable: Boolean(actorId),
    ...(actorId ? { actorId } : {})
  };
  captureException(err, options);

  return NextResponse.json(
    { ok: true, requestId },
    { headers: { "x-request-id": requestId, "Cache-Control": "no-store" } }
  );
}
