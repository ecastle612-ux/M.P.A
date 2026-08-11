import { afterEach, describe, expect, it, vi } from "vitest";
import { reportApiFailure } from "./api-error";
import { captureException, resolveSeverity } from "./errors";
import { scrubMetadata, scrubString } from "./scrub";
import { parseSentryDsn } from "./sentry-sink";
import { createRequestId, routeFromRequest } from "./request-context";

describe("STAB-006 observability scrubbing", () => {
  it("redacts emails, bearer tokens, and secret-looking keys", () => {
    expect(scrubString("contact me@example.com please")).toContain("[redacted-email]");
    expect(scrubString("Bearer abc.def.ghi")).toContain("[redacted]");
    expect(scrubString("sk_test_12345678901234567890")).toContain("[redacted-key]");
    const meta = scrubMetadata({
      password: "hunter2",
      route: "/api/facility/operations",
      note: "ok"
    });
    expect(meta["password"]).toBe("[redacted]");
    expect(meta["route"]).toBe("/api/facility/operations");
    expect(meta["note"]).toBe("ok");
  });

  it("parses Sentry DSN host and project", () => {
    const parsed = parseSentryDsn("https://pubkey@o123.ingest.sentry.io/456");
    expect(parsed).toEqual({
      publicKey: "pubkey",
      host: "o123.ingest.sentry.io",
      projectId: "456"
    });
  });

  it("creates request ids and route labels", () => {
    expect(createRequestId("abc-123")).toBe("abc-123");
    expect(createRequestId("").length).toBeGreaterThan(10);
    const request = new Request("https://example.com/api/pm/maintenance/cancel", {
      method: "POST"
    });
    expect(routeFromRequest(request)).toBe("POST /api/pm/maintenance/cancel");
  });

  it("defaults severity to error", () => {
    expect(resolveSeverity()).toBe("error");
    expect(resolveSeverity({ severity: "critical" })).toBe("critical");
  });
});

describe("STAB-006 captureException fail-open", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("logs without throwing when sinks are unavailable", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(() =>
      captureException(new Error("boom sk_live_abcdefghijklmnopqrstuv"), {
        route: "POST /api/test",
        organizationId: "org_1",
        requestId: "req_1",
        severity: "critical",
        metadata: { stripe_secret: "should-redact", detail: "safe" }
      })
    ).not.toThrow();
    expect(errorSpy).toHaveBeenCalled();
    const payload = errorSpy.mock.calls[0]?.[0] as Record<string, string>;
    expect(payload["message"]).toContain("[redacted-key]");
    expect(payload["stripe_secret"]).toBe("[redacted]");
    expect(payload["detail"]).toBe("safe");
    expect(payload["organizationId"]).toBe("org_1");
    expect(payload["requestId"]).toBe("req_1");
  });

  it("reportApiFailure returns requestId and status", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const response = reportApiFailure({
      request: new Request("https://example.com/api/x", { method: "GET" }),
      error: new Error("db down"),
      organizationId: "org_9",
      status: 500,
      publicMessage: "Internal error"
    });
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe("Internal error");
    expect(typeof body.requestId).toBe("string");
    expect(response.headers.get("x-request-id")).toBe(body.requestId);
  });
});
