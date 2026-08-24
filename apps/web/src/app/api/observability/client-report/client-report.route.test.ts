import { beforeEach, describe, expect, it, vi } from "vitest";

const captureMock = vi.fn();

vi.mock("../../../../lib/observability", () => ({
  captureException: (...args: unknown[]) => captureMock(...args)
}));

vi.mock("../../../../lib/auth/server", () => ({
  createAuthServerClient: async () => ({
    auth: { getUser: async () => ({ data: { user: null } }) }
  })
}));

import { POST } from "./route";
import { clearDurableRateLimitForTests } from "../../../../lib/security/durable-rate-limit";

describe("SEC-001 client-report", () => {
  beforeEach(() => {
    captureMock.mockReset();
    clearDurableRateLimitForTests();
  });

  it("does not persist unauthenticated reports or trust payload org/user ids", async () => {
    const res = await POST(
      new Request("http://localhost/api/observability/client-report", {
        method: "POST",
        headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.9" },
        body: JSON.stringify({
          message: "boom",
          organizationId: "org-attacker",
          userId: "user-attacker",
          route: "/pm/properties"
        })
      })
    );
    expect(res.status).toBe(200);
    expect(captureMock).toHaveBeenCalledTimes(1);
    const options = captureMock.mock.calls[0]?.[1] as {
      persistDurable?: boolean;
      organizationId?: string;
      actorId?: string;
      route?: string;
    };
    expect(options.persistDurable).toBe(false);
    expect(options.organizationId).toBeUndefined();
    expect(options.actorId).toBeUndefined();
    expect(options.route).toBe("/pm/properties");
  });

  it("rejects oversized bodies", async () => {
    const res = await POST(
      new Request("http://localhost/api/observability/client-report", {
        method: "POST",
        headers: { "content-length": "9000" },
        body: "x"
      })
    );
    expect(res.status).toBe(413);
    expect(captureMock).not.toHaveBeenCalled();
  });

  it("rate-limits anonymous reports", async () => {
    let limited = 0;
    for (let i = 0; i < 16; i += 1) {
      const res = await POST(
        new Request("http://localhost/api/observability/client-report", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-forwarded-for": "198.51.100.77"
          },
          body: JSON.stringify({ message: "x" })
        })
      );
      if (res.status === 429) limited += 1;
    }
    expect(limited).toBeGreaterThan(0);
  });
});
