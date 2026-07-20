import { log } from "./logger";

/**
 * Application error hook (PR-001).
 * Structured logging only — no third-party APM required this sprint.
 * Swap transport later without changing call sites.
 */
export function captureException(
  error: unknown,
  metadata: Record<string, string> = {}
): void {
  const err = error instanceof Error ? error : new Error(String(error));
  log("error", err.message, {
    name: err.name,
    stack: err.stack?.slice(0, 2000) ?? "",
    ...metadata
  });
}

export function captureApiFailure(
  route: string,
  status: number,
  metadata: Record<string, string> = {}
): void {
  log("error", `API failure ${status} on ${route}`, {
    route,
    status: String(status),
    kind: "api_failure",
    ...metadata
  });
}

export function captureProviderFailure(
  provider: string,
  operation: string,
  metadata: Record<string, string> = {}
): void {
  log("error", `Provider failure: ${provider}.${operation}`, {
    provider,
    operation,
    kind: "provider_failure",
    ...metadata
  });
}
