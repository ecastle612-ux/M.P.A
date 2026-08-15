import { beforeEach, describe, expect, it, vi } from "vitest";

const resendCalls: Array<Record<string, unknown>> = [];

vi.mock("../../../../../lib/env/server-env", () => ({
  serverEnv: {
    SUPABASE_SERVICE_ROLE_KEY: "test_service_role"
  }
}));

vi.mock("../../../../../lib/auth/server", () => ({
  createAuthServerClient: async () => ({
    auth: {
      getUser: async () => ({ data: { user: { id: "op-1", email: "op@example.com" } } })
    }
  })
}));

vi.mock("../../../../../lib/commercial/server", () => ({
  isPlatformOperatorUser: async () => true
}));

vi.mock("../../../../../lib/admin/impersonation-service", () => ({
  writeSupportAudit: async () => undefined
}));

vi.mock("../../../../../lib/supabase/service-role", () => ({
  createServiceRoleClient: () => ({ kind: "service_role" })
}));

vi.mock("../../../../../lib/team/invitation-service", () => ({
  invitationNoticeCopy: () => "Invitation created. Copy the accept link (email provider not configured).",
  InvitationCreateError: class InvitationCreateError extends Error {
    status = 400;
  },
  resendInvitationEmail: async (args: Record<string, unknown>) => {
    resendCalls.push(args);
    return {
      invitationId: "inv-1",
      organizationId: "org-1",
      email: "sarah@example.com",
      emailStatus: "sent",
      deliveryStatus: "sent",
      acceptUrl: "http://localhost:3000/accept-invitation/tok"
    };
  }
}));

import { POST } from "./route";

describe("support resend invitation", () => {
  beforeEach(() => {
    resendCalls.length = 0;
  });

  it("calls the invitation sender instead of only resetting columns", async () => {
    const response = await POST(
      new Request("http://localhost/api", {
        method: "POST",
        body: JSON.stringify({ invitationId: "inv-1" })
      })
    );
    expect(response.status).toBe(200);
    expect(resendCalls).toHaveLength(1);
    expect(resendCalls[0]?.["invitationId"]).toBe("inv-1");
    const payload = (await response.json()) as { deliveryStatus: string; notice: string };
    expect(payload.deliveryStatus).toBe("sent");
    expect(payload.notice).toMatch(/sent/i);
    expect(payload.notice).not.toMatch(/queued/i);
  });
});
