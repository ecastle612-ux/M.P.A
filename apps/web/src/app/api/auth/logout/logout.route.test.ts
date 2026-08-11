import { describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { IMPERSONATION_COOKIE, IMPERSONATION_MODE_COOKIE } from "@mpa/shared";
import { ACTIVE_ORGANIZATION_COOKIE } from "../../../../lib/organization/contracts";

vi.mock("../../../../lib/auth/server", () => ({
  createAuthServerClient: vi.fn(async () => ({
    auth: {
      signOut: vi.fn(async () => ({ error: null }))
    }
  }))
}));

import { POST } from "./route";

describe("STAB-011 logout cookie hygiene", () => {
  it("clears org, impersonation, and demo cookies", async () => {
    const request = new Request("https://example.com/api/auth/logout", {
      method: "POST",
      headers: { origin: "https://example.com" }
    });
    Object.defineProperty(request, "nextUrl", {
      value: new URL("https://example.com/api/auth/logout")
    });

    const response = await POST(request as NextRequest);
    expect(response.status).toBe(200);
    const setCookie = response.headers.getSetCookie?.() ?? [];
    const blob = setCookie.join("\n");
    expect(blob).toContain(`${ACTIVE_ORGANIZATION_COOKIE}=`);
    expect(blob).toContain(`${IMPERSONATION_COOKIE}=`);
    expect(blob).toContain(`${IMPERSONATION_MODE_COOKIE}=`);
    expect(blob).toMatch(/Max-Age=0/i);
  });
});
