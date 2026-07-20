import { afterEach, describe, expect, it, vi } from "vitest";
import { getEmailProvider, getEmailProviderKey } from "./registry";
import { sendWorkflowEmail } from "./delivery";

describe("email provider registry", () => {
  afterEach(() => {
    delete process.env["EMAIL_PROVIDER"];
    delete process.env["RESEND_API_KEY"];
    delete process.env["EMAIL_FROM"];
    vi.unstubAllGlobals();
  });

  it("defaults to noop", () => {
    delete process.env["EMAIL_PROVIDER"];
    expect(getEmailProviderKey()).toBe("noop");
    expect(getEmailProvider().key).toBe("noop");
  });

  it("skips sends in noop mode with audit-safe result", async () => {
    process.env["EMAIL_PROVIDER"] = "noop";
    const result = await sendWorkflowEmail({
      organizationId: "org-1",
      templateKey: "general_notification",
      idempotencyKey: `org-1:test:noop:${Date.now()}`,
      to: { email: "resident@example.com" },
      subject: "Hello",
      body: "Body"
    });
    expect(result.status).toBe("skipped");
    expect(result.errorCode).toBe("provider_noop");
  });

  it("fails closed on invalid recipient without calling Resend", async () => {
    process.env["EMAIL_PROVIDER"] = "resend";
    process.env["RESEND_API_KEY"] = "re_test_key";
    process.env["EMAIL_FROM"] = "MPA <noreply@example.com>";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await getEmailProvider().sendEmail({
      organizationId: "org-1",
      idempotencyKey: "k1",
      templateKey: "general_notification",
      to: { email: "not-an-email" },
      subject: "x",
      html: "<p>x</p>"
    });

    expect(result.status).toBe("failed");
    expect(result.errorCode).toBe("invalid_recipient");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("requires configuration for resend", async () => {
    process.env["EMAIL_PROVIDER"] = "resend";
    delete process.env["RESEND_API_KEY"];
    delete process.env["EMAIL_FROM"];
    const result = await getEmailProvider().sendEmail({
      organizationId: "org-1",
      idempotencyKey: "k2",
      templateKey: "general_notification",
      to: { email: "ok@example.com" },
      subject: "x",
      html: "<p>x</p>"
    });
    expect(result.status).toBe("failed");
    expect(result.errorCode).toBe("configuration_error");
  });

  it("deduplicates identical idempotency keys", async () => {
    process.env["EMAIL_PROVIDER"] = "noop";
    const key = `org-1:dedupe:${Date.now()}`;
    const first = await sendWorkflowEmail({
      organizationId: "org-1",
      templateKey: "welcome_email",
      idempotencyKey: key,
      to: { email: "a@example.com" },
      subject: "Welcome",
      body: "Hi"
    });
    const second = await sendWorkflowEmail({
      organizationId: "org-1",
      templateKey: "welcome_email",
      idempotencyKey: key,
      to: { email: "a@example.com" },
      subject: "Welcome",
      body: "Hi"
    });
    expect(first.status).toBe("skipped");
    expect(second.status).toBe("skipped");
    expect(second.rawSafe?.["deduplicated"]).toBe(true);
  });

  it("never routes password_reset through Resend", async () => {
    process.env["EMAIL_PROVIDER"] = "resend";
    process.env["RESEND_API_KEY"] = "re_test_key";
    process.env["EMAIL_FROM"] = "MPA <noreply@example.com>";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const result = await sendWorkflowEmail({
      organizationId: "org-1",
      templateKey: "password_reset",
      idempotencyKey: `org-1:password_reset:${Date.now()}`,
      to: { email: "a@example.com" },
      subject: "Reset",
      body: "Reset"
    });
    expect(result.status).toBe("skipped");
    expect(result.errorCode).toBe("password_reset_via_supabase_auth");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
