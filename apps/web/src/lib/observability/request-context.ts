import { randomUUID } from "node:crypto";

export function createRequestId(existing?: string | null): string {
  const value = existing?.trim();
  if (value && value.length <= 128) {
    return value;
  }
  return randomUUID();
}

export function requestIdFromHeaders(headers: Headers): string {
  return createRequestId(
    headers.get("x-request-id") ?? headers.get("x-correlation-id") ?? headers.get("x-vercel-id")
  );
}

export function routeFromRequest(request: Request): string {
  try {
    const url = new URL(request.url);
    return `${request.method} ${url.pathname}`;
  } catch {
    return request.method;
  }
}
