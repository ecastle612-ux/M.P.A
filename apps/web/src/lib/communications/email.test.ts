import { afterEach, describe, expect, it, vi } from "vitest";

const sendResendHttpEmail = vi.fn();

vi.mock("@mpa/email", () => ({
  renderFoundationEmail: () => "<html></html>",
  sendResendHttpEmail: (...args: unknown[]) => sendResendHttpEmail(...args)
}));

import { sendOperationalNoticeEmail } from "./email";

describe("operational notice email", () => {
  const original = {
    key: process.env["RESEND_API_KEY"],
    from: process.env["RESEND_FROM_EMAIL"],
    appUrl: process.env["NEXT_PUBLIC_APP_URL"],
    vercel: process.env["VERCEL_ENV"]
  };

  afterEach(() => {
    restore("RESEND_API_KEY", original.key);
    restore("RESEND_FROM_EMAIL", original.from);
    restore("NEXT_PUBLIC_APP_URL", original.appUrl);
    restore("VERCEL_ENV", original.vercel);
    sendResendHttpEmail.mockReset();
  });

  it("does not claim sent when the provider is not configured", async () => {
    delete process.env["RESEND_API_KEY"];
    delete process.env["RESEND_FROM_EMAIL"];
    delete process.env["VERCEL_ENV"];
    const result = await sendOperationalNoticeEmail({
      to: "uat.tenant@example.com",
      subject: "Work order update",
      body: "Assigned"
    });
    expect(result).toEqual({ ok: false, error: "Email provider is not configured" });
    expect(sendResendHttpEmail).not.toHaveBeenCalled();
  });

  it("sends from the derived verified domain in production", async () => {
    process.env["RESEND_API_KEY"] = "re_test_key";
    delete process.env["RESEND_FROM_EMAIL"];
    process.env["VERCEL_ENV"] = "production";
    process.env["NEXT_PUBLIC_APP_URL"] = "https://www.my-property-assistant.com";
    sendResendHttpEmail.mockResolvedValue({ ok: true, providerId: "re_123" });

    const result = await sendOperationalNoticeEmail({
      to: "uat.tenant@example.com",
      subject: "Work order update",
      body: "Assigned",
      idempotencyKey: "maintenance:work_order.assigned:user:wo"
    });

    expect(result).toEqual({ ok: true, providerId: "re_123" });
    expect(sendResendHttpEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "My Property Assistant <noreply@my-property-assistant.com>",
        to: "uat.tenant@example.com",
        idempotencyKey: "maintenance:work_order.assigned:user:wo"
      })
    );
  });
});

function restore(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}
