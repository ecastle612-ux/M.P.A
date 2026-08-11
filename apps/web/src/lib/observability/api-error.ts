import { NextResponse } from "next/server";
import { captureException } from "./errors";
import { requestIdFromHeaders, routeFromRequest } from "./request-context";
import type { CaptureExceptionOptions, ErrorSeverity } from "./types";

export function reportApiFailure(input: {
  request: Request;
  error: unknown;
  organizationId?: string | null;
  actorId?: string | null;
  severity?: ErrorSeverity;
  publicMessage?: string;
  status?: number;
}): NextResponse {
  const requestId = requestIdFromHeaders(input.request.headers);
  const route = routeFromRequest(input.request);
  const options: CaptureExceptionOptions = {
    severity: input.severity ?? (input.status && input.status >= 500 ? "critical" : "error"),
    requestId,
    route,
    source: "server"
  };
  if (input.organizationId) options.organizationId = input.organizationId;
  if (input.actorId) options.actorId = input.actorId;
  captureException(input.error, options);

  return NextResponse.json(
    {
      error:
        input.publicMessage ??
        (input.error instanceof Error ? input.error.message : "Request failed"),
      requestId
    },
    {
      status: input.status ?? 500,
      headers: {
        "x-request-id": requestId,
        "Cache-Control": "no-store"
      }
    }
  );
}
