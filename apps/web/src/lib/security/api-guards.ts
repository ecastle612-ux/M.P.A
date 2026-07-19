import { NextResponse, type NextRequest } from "next/server";
import { getClientIp } from "./request";
import { rateLimit, type RateLimitOptions } from "./rate-limit";

/**
 * Validate that a request's `Origin` matches the app origin. Requests without an `Origin`
 * header (same-site navigations, server-to-server) are allowed, preserving prior behavior.
 */
export function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).origin === request.nextUrl.origin;
  } catch {
    return false;
  }
}

/**
 * Apply a per-IP fixed-window rate limit for a route. Returns a `429` response with a
 * `Retry-After` header when the limit is exceeded, or `null` to continue.
 */
export function rateLimitGuard(
  request: NextRequest,
  routeKey: string,
  options: RateLimitOptions
): NextResponse | null {
  const result = rateLimit(`${routeKey}:${getClientIp(request)}`, options);
  if (result.allowed) return null;
  return NextResponse.json(
    { ok: false, error: "Too many requests" },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.retryAfterSeconds),
        "Cache-Control": "no-store"
      }
    }
  );
}
