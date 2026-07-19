import type { RuntimeEnvironment } from "./types";

export const REQUEST_ID_HEADER = "x-request-id";

/**
 * Resolve the runtime environment from `NODE_ENV`. Used to tag error and audit records.
 */
export function getEnvironment(): RuntimeEnvironment {
  const env = process.env["NODE_ENV"];
  if (env === "production") return "production";
  if (env === "test") return "test";
  return "development";
}

/**
 * Generate a correlation id. Prefers the platform `crypto.randomUUID` (available in the
 * browser, Node 22, and the edge runtime) and falls back to a non-cryptographic id.
 */
export function generateRequestId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    // fall through to non-crypto id
  }
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Read an inbound request id header, or mint a new one. Keeps a single correlation id
 * across middleware, route handlers, and logs.
 */
export function getRequestId(headers: { get(name: string): string | null }): string {
  const existing = headers.get(REQUEST_ID_HEADER);
  return existing && existing.length > 0 ? existing : generateRequestId();
}
