import { scrubString } from "./scrub";
import type { ErrorSeverity } from "./types";

/**
 * Optional Sentry store API sink. No SDK dependency required for local/dev.
 * Configured only when SENTRY_DSN (or NEXT_PUBLIC_SENTRY_DSN) is present.
 */
export function getSentryDsn(): string | null {
  const dsn =
    process.env["SENTRY_DSN"]?.trim() || process.env["NEXT_PUBLIC_SENTRY_DSN"]?.trim() || "";
  return dsn.length > 0 ? dsn : null;
}

export function getSentryEnvironment(): string {
  return (
    process.env["SENTRY_ENVIRONMENT"]?.trim() ||
    process.env["VERCEL_ENV"]?.trim() ||
    process.env["NODE_ENV"] ||
    "development"
  );
}

type ParsedDsn = {
  publicKey: string;
  host: string;
  projectId: string;
};

export function parseSentryDsn(dsn: string): ParsedDsn | null {
  try {
    const url = new URL(dsn);
    const publicKey = decodeURIComponent(url.username);
    const projectId = url.pathname.replace(/^\//, "").split("/")[0] ?? "";
    if (!publicKey || !projectId || !url.host) {
      return null;
    }
    return { publicKey, host: url.host, projectId };
  } catch {
    return null;
  }
}

export async function forwardToSentry(input: {
  message: string;
  errorName?: string;
  stack?: string;
  severity: ErrorSeverity;
  requestId?: string;
  organizationId?: string;
  route?: string;
  metadata?: Record<string, string>;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const dsn = getSentryDsn();
  if (!dsn) {
    return { ok: false, error: "Sentry DSN not configured" };
  }
  const parsed = parseSentryDsn(dsn);
  if (!parsed) {
    return { ok: false, error: "Invalid Sentry DSN" };
  }

  const level =
    input.severity === "critical" || input.severity === "error"
      ? "error"
      : input.severity === "warning"
        ? "warning"
        : "info";

  const event = {
    event_id: crypto.randomUUID().replaceAll("-", ""),
    timestamp: Date.now() / 1000,
    platform: "node",
    level,
    environment: getSentryEnvironment(),
    server_name: process.env["VERCEL_URL"] ?? "mpa-web",
    release: process.env["VERCEL_GIT_COMMIT_SHA"] ?? undefined,
    message: scrubString(input.message).slice(0, 1000),
    exception: input.stack
      ? {
          values: [
            {
              type: scrubString(input.errorName ?? "Error").slice(0, 200),
              value: scrubString(input.message).slice(0, 1000),
              stacktrace: {
                frames: scrubString(input.stack)
                  .split("\n")
                  .slice(0, 30)
                  .map((line) => ({ filename: line.trim() }))
              }
            }
          ]
        }
      : undefined,
    tags: {
      request_id: input.requestId ?? undefined,
      organization_id: input.organizationId ?? undefined,
      route: input.route ?? undefined
    },
    extra: input.metadata ?? {}
  };

  const envelopeHeader = JSON.stringify({
    dsn,
    sent_at: new Date().toISOString()
  });
  const itemHeader = JSON.stringify({ type: "event", content_type: "application/json" });
  const body = `${envelopeHeader}\n${itemHeader}\n${JSON.stringify(event)}`;

  try {
    const response = await fetch(
      `https://${parsed.host}/api/${parsed.projectId}/envelope/?sentry_key=${encodeURIComponent(parsed.publicKey)}&sentry_version=7`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-sentry-envelope" },
        body
      }
    );
    if (!response.ok) {
      return { ok: false, error: `Sentry HTTP ${response.status}` };
    }
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Sentry forward failed"
    };
  }
}
